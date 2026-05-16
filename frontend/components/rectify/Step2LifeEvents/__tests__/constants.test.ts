import { describe, it, expect } from 'vitest';
import { DATE_OPTIONS } from '../../components/rectify/Step2LifeEvents/constants';

describe('Step2LifeEvents constants', () => {
  it('DATE_OPTIONS has entries', () => {
    expect(DATE_OPTIONS.length).toBeGreaterThan(0);
    for (const opt of DATE_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
  });
});
