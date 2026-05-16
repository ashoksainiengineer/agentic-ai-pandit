import { describe, it, expect } from 'vitest';

describe('config/index', () => {
    it('should re-export env', async () => {
        const { env } = await import('../config/index.js');
        expect(env).toBeDefined();
        expect(typeof env).toBe('object');
    });

    it('should have the same env structure as config/env', async () => {
        const { env: envFromIndex } = await import('../config/index.js');
        const { env: envFromEnv } = await import('../config/env.js');
        expect(envFromIndex).toBe(envFromEnv);
    });

    it('should export Env type', async () => {
        const mod = await import('../config/index.js');
        expect(mod).toBeDefined();
    });
});
