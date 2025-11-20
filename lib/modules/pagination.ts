/**
 * Advanced Pagination Module - Enterprise Grade
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * Per Supabase Pagination: https://supabase.com/docs/guides/api/pagination
 */

import { ReadonlyURLSearchParams } from 'next/navigation';

export interface PaginationConfig {
  pageSize: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface CursorPaginationConfig<T> {
  pageSize: number;
  cursor?: string;
  hasMore: boolean;
  items: T[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export function calculatePagination(
  totalItems: number,
  currentPage: number,
  pageSize: number
): PaginationConfig {
  const totalPages = Math.ceil(totalItems / pageSize);
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  return { pageSize, currentPage: validPage, totalItems, totalPages };
}

export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

export function parsePaginationFromSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
  defaults: Partial<PaginationState> = {}
): PaginationState {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || String(defaults.pageSize || 20), 10);
  const sortBy = searchParams.get('sortBy') || defaults.sortBy;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaults.sortOrder;
  return {
    page: Math.max(1, page),
    pageSize: Math.max(1, Math.min(100, pageSize)),
    sortBy,
    sortOrder,
  };
}

export function buildSupabasePaginationQuery<T>(query: any, state: PaginationState) {
  const { page, pageSize, sortBy, sortOrder } = state;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let paginatedQuery = query.range(from, to);
  if (sortBy) paginatedQuery = paginatedQuery.order(sortBy, { ascending: sortOrder === 'asc' });
  return paginatedQuery;
}

export function processCursorPaginationResponse<T extends Record<string, any>>(
  items: T[],
  pageSize: number,
  cursorKey: string
): CursorPaginationConfig<T> {
  const hasMore = items.length > pageSize;
  const resultItems = hasMore ? items.slice(0, pageSize) : items;
  const lastItem = resultItems[resultItems.length - 1];
  const nextCursor = lastItem ? lastItem[cursorKey] : undefined;
  return { pageSize, cursor: nextCursor, hasMore, items: resultItems };
}
