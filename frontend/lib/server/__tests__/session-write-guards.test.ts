import { describe, it, expect } from 'vitest';
import { canFrontendMutateSession, getProtectedFieldsPresent } from '../session-write-guards';

describe('session-write-guards', () => {
    describe('getProtectedFieldsPresent', () => {
        it('should return empty array for safe payload', () => {
            const payload = {
                birthData: { fullName: 'Test' },
                lifeEvents: [],
                offsetConfig: { preset: '1hour' },
            };
            expect(getProtectedFieldsPresent(payload)).toEqual([]);
        });

        it('should detect single protected lifecycle field', () => {
            const payload = {
                status: 'processing',
            };
            expect(getProtectedFieldsPresent(payload)).toEqual(['status']);
        });

        it('should detect multiple protected fields in mixed payload', () => {
            const payload = {
                birthData: { fullName: 'Test' },
                analysisResult: { foo: 'bar' },
                progressData: { step: 2 },
                completedAt: '2026-03-09T10:00:00.000Z',
                confidence: 'HIGH',
            };
            expect(getProtectedFieldsPresent(payload).sort()).toEqual([
                'analysisResult',
                'completedAt',
                'confidence',
                'progressData',
            ].sort());
        });

        it('should not flag unknown non-protected keys', () => {
            const payload = {
                internalNote: 'hello',
                customFlag: true,
                xyz: 123,
            };
            expect(getProtectedFieldsPresent(payload)).toEqual([]);
        });
    });

    describe('canFrontendMutateSession', () => {
        it('should allow mutable statuses', () => {
            expect(canFrontendMutateSession('draft')).toBe(true);
            expect(canFrontendMutateSession('failed')).toBe(true);
            expect(canFrontendMutateSession('pending')).toBe(true);
        });

        it('should reject locked lifecycle statuses', () => {
            expect(canFrontendMutateSession('queued')).toBe(false);
            expect(canFrontendMutateSession('processing')).toBe(false);
            expect(canFrontendMutateSession('complete')).toBe(false);
            expect(canFrontendMutateSession('cancelled')).toBe(false);
        });

        it('should reject nullish or unknown statuses', () => {
            expect(canFrontendMutateSession(null)).toBe(false);
            expect(canFrontendMutateSession(undefined)).toBe(false);
            expect(canFrontendMutateSession('unknown-status')).toBe(false);
        });
    });
});
