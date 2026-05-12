import { useEffect, useState } from "react"

type UsePaginationOptions = {
  defaultPageSize?: number
  resetDeps?: unknown[]
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { defaultPageSize = 10, resetDeps = [] } = options
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  useEffect(() => {
    setPage(1)
  }, resetDeps)

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setPage(1)
  }

  return {
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
  }
}
