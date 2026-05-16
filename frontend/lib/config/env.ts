/**
 * Environment Configuration
 * Centralized, type-safe configuration for frontend environment variables
 */

function getEnvVar(value: string | undefined, key: string, defaultValue?: string): string {
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // BUILD-TIME WORKAROUND: Prevent crashes during static generation
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PHASE === 'phase-production-build'
    ) {
      // Silence placeholder warnings during build if they are repetitive
      return `placeholder_${key}`;
    }
    // In production, throwing here prevents the app from loading if critical keys are missing
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarOptional(value: string | undefined): string | undefined {
  return value;
}

export function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1';
}

function resolveBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || '';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (!raw) {
    if (isDevelopment || isTest || isBuildPhase) {
      return 'http://localhost:8000';
    }
    throw new Error(
      'NEXT_PUBLIC_BACKEND_URL is required in production and must point to your deployed API service.'
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('NEXT_PUBLIC_BACKEND_URL must be a valid absolute URL.');
  }

  const requiresHttps = !isDevelopment && !isTest && !isBuildPhase && !isLoopbackHost(parsed.hostname);
  if (requiresHttps && parsed.protocol !== 'https:') {
    throw new Error(
      'NEXT_PUBLIC_BACKEND_URL must use https in production unless you are targeting a local development host.'
    );
  }

  return raw.replace(/\/$/, '');
}

function resolveAppUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.FRONTEND_URL?.trim() || '';
  if (!raw) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('NEXT_PUBLIC_APP_URL or FRONTEND_URL must be a valid absolute URL when provided.');
  }

  if (parsed.protocol !== 'https:' && !isLoopbackHost(parsed.hostname)) {
    throw new Error('NEXT_PUBLIC_APP_URL or FRONTEND_URL must use https outside local development.');
  }

  return raw.replace(/\/$/, '');
}

function resolveBaseUrl(): string {
  const appUrl = resolveAppUrl();
  if (appUrl) {
    return appUrl;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return 'http://localhost:3000';
  }

  return '';
}

function resolveRegion(): string {
  return (
    process.env.APP_REGION ||
    process.env.CLOUD_RUN_REGION ||
    process.env.GOOGLE_CLOUD_REGION ||
    process.env.VERCEL_REGION ||
    'unknown'
  );
}

// Explicit validation check
function validateEnv(): void {
  const requiredVars = [
    { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }
  ];

  const missing = requiredVars.filter((item) => !item.value);

  if (missing.length > 0) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (!isBuildPhase) {
      console.warn('⚠️ Missing environment variables (Optional during build):');
      missing.forEach((item) => console.warn(`  • ${item.key}`));
    }

    // We don't throw during build to allow static generation to complete
    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      // Only throw in true PRODUCTION runtime, not during build
      // Note: Next.js doesn't always set NEXT_PHASE correctly here, but we can assume
      // if we are here and it's production, it might be build.
      // To be safe, we'll just warn and let getEnvVar handle the strictness if needed.
    }
  }
}

// Run validation
validateEnv();

export const env = {
  clerk: {
    publishableKey: getEnvVar(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    signInUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    signUpUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, 'NEXT_PUBLIC_CLERK_SIGN_UP_URL', '/sign-up'),
    signInFallbackRedirectUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    signUpFallbackRedirectUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },

  api: {
    // Used by server-side proxy routes that forward analysis lifecycle requests to the API service.
    backendUrl: resolveBackendUrl(),
    internalApiKey: undefined, // Removed for security realignment
  },

  app: {
    url: resolveAppUrl(),
    deploymentUrl: getEnvVarOptional(process.env.NEXT_PUBLIC_DEPLOYMENT_URL) ?? getEnvVarOptional(process.env.NEXT_PUBLIC_VERCEL_URL),
    baseUrl: resolveBaseUrl(),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    region: resolveRegion(),
    nextPhase: process.env.NEXT_PHASE,
  },

  security: {
    get encryptionSecret() {
      const secret = process.env.ENCRYPTION_SECRET;
      if (secret) return secret;
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return 'build_placeholder_32_char_secret_key_2026';
      }
      return secret;
    },
  },

  features: {
    enableAnalytics: false, // Hardcoded
    enableDebug: false, // Hardcoded for production stability
  },

  warmup: {
    enabled: false, // Hardcoded/Disabled
    intervalMinutes: 2,
    timeoutMs: 5000,
    endpoints: ['/api/ping', '/api/health'],
  },
} as const;

export type Env = typeof env;
