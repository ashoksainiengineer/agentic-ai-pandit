/**
 * Stub for @ai-pandit/db/schema — DB table definitions.
 *
 * All DB operations now go through the FastAPI backend.
 * These stubs exist so the frontend code compiles during migration.
 */
export const sessions = {};
export const users = {};
export const sessionFavorites = {};
export const auditLogs = {};

export type Session = Record<string, unknown>;
export type NewSession = Record<string, unknown>;
