/**
 * ============================================================================
 *  Unified parseSensitiveField — Single Source of Truth (No Fallback)
 * ============================================================================
 *
 * Handles BOTH encrypted (v4) and plain JSON/string sensitive fields.
 * Used by Web BFF AND Express API AND Worker with the exact same logic.
 *
 * DESIGN PRINCIPLE:
 *   Encryption key = userId (UUID) ONLY. No clerkId, no providerId, no fallback.
 *   All three services use the same userId for encryption and decryption.
 *   There is only ONE key identity. Fallback patterns are a source of bugs
 *   and complexity — eliminated in this version.
 *
 * If decryption fails with the given userId, the data is treated as plaintext
 * or returned as defaultValue. The caller decides error handling.
 */

import {
  isEncrypted,
  safeDecrypt,
} from './encryption.js';

/**
 * Parse a sensitive field that may be encrypted (v4), plain JSON, or a raw string.
 *
 * DESIGN (v2 — NO fallback):
 *   - Encryption key = userId (UUID) ONLY
 *   - If encrypted, decrypt with userId. If that fails, return raw data/defaultValue.
 *   - If plain JSON, parse it.
 *   - If raw string, return as-is.
 *
 * @param data          - The field value (may be encrypted, JSON, plain string, or null/undefined).
 * @param userId        - User UUID for encryption/decryption. The ONLY key identity.
 * @param secrets       - Master encryption secret(s) for decryption.
 * @param defaultValue  - Value to return if `data` is null/undefined or decryption fails.
 */
export function parseSensitiveField<T = unknown>(
  data: string | null | undefined,
  userId: string,
  secrets: string | string[],
  defaultValue: T | null = null,
): T | string | null {
  if (data == null) return defaultValue;

  // ── Try decryption first (v4 encrypted fields) ──────────────────────────
  if (isEncrypted(data)) {
    const decrypted = safeDecrypt(data, userId, secrets);
    if (decrypted !== null) {
      try {
        return JSON.parse(decrypted) as T;
      } catch {
        // Decrypted but not JSON — return as string
        return decrypted as T;
      }
    }
    // Decryption failed — return defaultValue
    return defaultValue;
  }

  // ── Plain JSON or string (unencrypted) ─────────────────────────────────
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    return data as T;
  } catch {
    return data !== '' ? data : (defaultValue as T);
  }
}

/**
 * Parse a sensitive field that MUST be a JSON object (throws on failure).
 */
export function parseSensitiveObject<T extends Record<string, unknown>>(
  data: string | null | undefined,
  userId: string,
  secrets: string | string[],
): T {
  const result = parseSensitiveField<T>(data, userId, secrets);
  if (result && typeof result === 'object') return result as T;
  throw new Error('Sensitive field is not a valid object');
}
