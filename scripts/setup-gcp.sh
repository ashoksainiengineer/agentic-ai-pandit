#!/usr/bin/env bash
# =============================================================================
# Agentic AI-Pandit — One-time GCP Setup Script
# Run this ONCE after creating the project to initialize infrastructure.
# =============================================================================
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-agentic-ai-pandit}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"

echo "Setting up GCP infrastructure for project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# ── 1. Enable required APIs ──────────────────────────────────────────────────
echo "[1/6] Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudtasks.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  --project="${PROJECT_ID}"

# ── 2. Create Artifact Registry repository ───────────────────────────────────
echo "[2/6] Creating Artifact Registry repository..."
gcloud artifacts repositories create backend-images \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Docker images for agentic-ai-pandit backend" \
  --project="${PROJECT_ID}" 2>/dev/null || echo "  Repository already exists, skipping."

# ── 3. Create GCS bucket for BTR archives ────────────────────────────────────
echo "[3/6] Creating GCS bucket for BTR archives..."
gcloud storage buckets create "gs://${PROJECT_ID}-btr-archive" \
  --location="${REGION}" \
  --uniform-bucket-level-access \
  --project="${PROJECT_ID}" 2>/dev/null || echo "  Bucket already exists, skipping."

# ── 4. Create Cloud Tasks queue ──────────────────────────────────────────────
echo "[4/6] Creating Cloud Tasks queue..."
gcloud tasks queues create btr-jobs \
  --location="${REGION}" \
  --max-attempts=3 \
  --max-backoff=60s \
  --max-concurrent-dispatches=10 \
  --project="${PROJECT_ID}" 2>/dev/null || echo "  Queue already exists, skipping."

# ── 5. Create Cloud Run services (initial deploy) ────────────────────────────
echo "[5/6] Creating Cloud Run services (initial stubs)..."
gcloud run deploy backend-api \
  --image="us-docker.pkg.dev/cloudrun/container/hello" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=20 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=3600 \
  --project="${PROJECT_ID}" 2>/dev/null || echo "  backend-api service already exists, skipping."

gcloud run deploy ephemeris-service \
  --image="us-docker.pkg.dev/cloudrun/container/hello" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=5 \
  --min-instances=0 \
  --max-instances=5 \
  --no-cpu-throttling \
  --timeout=300 \
  --project="${PROJECT_ID}" 2>/dev/null || echo "  ephemeris-service already exists, skipping."

# ── 6. Set up Secret Manager secrets (templates) ─────────────────────────────
echo "[6/6] Creating Secret Manager secrets (add values via console)..."
for secret in neon-database-url redis-url clerk-secret-key groq-api-key anthropic-api-key deepseek-api-key encryption-secret sentry-dsn; do
  gcloud secrets describe "${secret}" --project="${PROJECT_ID}" >/dev/null 2>&1 \
    && echo "  Secret '${secret}' already exists." \
    || (echo -n "placeholder" | gcloud secrets create "${secret}" \
      --data-file=- \
      --project="${PROJECT_ID}" \
      --labels=managed-by=setup-script >/dev/null 2>&1 \
      && echo "  Created secret '${secret}' (set actual value in Google Cloud Console).")
done

echo ""
echo "============================================"
echo "GCP setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Update secrets in Secret Manager via Google Cloud Console"
echo "  2. Build and deploy with:"
echo "     gcloud builds submit --config cloudbuild.yaml --project=${PROJECT_ID}"
echo "  3. Or connect this GitHub repo to Cloud Build for automatic CI/CD"
echo ""
echo "Service URLs (after deploy):"
echo "  API:        https://backend-api-xxxxx-${REGION}.a.run.app"
echo "  Ephemeris:  https://ephemeris-service-xxxxx-${REGION}.a.run.app"
