/**
 * ============================================================================
 *  Auth Provider Interface — Provider-Agnostic Authentication
 * ============================================================================
 *
 * Abstracts the authentication provider (Clerk, Auth0, NextAuth, Firebase, etc.)
 * behind a single interface. The rest of the application depends on THIS interface,
 * not on any specific provider implementation.
 *
 * DESIGN PRINCIPLES:
 *   1. PROVIDER-AGNOSTIC — swap Clerk for Auth0 by implementing this interface.
 *   2. SINGLE ENTRY POINT — every auth operation flows through this interface.
 *   3. INTERNAL IDENTITY — userId (UUID) is the PRIMARY identity. providerId
 *      is the SECONDARY, provider-specific identifier.
 *   4. ZERO AMBIGUITY — userId = internal UUID. providerId = provider's "sub".
 *
 * MIGRATION: COMPLETE. DB columns are now `externalId` (no more `clerkId`).
 *   AuthIdentity.providerId maps to DB "externalId" column.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Identity resolved after successful token verification */
export interface AuthIdentity {
  /** Our internal UUID (primary key in users table) */
  userId: string;

  /** Provider-specific user identifier (e.g., Clerk's "sub", Auth0's "user_id") */
  providerId: string;

  /** Provider session identifier (for session management) */
  sessionId: string;

  /** The provider type — useful for multi-provider setups */
  provider: string;
}

/** Minimal user profile returned by the auth provider */
export interface AuthUserProfile {
  /** Provider-specific user ID */
  providerId: string;

  /** Email address (may be null for anonymous/OAuth-without-email) */
  email: string | null;

  /** Display name */
  fullName: string | null;

  /** First name */
  firstName: string | null;

  /** Last name */
  lastName: string | null;

  /** Avatar / profile image URL */
  imageUrl: string | null;
}

/** Result of token verification */
export interface TokenVerificationResult {
  /** Resolved identity (null if token is invalid/expired) */
  identity: AuthIdentity | null;

  /** Human-readable error for logging (null on success) */
  error: string | null;
}

// ── Provider Interface ───────────────────────────────────────────────────────

/**
 * AuthProvider — the single interface that ALL authentication flows use.
 *
 * IMPLEMENTATION NOTES:
 *   - verifyToken() is called on EVERY authenticated API request.
 *     It must be fast (sub-50ms) — cache the JWKS, don't HTTP-fetch per request.
 *   - getUserProfile() is called during session creation and user-facing pages.
 *     It may be slower (HTTP to provider API is acceptable).
 *   - getUserById() is used by background workers to resolve internal UUIDs.
 */
export interface AuthProvider {
  /** Unique provider identifier (e.g., "clerk", "auth0", "nextauth") */
  readonly provider: string;

  /**
   * Verify a JWT/session token and resolve the user's identity.
   *
   * Called by: Express auth middleware, Next.js API route handlers.
   * Frequency: Every authenticated request.
   *
   * @param token - The Bearer token from the Authorization header
   * @returns Resolved identity or null on failure
   */
  verifyToken(token: string): Promise<TokenVerificationResult>;

  /**
   * Get the current user's full profile (for session creation, profile pages).
   *
   * Called by: POST /api/sessions (to get name/email), user profile pages.
   * Frequency: Low (on session creation, profile views).
   *
   * @param providerId - The provider-specific user identifier
   * @returns User profile or null if not found
   */
  getUserProfile(providerId: string): Promise<AuthUserProfile | null>;

  /**
   * Resolve an internal userId (UUID) from a provider-specific identifier.
   *
   * Called by: Worker (to map clerkId → userId), session ownership checks.
   * Frequency: Medium (once per job, once per SSE connection).
   *
   * This is needed because the DB stores both userId and providerId,
   * but sometimes we only have the providerId (from token verification)
   * and need to find the corresponding internal UUID.
   *
   * @param providerId - The provider-specific user identifier
   * @returns Internal userId (UUID) or null if no mapping exists
   */
  resolveUserId(providerId: string): Promise<string | null>;
}

// ── Default / No-Op Provider (for testing) ───────────────────────────────────

/**
 * Creates a no-op auth provider for testing/development.
 * All methods return null — useful for unit tests that don't need real auth.
 */
export function createNoOpAuthProvider(): AuthProvider {
  return {
    provider: 'noop',
    async verifyToken(_token: string): Promise<TokenVerificationResult> {
      return { identity: null, error: 'NoOp provider: token verification disabled' };
    },
    async getUserProfile(_providerId: string): Promise<AuthUserProfile | null> {
      return null;
    },
    async resolveUserId(_providerId: string): Promise<string | null> {
      return null;
    },
  };
}
