import { useEffect, useMemo, useRef, useState } from "react"

type Props = { value: string; onChange: (value: string) => void; className?: string; placeholder?: string; disabled?: boolean; required?: boolean }

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

function parse(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "")
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}
function fmt(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function label(d: Date | null) { return d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "" }

export default function DatePicker({ value, onChange, className = "", placeholder = "Pilih tanggal", disabled, required }: Props) {
  const selected = parse(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => selected ?? today)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])
  useEffect(() => { if (open && selected) setView(selected) }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const y = view.getFullYear(), m = view.getMonth()
    const first = new Date(y, m, 1)
    const start = new Date(y, m, 1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [view])
  const selectedKey = selected ? fmt(selected) : ""
  const todayKey = fmt(today)
  const moveMonth = (delta: number) => setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  const pick = (d: Date) => { onChange(fmt(d)); setOpen(false) }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="absolute inset-0 opacity-0 pointer-events-none" />}
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen((v) => !v)} className="input-base flex items-center gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round"/></svg>
        <span className={`flex-1 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>{label(selected) || placeholder}</span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">‹</button>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{MONTHS[view.getMonth()]} {view.getFullYear()}</div>
            <button type="button" onClick={() => moveMonth(1)} className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">›</button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{DAYS.map((d) => <div key={d}>{d}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const key = fmt(d), inMonth = d.getMonth() === view.getMonth(), isSel = key === selectedKey, isToday = key === todayKey
              return <button key={key} type="button" onClick={() => pick(d)} className={`h-9 rounded-xl text-sm font-semibold transition ${isSel ? "bg-primary-600 text-white shadow-soft" : isToday ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/30" : inMonth ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" : "text-slate-300 hover:bg-slate-50 dark:text-slate-700 dark:hover:bg-slate-800/60"}`}>{d.getDate()}</button>
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <button type="button" onClick={() => { onChange(""); setOpen(false) }} className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400">Hapus</button>
            <button type="button" onClick={() => pick(today)} className="font-semibold text-primary-700 dark:text-primary-300">Hari ini</button>
          </div>
        </div>
      )}
    </div>
  )
}
