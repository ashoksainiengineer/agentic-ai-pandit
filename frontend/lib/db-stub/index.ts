/**
 * Stub for @ai-pandit/db — replaces the workspace DB package.
 *
 * In the new architecture, all database operations go through the
 * FastAPI backend. These stubs exist so the frontend code compiles
 * during the transition. Next.js API route handlers are being
 * migrated to proxy to the FastAPI backend.
 */
export const db = {
  query: {},
  select: () => ({ from: () => ({ where: () => ({ orderBy: () => Promise.resolve([]) }) }) }),
  insert: (table: unknown) => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: (table: unknown) => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
  delete: (table: unknown) => ({ where: () => Promise.resolve() }),
};

export const pool = { connect: () => Promise.resolve(), end: () => Promise.resolve() };

export function ensureUserRecord() {
  throw new Error('@ai-pandit/db stub: ensureUserRecord is not available. Use FastAPI backend instead.');
}

export type EnsureUserInput = Record<string, unknown>;
