import { describe, it, expect } from 'vitest';
import { THEME } from '../theme';

describe('theme', () => {
  it('exports all required color tokens', () => {
    expect(THEME).toBeDefined();
    expect(THEME.bg).toBe('#F8F5F0');
    expect(THEME.surface).toBe('#FFFFFF');
    expect(THEME.gold).toBe('#000000');
    expect(THEME.goldLight).toBe('#DAA520');
    expect(THEME.textPrimary).toBe('#1A1A1A');
    expect(THEME.textSecondary).toBe('#4A4A4A');
    expect(THEME.textMuted).toBe('#8E8E8E');
    expect(THEME.success).toBe('#10B981');
    expect(THEME.error).toBe('#EF4444');
    expect(THEME.border).toBe('#E5E1D8');
  });

  it('has exactly 10 color tokens', () => {
    expect(Object.keys(THEME)).toHaveLength(10);
  });

  it('has no duplicate color values', () => {
    const values = Object.values(THEME);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
