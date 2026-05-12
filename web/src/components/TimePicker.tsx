import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  minuteStep?: number
}

function parse(value: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || "")
  if (!m) return { hour: "", minute: "" }
  return { hour: m[1].padStart(2, "0"), minute: m[2].padStart(2, "0") }
}
function format(hour: string, minute: string) {
  if (!hour || !minute) return ""
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
}
function display(value: string) {
  const { hour, minute } = parse(value)
  return hour && minute ? `${hour}.${minute}` : ""
}

export default function TimePicker({ value, onChange, className = "", placeholder = "Pilih jam", disabled, required, minuteStep = 5 }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { hour, minute } = parse(value)
  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => String(i + 5).padStart(2, "0")), [])
  const minutes = useMemo(() => Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => String(i * minuteStep).padStart(2, "0")), [minuteStep])

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  function choose(nextHour = hour || "07", nextMinute = minute || "00") {
    onChange(format(nextHour, nextMinute))
  }
  function quick(start: string, end?: boolean) {
    onChange(start)
    if (end) setOpen(false)
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="absolute inset-0 opacity-0 pointer-events-none" />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="input-base flex items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={`flex-1 truncate ${value ? "" : "text-slate-400 dark:text-slate-500"}`}>{display(value) || placeholder}</span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/95 dark:ring-slate-700">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pilih waktu</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{display(value) || "--.--"}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">OK</button>
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Jam</div>
              <div className="grid max-h-52 grid-cols-2 gap-1 overflow-y-auto rounded-xl bg-slate-50 p-1 dark:bg-slate-950/60">
                {hours.map((h) => <button key={h} type="button" onClick={() => choose(h, minute || "00")} className={`rounded-lg px-2 py-2 text-sm font-bold transition ${hour === h ? "bg-primary-600 text-white shadow-soft" : "text-slate-700 hover:bg-white hover:text-primary-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}>{h}</button>)}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Menit</div>
              <div className="grid max-h-52 grid-cols-2 gap-1 overflow-y-auto rounded-xl bg-slate-50 p-1 dark:bg-slate-950/60">
                {minutes.map((m) => <button key={m} type="button" onClick={() => choose(hour || "07", m)} className={`rounded-lg px-2 py-2 text-sm font-bold transition ${minute === m ? "bg-primary-600 text-white shadow-soft" : "text-slate-700 hover:bg-white hover:text-primary-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}>{m}</button>)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <button type="button" onClick={() => quick("07:00")} className="rounded-full bg-primary-50 px-3 py-1.5 font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-300">07.00</button>
            <button type="button" onClick={() => quick("12:00")} className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">12.00</button>
            <button type="button" onClick={() => quick("15:30")} className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">15.30</button>
            <button type="button" onClick={() => { onChange(""); setOpen(false) }} className="ml-auto rounded-full px-2 py-1.5 font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400">Hapus</button>
          </div>
        </div>
      )}
    </div>
  )
}
