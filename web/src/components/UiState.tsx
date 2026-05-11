type EmptyStateProps = {
  title: string
  desc?: string
  action?: React.ReactNode
}

export function AlertBox({ type = "error", children }: { type?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-rose-50 ring-rose-200 text-rose-700",
    success: "bg-emerald-50 ring-emerald-200 text-emerald-700",
    info: "bg-sky-50 ring-sky-200 text-sky-700",
  }
  return <div className={`rounded-xl ring-1 text-sm p-3 ${styles[type]}`}>{children}</div>
}

export function EmptyState({ title, desc, action }: EmptyStateProps) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 12h8m-8 5h5M5 4h14v16H5z" />
        </svg>
      </div>
      <div className="mt-3 font-semibold text-slate-900">{title}</div>
      {desc && <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-t border-slate-100">
          {Array.from({ length: cols }).map((__, col) => (
            <td key={col} className="px-4 py-4">
              <div className="h-3 rounded-full bg-slate-100 animate-pulse" style={{ width: `${Math.max(35, 90 - col * 12)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5">
          <div className="h-3 w-24 rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-4 h-8 w-16 rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-3 h-3 w-20 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
