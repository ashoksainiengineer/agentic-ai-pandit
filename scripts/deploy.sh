#!/usr/bin/env bash
# =============================================================================
# Agentic AI-Pandit — Unified Deployment Script
# Handles Cloud Run (API, Ephemeris) deployment
# Frontend is deployed separately via Vercel.
#
# Usage:
#   scripts/deploy.sh                    # Deploy everything
#   scripts/deploy.sh api                # Deploy only API
#   scripts/deploy.sh ephemeris          # Deploy only Ephemeris
#   scripts/deploy.sh --dry-run          # Validate without deploying
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - Required env vars set
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

DRY_RUN=false
DEPLOY_TARGET="all"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    api|ephemeris) DEPLOY_TARGET="$arg" ;;
    *) echo "Usage: $0 [api|ephemeris] [--dry-run]"; exit 1 ;;
  esac
done

# ── Pre-flight checks ────────────────────────────────────────────────────────
run_preflight() {
  log_info "Running pre-flight checks..."
  local failed=0

  if [ ! -f "backend/Dockerfile" ]; then
    log_err "backend/Dockerfile not found"
    failed=1
  fi
  if [ ! -f "backend/ephemeris/Dockerfile" ]; then
    log_err "backend/ephemeris/Dockerfile not found"
    failed=1
  fi
  if [ -z "${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}" ]; then
    log_err "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is not set"
    failed=1
  fi
  if ! command -v gcloud >/dev/null 2>&1; then
    log_err "gcloud CLI not found"
    failed=1
  fi
  if [ $failed -ne 0 ]; then exit 1; fi
  log_ok "All pre-flight checks passed"
}

# ── Build + Deploy a Cloud Run service ───────────────────────────────────────
deploy_service() {
  local service_name="$1"
  local dockerfile="$2"
  local image_name="$3"
  local memory="$4"
  local cpu="$5"
  local concurrency="$6"
  local min_instances="$7"
  local max_instances="$8"
  local timeout="$9"
  local extra_env="${10:-}"
  local secrets="${11:-}"

  local project_id="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:?}}"
  local region="${CLOUD_RUN_REGION:-asia-southeast1}"
  local repo="${ARTIFACT_REGISTRY_REPO:-backend-images}"
  local tag="$(date +%Y%m%d-%H%M%S)"
  local image_uri="${region}-docker.pkg.dev/${project_id}/${repo}/${image_name}:${tag}"

  log_info "Building ${service_name}..."

  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would build: docker build -f ${dockerfile} -t ${image_uri} ."
    log_warn "[DRY RUN] Would deploy: gcloud run deploy ${service_name} --image ${image_uri} ..."
    return 0
  fi

  docker build -f "${dockerfile}" -t "${image_uri}" -t "${region}-docker.pkg.dev/${project_id}/${repo}/${image_name}:latest" .
  docker push "${image_uri}"

  log_info "Deploying ${service_name} to Cloud Run..."

  local deploy_cmd=(
    gcloud run deploy "${service_name}"
    --project="${project_id}"
    --region="${region}"
    --image="${image_uri}"
    --platform=managed
    --allow-unauthenticated
    --memory="${memory}"
    --cpu="${cpu}"
    --concurrency="${concurrency}"
    --min-instances="${min_instances}"
    --max-instances="${max_instances}"
    --timeout="${timeout}"
  )

  if [ -n "${extra_env}" ]; then
    deploy_cmd+=(--set-env-vars="${extra_env}")
  fi
  if [ -n "${secrets}" ]; then
    deploy_cmd+=(--set-secrets="${secrets}")
  fi

  "${deploy_cmd[@]}"
  log_ok "Deployed ${service_name}"
}

# ── Health check ─────────────────────────────────────────────────────────────
check_health() {
  local url="$1"
  local name="$2"
  log_info "Health check: ${name} (${url})"
  for i in $(seq 1 10); do
    if curl -sf "${url}/health" >/dev/null 2>&1; then
      log_ok "${name} is healthy"
      return 0
    fi
    log_warn "${name} not ready (attempt ${i}/10)..."
    sleep 5
  done
  log_err "${name} health check failed"
  return 1
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  echo "========================================"
  echo "  Agentic AI-Pandit Deployment"
  echo "========================================"
  echo "  Target:  ${DEPLOY_TARGET}"
  echo "  Dry Run: ${DRY_RUN}"
  echo ""

  run_preflight

  local project_id="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:?}}"
  local region="${CLOUD_RUN_REGION:-asia-southeast1}"

  # Shared secrets for API and BTR Worker
  local api_secrets="NEON_DATABASE_URL=neon-database-url:latest,REDIS_URL=redis-url:latest,CLERK_SECRET_KEY=clerk-secret-key:latest,GROQ_API_KEY=groq-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,DEEPSEEK_API_KEY=deepseek-api-key:latest,ENCRYPTION_SECRET=encryption-secret:latest,SENTRY_DSN=sentry-dsn:latest"

  if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "ephemeris" ]; then
    deploy_service \
      "ephemeris-service" \
      "backend/ephemeris/Dockerfile" \
      "ephemeris-service" \
      "1Gi" "1" "5" "0" "5" "300" \
      "APP_ENV=production"

    ephemeris_url=$(gcloud run services describe ephemeris-service \
      --project="${project_id}" --region="${region}" \
      --format='value(status.url)' 2>/dev/null || echo "")
    export EPHEMERIS_SERVICE_URL="${ephemeris_url}"
    log_info "Ephemeris URL: ${EPHEMERIS_SERVICE_URL}"
  fi

  if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "api" ]; then
    local ephemeris_ref="${EPHEMERIS_SERVICE_URL:-http://ephemeris-service}"
    deploy_service \
      "backend-api" \
      "backend/Dockerfile" \
      "backend-api" \
      "512Mi" "1" "20" "0" "10" "3600" \
      "APP_ENV=production,EPHEMERIS_SERVICE_URL=${ephemeris_ref},EPHEMERIS_SERVICE_TIMEOUT_MS=15000,USE_ASYNC_JOB_PIPELINE=true,JOB_EXECUTION_MODE=inline,GOOGLE_CLOUD_PROJECT=${project_id}" \
      "${api_secrets}"

    api_url=$(gcloud run services describe backend-api \
      --project="${project_id}" --region="${region}" \
      --format='value(status.url)' 2>/dev/null || echo "")
    if [ -n "${api_url}" ]; then
      check_health "${api_url}" "Backend API"
    fi
  fi

  echo ""
  echo "========================================"
  log_ok "Deployment complete!"
  echo "========================================"
  echo ""
  gcloud run services list --project="${project_id}" --region="${region}" \
    --format="table(metadata.name,status.url)" 2>/dev/null || true
}

main "$@"
