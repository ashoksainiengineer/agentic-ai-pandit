import { describe, it, expect, beforeEach } from 'vitest';
import { getBuildPhaseRouteResponse } from '../server/build-phase-route-guard.js';

describe('build-phase-route-guard', () => {
    const originalPhase = process.env.NEXT_PHASE;

    beforeEach(() => {
        // Reset the env var before each test
        if (originalPhase !== undefined) {
            process.env.NEXT_PHASE = originalPhase;
        } else {
            delete process.env.NEXT_PHASE;
        }
    });

    it('should return null when NEXT_PHASE is not phase-production-build', () => {
        process.env.NEXT_PHASE = 'phase-development-build';
        const result = getBuildPhaseRouteResponse();
        expect(result).toBeNull();
    });

    it('should return 204 Response when NEXT_PHASE is phase-production-build', () => {
        process.env.NEXT_PHASE = 'phase-production-build';
        const result = getBuildPhaseRouteResponse();
        expect(result).not.toBeNull();
        expect(result instanceof Response).toBe(true);
        expect(result!.status).toBe(204);
    });

    it('should include Cache-Control header in build phase response', () => {
        process.env.NEXT_PHASE = 'phase-production-build';
        const result = getBuildPhaseRouteResponse();
        expect(result!.headers.get('Cache-Control')).toBe('no-store');
    });

    it('should include X-Build-Phase-Route header in build phase response', () => {
        process.env.NEXT_PHASE = 'phase-production-build';
        const result = getBuildPhaseRouteResponse();
        expect(result!.headers.get('X-Build-Phase-Route')).toBe('true');
    });

    it('should return null when NEXT_PHASE is undefined', () => {
        delete process.env.NEXT_PHASE;
        const result = getBuildPhaseRouteResponse();
        expect(result).toBeNull();
    });
});
