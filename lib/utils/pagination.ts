/**
 * Utility functions for pagination
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination parameters from query params
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit)))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Build pagination response for API
 */
export function buildPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginationParams
) {
  const meta = getPaginationMeta(params.page, totalItems, params.limit);

  return {
    data,
    meta,
    links: {
      first: buildPageLink(1, params.limit),
      last: buildPageLink(meta.totalPages, params.limit),
      prev: meta.hasPreviousPage ? buildPageLink(params.page - 1, params.limit) : null,
      next: meta.hasNextPage ? buildPageLink(params.page + 1, params.limit) : null,
    },
  };
}

function buildPageLink(page: number, limit: number): string {
  return `?page=${page}&limit=${limit}`;
}

/**
 * Cursor-based pagination utilities
 */
export interface CursorParams {
  cursor?: string;
  limit: number;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Encode cursor for pagination
 */
export function encodeCursor(id: string | number, timestamp?: Date): string {
  const data = { id, timestamp: timestamp?.toISOString() || new Date().toISOString() };
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode cursor for pagination
 */
export function decodeCursor(cursor: string): { id: string; timestamp: string } | null {
  try {
    const data = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    return data;
  } catch {
    return null;
  }
}
