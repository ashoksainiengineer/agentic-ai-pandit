/**
 * 🔱 EXHAUSTIVE FRONTEND CRYPTO MODULE TESTS
 * Tests v4 AES-256-GCM encryption with scrypt KDF and user isolation.
 * Uses the clean getWebEncryption() barrel — no initializeEncryption(), no fallbacks.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';

// Hoisted env setup — runs BEFORE module resolution (fixes vitest setupFiles ordering)
vi.hoisted(() => {
  process.env.ENCRYPTION_SECRET = 'test-secret-key-for-vitest-testing-32chars!';
});

import { getWebEncryption, createEncryption } from '../crypto.js';
import type { EncryptionInstance } from '../crypto.js';

const TEST_USER_ID = 'test-user-id-123';

// Lazy crypto — vitest setupFiles run before tests but after module eval,
// so we create the instance inside beforeAll
let crypto: EncryptionInstance;
beforeAll(() => { crypto = getWebEncryption(); });

// ═══════════════════════════════════════════════════════════════════════════
// ROUNDTRIP
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Roundtrip', () => {
    it('should encrypt and decrypt simple text', () => {
        const plaintext = 'Hello, World!';
        const encrypted = crypto.encrypt(plaintext, TEST_USER_ID);
        const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode/Hindi', () => {
        const plaintext = 'नमस्ते दुनिया 🌍';
        const encrypted = crypto.encrypt(plaintext, TEST_USER_ID);
        const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', () => {
        const encrypted = crypto.encrypt('', TEST_USER_ID);
        const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe('');
    });

    it('should encrypt and decrypt long text (10KB)', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = crypto.encrypt(plaintext, TEST_USER_ID);
        const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(10000);
    });

    it('should produce v4 versioned format', () => {
        const encrypted = crypto.encrypt('test', TEST_USER_ID);
        expect(encrypted.startsWith('v4:')).toBe(true);
        const parts = encrypted.split(':');
        expect(parts.length).toBe(5); // v4:salt:iv:authTag:ciphertext
    });

    it('should produce unique ciphertext for same plaintext (unique IVs/salts)', () => {
        const enc1 = crypto.encrypt('same', TEST_USER_ID);
        const enc2 = crypto.encrypt('same', TEST_USER_ID);
        expect(enc1).not.toBe(enc2);
    });

    it('should handle JSON strings', () => {
        const json = JSON.stringify({ name: 'Test', events: [1, 2, 3] });
        const decrypted = crypto.decrypt(crypto.encrypt(json, TEST_USER_ID), TEST_USER_ID);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(json));
    });

    it('should handle special characters', () => {
        const special = "O'Brien & Co. <special> \"quotes\" $€¥₹";
        const decrypted = crypto.decrypt(crypto.encrypt(special, TEST_USER_ID), TEST_USER_ID);
        expect(decrypted).toBe(special);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DECRYPTION ERRORS
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Decryption Errors', () => {
    it('should throw on non-v4 format', () => {
        expect(() => crypto.decrypt('v1:some:old:format', TEST_USER_ID)).toThrow();
    });

    it('should throw on corrupted v4 ciphertext', () => {
        const encrypted = crypto.encrypt('test', TEST_USER_ID);
        const parts = encrypted.split(':');
        parts[4] = 'CORRUPTED_DATA_HERE';
        expect(() => crypto.decrypt(parts.join(':'), TEST_USER_ID)).toThrow();
    });

    it('should throw on tampered v4 auth tag', () => {
        const encrypted = crypto.encrypt('test', TEST_USER_ID);
        const parts = encrypted.split(':');
        parts[3] = Buffer.from('bad_auth_tag_here').toString('base64');
        expect(() => crypto.decrypt(parts.join(':'), TEST_USER_ID)).toThrow();
    });

    it('should throw on v4 decrypt with wrong userId', () => {
        const encrypted = crypto.encrypt('test', TEST_USER_ID);
        expect(() => crypto.decrypt(encrypted, 'different-user-id')).toThrow();
    });

    it('should throw on plain text input', () => {
        expect(() => crypto.decrypt('not encrypted at all', TEST_USER_ID)).toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION (via JSON.stringify/JSON.parse)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Object Encryption', () => {
    it('should encrypt and decrypt objects', () => {
        const obj = { name: 'Test', age: 30, nested: { key: 'value' } };
        const encrypted = crypto.encrypt(JSON.stringify(obj), TEST_USER_ID);
        const decrypted = JSON.parse(crypto.decrypt(encrypted, TEST_USER_ID));
        expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
        const obj = { events: ['marriage', 'career'], count: 2 };
        const encrypted = crypto.encrypt(JSON.stringify(obj), TEST_USER_ID);
        const decrypted = JSON.parse(crypto.decrypt(encrypted, TEST_USER_ID));
        expect(decrypted.events).toEqual(['marriage', 'career']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// isEncrypted
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - isEncrypted', () => {
    it('should detect v4 encrypted strings', () => {
        const encrypted = crypto.encrypt('test', TEST_USER_ID);
        expect(crypto.isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plain text', () => {
        expect(crypto.isEncrypted('hello world')).toBe(false);
    });

    it('should reject JSON strings', () => {
        expect(crypto.isEncrypted('{"key":"value"}')).toBe(false);
    });

    it('should reject null/undefined', () => {
        expect(crypto.isEncrypted(null)).toBe(false);
        expect(crypto.isEncrypted(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
        expect(crypto.isEncrypted('')).toBe(false);
    });

    it('should reject v1 format', () => {
        expect(crypto.isEncrypted('v1:something')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// parseField
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - parseField', () => {
    it('should return default for null/undefined', () => {
        expect(crypto.parseField(null, TEST_USER_ID)).toBeNull();
        expect(crypto.parseField(undefined, TEST_USER_ID)).toBeNull();
        expect(crypto.parseField(null, TEST_USER_ID, 'default')).toBe('default');
    });

    it('should decrypt and parse encrypted JSON', () => {
        const data = { events: ['marriage'] };
        const encrypted = crypto.encrypt(JSON.stringify(data), TEST_USER_ID);
        expect(crypto.parseField(encrypted, TEST_USER_ID)).toEqual(data);
    });

    it('should decrypt plain encrypted string', () => {
        const name = 'Ashok Kumar';
        const encrypted = crypto.encrypt(name, TEST_USER_ID);
        expect(crypto.parseField(encrypted, TEST_USER_ID)).toBe(name);
    });

    it('should parse unencrypted JSON (legacy)', () => {
        const json = '{"key":"value"}';
        expect(crypto.parseField(json, TEST_USER_ID)).toEqual({ key: 'value' });
    });

    it('should return raw string for non-JSON non-encrypted', () => {
        expect(crypto.parseField('plain text', TEST_USER_ID)).toBe('plain text');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCE CREATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Instance Creation', () => {
    it('should create a working instance via getWebEncryption', () => {
        const instance = getWebEncryption();
        const encrypted = instance.encrypt('test', TEST_USER_ID);
        expect(instance.isEncrypted(encrypted)).toBe(true);
        expect(instance.decrypt(encrypted, TEST_USER_ID)).toBe('test');
    });

    it('should return the same cached instance', () => {
        const a = getWebEncryption();
        const b = getWebEncryption();
        expect(a).toBe(b);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// v4 USER ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - v4 User Isolation', () => {
    it('should produce different ciphertext for different users on same plaintext', () => {
        const plaintext = 'same data';
        const enc1 = crypto.encrypt(plaintext, 'user-a');
        const enc2 = crypto.encrypt(plaintext, 'user-b');
        expect(enc1).not.toBe(enc2);
    });

    it('should fail to decrypt v4 data with wrong userId', () => {
        const encrypted = crypto.encrypt('secret', 'user-a');
        expect(() => crypto.decrypt(encrypted, 'user-b')).toThrow();
    });

    it('should fail to decrypt v4 data without userId', () => {
        const encrypted = crypto.encrypt('secret', 'user-a');
        expect(() => crypto.decrypt(encrypted, '' as any)).toThrow();
    });

    it('should throw when encrypting without userId', () => {
        expect(() => crypto.encrypt('test', '' as any)).toThrow();
    });
});
