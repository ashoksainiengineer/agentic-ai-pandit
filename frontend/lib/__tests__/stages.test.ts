import { describe, it, expect } from 'vitest';
import { STAGES } from '../constants/stages';

describe('STAGES', () => {
  it('contains all 6 stages', () => {
    expect(STAGES).toHaveLength(7);
  });

  it('each stage has required fields', () => {
    for (const stage of STAGES) {
      expect(stage.id).toBeGreaterThanOrEqual(0);
      expect(stage.name).toBeTruthy();
      expect(stage.shortName).toBeTruthy();
    }
  });

  it('stages are in order', () => {
    for (let i = 0; i < STAGES.length - 1; i++) {
      expect(STAGES[i].id).toBeLessThan(STAGES[i + 1].id);
    }
  });
});
