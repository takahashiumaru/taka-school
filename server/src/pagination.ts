export type PaginationQuery = {
  page: number
  pageSize: number
  limit: number
  offset: number
}

export function parsePagination(
  query: Record<string, unknown>,
  defaults = { page: 1, pageSize: 10, maxPageSize: 100 }
): PaginationQuery {
  const page = Math.max(1, Number(query.page) || defaults.page)
  const requestedPageSize = Math.max(1, Number(query.pageSize) || defaults.pageSize)
  const pageSize = Math.min(defaults.maxPageSize, requestedPageSize)
  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
