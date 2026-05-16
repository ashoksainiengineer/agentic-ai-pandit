import { describe, it, expect } from 'vitest';

describe('config/env', () => {
    it('should export env object with expected structure', async () => {
        const { env } = await import('../config/env.js');
        expect(env).toBeDefined();
        expect(typeof env).toBe('object');
    });

    it('should have clerk config section', async () => {
        const { env } = await import('../config/env.js');
        expect(env.clerk).toBeDefined();
        expect(typeof env.clerk.publishableKey).toBe('string');
        expect(typeof env.clerk.signInUrl).toBe('string');
        expect(typeof env.clerk.signUpUrl).toBe('string');
    });

    it('should have api config section', async () => {
        const { env } = await import('../config/env.js');
        expect(env.api).toBeDefined();
        expect(typeof env.api.backendUrl).toBe('string');
    });

    it('should have app config section', async () => {
        const { env } = await import('../config/env.js');
        expect(env.app).toBeDefined();
        expect(typeof env.app.isProduction).toBe('boolean');
        expect(typeof env.app.isDevelopment).toBe('boolean');
        expect(typeof env.app.isTest).toBe('boolean');
        expect(typeof env.app.region).toBe('string');
    });

    it('should have security config section', async () => {
        const { env } = await import('../config/env.js');
        expect(env.security).toBeDefined();
    });

    it('should have features config section', async () => {
        const { env } = await import('../config/env.js');
        expect(env.features).toBeDefined();
        expect(typeof env.features.enableAnalytics).toBe('boolean');
        expect(typeof env.features.enableDebug).toBe('boolean');
    });

    it('should export Env type', async () => {
        const mod = await import('../config/env.js');
        // Type-only export; just verify the module loads without error
        expect(mod).toBeDefined();
    });
});
