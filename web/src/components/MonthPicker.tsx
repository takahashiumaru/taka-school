import { useEffect, useRef, useState } from "react"

type Props = {
  value: string // "YYYY-MM"
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  size?: "sm" | "md"
}

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

function parse(v: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(v || "")
  if (!m) return null
  const year = Number(m[1])
  const mon = Number(m[2])
  if (mon < 1 || mon > 12) return null
  return { y: year, m: mon }
}

function format(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`
}

export default function MonthPicker({
  value,
  onChange,
  className = "",
  placeholder = "Pilih bulan",
  disabled,
  size = "md",
}: Props) {
  const parsed = parse(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState<number>(parsed?.y ?? today.getFullYear())
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (open && parsed) setYear(parsed.y)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const sizeCls = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
  const labelText = parsed ? `${MONTHS_LONG[parsed.m - 1]} ${parsed.y}` : ""

  function pickMonth(m: number) {
    onChange(format(year, m))
    setOpen(false)
  }

  function pickThisMonth() {
    const t = new Date()
    onChange(format(t.getFullYear(), t.getMonth() + 1))
    setOpen(false)
  }

  function clearVal() {
    onChange("")
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full ${sizeCls} rounded-lg ring-1 ring-slate-200 bg-white text-left text-slate-900 focus:ring-2 focus:ring-primary-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 dark:focus:ring-primary-600 transition-colors`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
        <span className={`flex-1 truncate ${labelText ? "" : "text-slate-400 dark:text-slate-500"}`}>
          {labelText || placeholder}
        </span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-72 rounded-xl bg-white ring-1 ring-slate-200 shadow-lg p-3 dark:bg-slate-900 dark:ring-slate-700 dark:shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Tahun sebelumnya"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5l-5 5 5 5" /></svg>
            </button>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{year}</div>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Tahun berikutnya"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5l5 5-5 5" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_ID.map((label, i) => {
              const m = i + 1
              const isSelected = parsed?.y === year && parsed?.m === m
              const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickMonth(m)}
                  className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary-600 text-white dark:bg-primary-500 dark:text-slate-950"
                      : isCurrent
                        ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/30"
                        : "hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
            <button type="button" onClick={clearVal} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Hapus</button>
            <button type="button" onClick={pickThisMonth} className="text-primary-700 font-semibold hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200">Bulan ini</button>
          </div>
        </div>
      )}
    </div>
  )
}
