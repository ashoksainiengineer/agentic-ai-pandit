import { describe, it, expect } from 'vitest';
import { isHighPrecisionMode, getEphemerisMode } from '../ephemeris';

describe('ephemeris (frontend)', () => {
  it('isHighPrecisionMode returns false', () => {
    expect(isHighPrecisionMode()).toBe(false);
  });

  it('getEphemerisMode returns algorithmic', () => {
    expect(getEphemerisMode()).toBe('algorithmic');
  });
});
