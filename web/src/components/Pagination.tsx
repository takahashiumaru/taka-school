type PaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages?: number
  loading?: boolean
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages: providedTotalPages,
  loading = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = providedTotalPages ?? Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const canPrev = page > 1 && !loading
  const canNext = page < totalPages && !loading

  function renderPageNumbers() {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push("...")
      const rangeStart = Math.max(2, page - 1)
      const rangeEnd = Math.min(totalPages - 1, page + 1)
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
      if (page < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }

    return pages.map((p, idx) =>
      typeof p === "number" ? (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          disabled={loading || p === page}
          className={`h-9 min-w-[2.25rem] px-3 rounded-lg text-sm font-medium transition ${
            p === page
              ? "bg-primary-600 text-white dark:bg-primary-500"
              : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {p}
        </button>
      ) : (
        <span key={`ellipsis-${idx}`} className="h-9 flex items-center px-2 text-slate-400 dark:text-slate-500">
          {p}
        </span>
      )
    )
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-slate-500 dark:text-slate-400">
        Tidak ada data
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span>
          Menampilkan <span className="font-semibold">{start}–{end}</span> dari{" "}
          <span className="font-semibold">{total}</span> data
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="h-9 px-3 rounded-lg text-sm bg-white ring-1 ring-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-200"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / halaman
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="h-9 px-4 rounded-lg text-sm font-medium bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          Sebelumnya
        </button>

        <div className="hidden sm:flex items-center gap-1">{renderPageNumbers()}</div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="h-9 px-4 rounded-lg text-sm font-medium bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
