import { describe, it, expect } from 'vitest';
import { getMemoryStats } from '../memory-manager';

describe('getMemoryStats', () => {
  it('returns valid structure', () => {
    const stats = getMemoryStats();
    expect(stats).toHaveProperty('heapUsed');
    expect(stats).toHaveProperty('heapTotal');
    expect(typeof stats.heapUsed).toBe('number');
  });
});
