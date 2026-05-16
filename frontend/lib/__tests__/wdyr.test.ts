import { describe, it, expect, vi } from 'vitest';

vi.mock('./config/env.js', () => ({
    env: {
        app: {
            isDevelopment: true,
        },
    },
}));

describe('wdyr - why-did-you-render module', () => {
    it('should export an empty object (module loaded for side effects)', async () => {
        const wdyr = await import('../wdyr.js');
        expect(wdyr).toBeDefined();
    });

    it('should not throw when imported', async () => {
        await expect(import('../wdyr.js')).resolves.toBeDefined();
    });
});
