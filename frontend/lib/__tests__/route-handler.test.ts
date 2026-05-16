import { describe, it, expect } from 'vitest';
import { withRouteHandler } from '../server/route-handler';

describe('withRouteHandler', () => {
  it('returns a function', () => {
    const wrapped = withRouteHandler(async () => new Response('ok'));
    expect(typeof wrapped).toBe('function');
  });
});
