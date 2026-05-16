import { describe, it, expect } from 'vitest';
import { OFFSET_PRESETS } from '../../components/rectify/Step1BirthDetails/constants';

describe('OFFSET_PRESETS', () => {
  it('has all preset options', () => {
    expect(OFFSET_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('each preset has required fields', () => {
    for (const preset of OFFSET_PRESETS) {
      expect(preset.value).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.minutes).toBeGreaterThanOrEqual(0);
    }
  });
});
