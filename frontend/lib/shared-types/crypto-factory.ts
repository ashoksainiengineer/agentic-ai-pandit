/**
 * ============================================================================
 *  Crypto Factory — Pre-bound Encryption Instance (v2 — No Fallback)
 * ============================================================================
 *
 * Creates a versioned, pre-configured encryption instance that binds a master
 * secret to all crypto operations. Guarantees identical ciphertext across
 * Web BFF, Express API, and Worker when using the same ENCRYPTION_SECRET.
 *
 * DESIGN PRINCIPLES:
 *   1. SINGLE SOURCE OF TRUTH — AES-256-GCM v4 implementation in ./encryption.ts
 *   2. ZERO CONFIG COUPLING — secret passed explicitly, no implicit config reads
 *   3. IDEMPOTENT — creating multiple instances with same secret yields identical objects
 *   4. TESTABLE — every function is pure. Unit tests use test secrets without env pollution
 *   5. NO FALLBACK — encryption key = userId (UUID) ONLY. No clerkId, no providerId.
 *
 * USAGE:
 *   import { createEncryption } from '@ai-pandit/shared';
 *   const crypto = createEncryption(process.env.ENCRYPTION_SECRET!);
 *   const encrypted = crypto.encrypt(data, userId);
 *   const decrypted = crypto.parseField(encrypted, userId);
 */

import {
  encrypt as _encrypt,
  decrypt as _decrypt,
  isEncrypted as _isEncrypted,
} from './encryption.js';

import {
  parseSensitiveField as _parseSensitiveField,
} from './parse-sensitive-field.js';

/**
 * A pre-bound encryption instance. All functions share the same master secret.
 * All methods are synchronous (synchronous scrypt with N=32768 — fast enough).
 */
export interface EncryptionInstance {
  /** Encrypt plaintext → v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext) */
  encrypt(plaintext: string, userId: string): string;

  /** Decrypt v4-encrypted string → plaintext. Throws on failure. */
  decrypt(encrypted: string, userId: string): string;

  /**
   * Parse a potentially-encrypted field. Handles:
   *   - v4 encrypted strings → decrypts + JSON.parses
   *   - Plain JSON strings → JSON.parses
   *   - Raw strings → returns as-is
   *   - null/undefined → returns defaultValue
   *
   * @param userId — The ONLY key identity. No secondary/fallback ID.
   */
  parseField<T = unknown>(
    data: string | null | undefined,
    userId: string,
    defaultValue?: T | null,
  ): T | string | null;

  /** Check if a string is in v4 encrypted format */
  isEncrypted(data: string | null | undefined): boolean;
}

/**
 * Create a pre-bound encryption instance.
 *
 * @param secret — ENCRYPTION_SECRET (≥32 chars). Must be identical across ALL services.
 * @throws If secret is empty or too short (< 32 chars).
 */
export function createEncryption(secret: string): EncryptionInstance {
  if (!secret || secret.length < 32) {
    throw new Error(
      `ENCRYPTION_SECRET must be at least 32 characters (got ${secret.length}). ` +
      `All services (Web BFF, API, Worker) must use the identical secret.`,
    );
  }

  return {
    encrypt(plaintext: string, userId: string): string {
      return _encrypt(plaintext, userId, secret);
    },

    decrypt(encrypted: string, userId: string): string {
      return _decrypt(encrypted, userId, [secret]);
    },

    parseField<T = unknown>(
      data: string | null | undefined,
      userId: string,
      defaultValue?: T | null,
    ): T | string | null {
      return _parseSensitiveField<T>(data, userId, [secret], defaultValue as T | null) as T | string | null;
    },

    isEncrypted(data: string | null | undefined): boolean {
      return _isEncrypted(data);
    },
  };
}
