/**
 * Frontend Pagination Utilities
 * Shared pagination helpers for API requests and UI components
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Build pagination query string
 */
export function buildPaginationQuery(params: PaginationParams): string {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  return `page=${page}&limit=${limit}`;
}

/**
 * Parse pagination from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  return { page, limit };
}

/**
 * Calculate slice indexes for array pagination
 */
export function calculateSliceIndexes(
  page: number,
  limit: number,
  total: number
): { start: number; end: number } {
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);
  return { start, end };
}

/**
 * Create pagination metadata for response
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginatedResponse<unknown>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
