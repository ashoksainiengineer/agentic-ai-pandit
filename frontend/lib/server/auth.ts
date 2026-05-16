/**
 * ============================================================================
 *  Server-Side Auth Helpers — Provider-Agnostic Wrapper
 * ============================================================================
 *
 * Thin wrapper around Clerk's server-side auth functions. When migrating
 * away from Clerk, ONLY this file changes. All route handlers depend on
 * these functions, not on Clerk directly.
 *
 * PRINCIPLE: This file is the ONE place where @clerk/nextjs/server is
 * imported for server-side auth. Route handlers import from HERE.
 */

import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import type { AuthUserProfile } from '@ai-pandit/shared';

// ── Types ────────────────────────────────────────────────────────────────────

/** Simplified auth result for route handlers */
export interface ServerAuthResult {
  /** User's internal UUID (from DB) or provider ID as fallback */
  userId: string;
  /** Provider-specific user ID (Clerk's "sub") */
  providerId: string;
  /** Session token for making authenticated backend API calls */
  getToken: () => Promise<string | null>;
}

// ── Server-Side Auth ─────────────────────────────────────────────────────────

/**
 * Get the current authenticated user's identity from the request context.
 * Wraps Clerk's auth(). Use in Next.js API routes and server components.
 *
 * @returns Auth result or null if not authenticated
 */
export async function getServerAuth(): Promise<ServerAuthResult | null> {
  const { userId, getToken } = await clerkAuth();

  if (!userId) return null;

  return {
    userId, // Clerk's "userId" (which maps to externalId in our DB)
    providerId: userId,
    getToken: async () => getToken(),
  };
}

/**
 * Assert authentication and return the userId.
 * Throws if the user is not authenticated.
 * Use in route handlers that REQUIRE authentication.
 */
export async function requireServerAuth(): Promise<ServerAuthResult> {
  const auth = await getServerAuth();
  if (!auth) {
    throw new Error('Authentication required');
  }
  return auth;
}

/**
 * Get the current user's full profile from the auth provider.
 * Wraps Clerk's currentUser(). Use for session creation and profile pages.
 */
export async function getServerCurrentUser(): Promise<AuthUserProfile | null> {
  const user = await clerkCurrentUser();

  if (!user) return null;

  return {
    providerId: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? null,
    fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    imageUrl: user.imageUrl ?? null,
  };
}

/**
 * Get a fresh JWT token for making authenticated requests to the backend API.
 * Handles token refresh, null/undefined, and garbage tokens inline.
 *
 * @param getTokenFn - Clerk's getToken function (from useAuth or auth())
 * @param maxRetries - Max retry attempts (default 10)
 * @returns Valid token or null
 */
export async function getServerToken(
  getTokenFn: () => Promise<string | null>,
  maxRetries = 10,
): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const token = await getTokenFn();

      if (token && token !== 'null' && token !== 'undefined' && token.length > 20) {
        return token;
      }
    } catch {
      // Token fetch failed, retry
    }

    const delay = Math.min(100 * Math.pow(1.5, i), 2000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return null;
}
