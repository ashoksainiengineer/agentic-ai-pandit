import { describe, it, expect } from 'vitest';
import { TESTIMONIALS } from '../testimonials';

describe('TESTIMONIALS', () => {
  it('contains testimonials', () => {
    expect(TESTIMONIALS.length).toBeGreaterThan(0);
  });

  it('each testimonial has required fields', () => {
    for (const t of TESTIMONIALS) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
      expect(t.shortQuote).toBeTruthy();
    }
  });
});
