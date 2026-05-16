/**
 * ============================================================================
 *  AI-Pandit Encryption — Single Source of Truth (v4)
 * ============================================================================
 *
 * This is the AUTHORITATIVE encryption module for the ENTIRE system.
 * Both Web BFF and Express API must use this — no duplicate implementations.
 *
 * Algorithm: AES-256-GCM + scrypt KDF with user-isolated key derivation.
 * Format:    v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext)
 *
 * Key derivation: scrypt(secret:userId, salt) → 256-bit key
 * AAD binding:    userId is bound as AAD — ciphertext is user-locked
 *
 * Why this module exists here (in shared):
 *   - Web BFF and Express API had SEPARATE implementations with different
 *     parseSensitiveField signatures → sessions encrypted by one couldn't
 *     be read by the other → 500 errors on dashboard.
 *   - This module is the SINGLE SOURCE OF TRUTH. Both consumers pass in
 *     their `secret` and `userId` explicitly — no implicit config reads.
 */

import crypto from 'crypto';
import {
  ValidationError,
  ProcessingError,
} from './errors.js';

// ═════════════════════════════════════════════════════════════════════════════
// V4 CONFIGURATION (NIST-Recommended Parameters)
// ═════════════════════════════════════════════════════════════════════════════

const V4 = {
  ALGORITHM: 'aes-256-gcm' as const,
  KEY_LENGTH: 32,            // 256-bit
  IV_LENGTH: 12,             // 96-bit (NIST recommended for GCM)
  SALT_LENGTH: 16,           // 128-bit
  AUTH_TAG_LENGTH: 16,       // 128-bit
  SCRYPT_PARAMS: { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
  PREFIX: 'v4',
  SEPARATOR: ':' as const,
};

// ═════════════════════════════════════════════════════════════════════════════
// KEY DERIVATION
// ═════════════════════════════════════════════════════════════════════════════

function deriveKeyV4(secret: string, userId: string, salt: Buffer): Buffer {
  const combinedSecret = `${secret}:${userId}`;
  return crypto.scryptSync(combinedSecret, salt, V4.KEY_LENGTH, V4.SCRYPT_PARAMS);
}

// ═════════════════════════════════════════════════════════════════════════════
// CORE: ENCRYPT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt a plaintext string using v4 (AES-256-GCM + scrypt + user isolation).
 *
 * @param plaintext - The string to encrypt.
 * @param userId    - Internal user ID (UUID) for key isolation and AAD binding.
 * @param secret    - Master encryption secret (ENCRYPTION_SECRET).
 * @returns The encrypted string in format: v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext)
 */
export function encrypt(plaintext: string, userId: string, secret: string): string {
  if (!secret) throw new ValidationError('Encryption secret is required');
  if (!userId) throw new ValidationError('userId is required for v4 key isolation');

  try {
    const salt = crypto.randomBytes(V4.SALT_LENGTH);
    const iv = crypto.randomBytes(V4.IV_LENGTH);
    const derivedKey = deriveKeyV4(secret, userId, salt);

    const cipher = crypto.createCipheriv(V4.ALGORITHM, derivedKey, iv, {
      authTagLength: V4.AUTH_TAG_LENGTH,
    } as crypto.CipherGCMOptions);

    (cipher as crypto.CipherGCM).setAAD(Buffer.from(userId, 'utf8'));

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = (cipher as crypto.CipherGCM).getAuthTag();

    return [
      V4.PREFIX,
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(V4.SEPARATOR);
  } catch (err) {
    throw new ProcessingError('Encryption failed', {
      cause: err instanceof Error ? err : undefined,
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CORE: DECRYPT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Decrypt a v4-encrypted string, trying multiple secrets (for key rotation).
 *
 * @param encryptedString - The v4-encrypted payload.
 * @param userId          - Internal user ID used during encryption.
 * @param secrets         - One or more master secrets (tried in order).
 * @returns The decrypted plaintext.
 */
export function decrypt(
  encryptedString: string,
  userId: string,
  secrets: string | string[],
): string {
  let secretList: string[] = [];
  if (Array.isArray(secrets)) {
    secretList = secrets;
  } else if (typeof secrets === 'string') {
    // Handle comma-separated secrets and also handle the legacy newline issue
    // by explicitly adding a version with a newline if it doesn't have one.
    secretList = secrets.split(',').map(s => s.trim());
    
    // Safety: If the list only has one secret and it doesn't end in newline,
    // add the newline version as a fallback to recover legacy data.
    if (secretList.length === 1 && !secretList[0].endsWith('\n')) {
       secretList.push(secretList[0] + '\n');
    }
  }

  if (!encryptedString.startsWith(`${V4.PREFIX}${V4.SEPARATOR}`)) {
    throw new ValidationError('Invalid encrypted data format: expected v4 prefix');
  }

  const parts = encryptedString.split(V4.SEPARATOR);
  if (parts.length !== 5) {
    throw new ValidationError('Invalid v4 format: expected 5 parts');
  }

  const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  for (const secret of secretList) {
    try {
      const derivedKey = deriveKeyV4(secret, userId, salt);

      const decipher = crypto.createDecipheriv(V4.ALGORITHM, derivedKey, iv, {
        authTagLength: V4.AUTH_TAG_LENGTH,
      } as crypto.CipherGCMOptions);

      (decipher as crypto.DecipherGCM).setAAD(Buffer.from(userId, 'utf8'));
      (decipher as crypto.DecipherGCM).setAuthTag(authTag);

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      // This secret didn't work — try next one (key rotation support)
      continue;
    }
  }

  throw new ValidationError(
    'Decryption failed: key mismatch or data corruption (all secrets exhausted)',
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SAFE DECRYPT WRAPPER (null-returning instead of throwing)
// ═════════════════════════════════════════════════════════════════════════════

export function safeDecrypt(
  encryptedString: string,
  userId: string,
  secrets: string | string[],
): string | null {
  try {
    return decrypt(encryptedString, userId, secrets);
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMAT DETECTION
// ═════════════════════════════════════════════════════════════════════════════

export function isEncrypted(data: string | null | undefined): boolean {
  if (!data || typeof data !== 'string') return false;
  return data.startsWith(`${V4.PREFIX}${V4.SEPARATOR}`);
}
