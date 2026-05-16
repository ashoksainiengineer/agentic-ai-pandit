/**
 * ============================================================================
 *  Web BFF Encryption — Clean Barrel (v2 — No Fallback)
 * ============================================================================
 *
 * All crypto logic lives in @ai-pandit/shared. This module:
 *   1. Provides a pre-bound EncryptionInstance via getWebEncryption()
 *   2. Re-exports createEncryption, isEncrypted, EncryptionInstance from shared
 *   3. No singleton state, no initializeEncryption(), no fallback IDs.
 *
 * USAGE:
 *   import { getWebEncryption } from '@/lib/crypto';
 *   const crypto = getWebEncryption();
 *   crypto.encrypt(data, userId);
 *   crypto.parseField(encrypted, userId);
 */

import { env } from './config/env';
import {
  createEncryption,
  type EncryptionInstance,
} from '@ai-pandit/shared';
import { logger } from './logger';

// Re-export from shared for consumers
export { createEncryption } from '@ai-pandit/shared';
export type { EncryptionInstance } from '@ai-pandit/shared';
export { isEncrypted } from '@ai-pandit/shared';

let _instance: EncryptionInstance | null = null;

/**
 * Get the Web BFF's pre-bound encryption instance.
 * Secret comes from process.env.ENCRYPTION_SECRET via env.security.encryptionSecret.
 * Instance is created lazily on first call.
 *
 * @throws If ENCRYPTION_SECRET is not set or shorter than 32 chars.
 */
export function getWebEncryption(): EncryptionInstance {
  if (!_instance) {
    const secret = env.security.encryptionSecret;
    _instance = createEncryption(secret ?? '');
    logger.info('[Crypto] Web BFF encryption instance initialized');
  }
  return _instance;
}
