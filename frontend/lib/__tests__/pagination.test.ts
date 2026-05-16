/**
 * 🔱 EXHAUSTIVE PAGINATION TESTS
 * Tests every pagination utility function with boundary conditions.
 */
import { describe, it, expect } from 'vitest';
import {
    buildPaginationQuery,
    parsePaginationParams,
    calculateSliceIndexes,
    createPaginationMeta,
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
} from '../pagination.js';

describe('Pagination - Constants', () => {
    it('should have sensible defaults', () => {
        expect(DEFAULT_PAGE).toBe(1);
        expect(DEFAULT_LIMIT).toBe(20);
        expect(MAX_LIMIT).toBe(100);
    });
});

describe('Pagination - buildPaginationQuery', () => {
    it('should build default query with no params', () => {
        const query = buildPaginationQuery({});
        expect(query).toBe('page=1&limit=20');
    });

    it('should use provided page and limit', () => {
        const query = buildPaginationQuery({ page: 3, limit: 50 });
        expect(query).toBe('page=3&limit=50');
    });

    it('should clamp page to minimum 1', () => {
        const query = buildPaginationQuery({ page: 0 });
        expect(query).toContain('page=1');
    });

    it('should clamp page to minimum 1 for negative values', () => {
        const query = buildPaginationQuery({ page: -5 });
        expect(query).toContain('page=1');
    });

    it('should clamp limit to MAX_LIMIT', () => {
        const query = buildPaginationQuery({ limit: 999 });
        expect(query).toContain('limit=100');
    });

    it('should clamp limit to minimum 1', () => {
        const query = buildPaginationQuery({ limit: 0 });
        expect(query).toContain('limit=1');
    });
});

describe('Pagination - parsePaginationParams', () => {
    it('should parse valid params', () => {
        const params = new URLSearchParams('page=2&limit=30');
        const result = parsePaginationParams(params);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(30);
    });

    it('should use defaults for missing params', () => {
        const params = new URLSearchParams('');
        const result = parsePaginationParams(params);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
    });

    it('should handle non-numeric page', () => {
        const params = new URLSearchParams('page=abc');
        const result = parsePaginationParams(params);
        expect(result.page).toBe(1);
    });

    it('should clamp page to minimum 1', () => {
        const params = new URLSearchParams('page=-5');
        const result = parsePaginationParams(params);
        expect(result.page).toBe(1);
    });

    it('should clamp limit to MAX_LIMIT', () => {
        const params = new URLSearchParams('limit=500');
        const result = parsePaginationParams(params);
        expect(result.limit).toBe(100);
    });
});

describe('Pagination - calculateSliceIndexes', () => {
    it('should calculate correct indexes for page 1', () => {
        const { start, end } = calculateSliceIndexes(1, 20, 100);
        expect(start).toBe(0);
        expect(end).toBe(20);
    });

    it('should calculate correct indexes for page 2', () => {
        const { start, end } = calculateSliceIndexes(2, 20, 100);
        expect(start).toBe(20);
        expect(end).toBe(40);
    });

    it('should clamp end to total on last page', () => {
        const { start, end } = calculateSliceIndexes(3, 20, 50);
        expect(start).toBe(40);
        expect(end).toBe(50); // Not 60
    });

    it('should handle empty dataset', () => {
        const { start, end } = calculateSliceIndexes(1, 20, 0);
        expect(start).toBe(0);
        expect(end).toBe(0);
    });

    it('should handle page beyond total', () => {
        const { start, end } = calculateSliceIndexes(10, 20, 50);
        expect(start).toBe(180);
        expect(end).toBe(50); // clamped
    });
});

describe('Pagination - createPaginationMeta', () => {
    it('should create correct meta for first page', () => {
        const meta = createPaginationMeta(1, 20, 100);
        expect(meta.page).toBe(1);
        expect(meta.limit).toBe(20);
        expect(meta.total).toBe(100);
        expect(meta.totalPages).toBe(5);
        expect(meta.hasNext).toBe(true);
        expect(meta.hasPrev).toBe(false);
    });

    it('should create correct meta for last page', () => {
        const meta = createPaginationMeta(5, 20, 100);
        expect(meta.hasNext).toBe(false);
        expect(meta.hasPrev).toBe(true);
    });

    it('should create correct meta for middle page', () => {
        const meta = createPaginationMeta(3, 20, 100);
        expect(meta.hasNext).toBe(true);
        expect(meta.hasPrev).toBe(true);
    });

    it('should handle single page dataset', () => {
        const meta = createPaginationMeta(1, 20, 5);
        expect(meta.totalPages).toBe(1);
        expect(meta.hasNext).toBe(false);
        expect(meta.hasPrev).toBe(false);
    });

    it('should handle empty dataset', () => {
        const meta = createPaginationMeta(1, 20, 0);
        expect(meta.totalPages).toBe(0);
        expect(meta.hasNext).toBe(false);
        expect(meta.hasPrev).toBe(false);
    });

    it('should calculate totalPages with ceiling (partial last page)', () => {
        const meta = createPaginationMeta(1, 20, 21);
        expect(meta.totalPages).toBe(2);
    });
});
