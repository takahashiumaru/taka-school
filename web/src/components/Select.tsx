import { useEffect, useRef, useState, type ReactNode } from "react"

export type SelectOption = {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  size?: "sm" | "md"
  leadingIcon?: ReactNode
  emptyText?: string
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  disabled,
  className = "",
  id,
  required,
  size = "md",
  leadingIcon,
  emptyText = "Tidak ada opsi",
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState<number>(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setHighlight(idx >= 0 ? idx : 0)
    }
  }, [open, value, options])

  useEffect(() => {
    if (!open || highlight < 0) return
    const li = listRef.current?.children?.[highlight] as HTMLElement | undefined
    li?.scrollIntoView({ block: "nearest" })
  }, [highlight, open])

  function commit(v: string) {
    onChange(v)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(options.length - 1, h + 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)) }
    else if (e.key === "Home") { e.preventDefault(); setHighlight(0) }
    else if (e.key === "End") { e.preventDefault(); setHighlight(options.length - 1) }
    else if (e.key === "Enter") {
      e.preventDefault()
      const opt = options[highlight]
      if (opt && !opt.disabled) commit(opt.value)
    } else if (e.key === "Escape") { e.preventDefault(); setOpen(false) }
  }

  const sizeCls = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKey}
        className={`w-full ${sizeCls} rounded-xl ring-1 ring-slate-200 bg-white/95 text-left text-slate-900 shadow-sm hover:ring-primary-200 focus:ring-2 focus:ring-primary-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-slate-950/80 dark:ring-slate-700 dark:text-slate-100 dark:hover:ring-primary-500/40 dark:focus:ring-primary-600 transition-all`}
      >
        {leadingIcon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{leadingIcon}</span>}
        <span className={`flex-1 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-[9999] mt-2 max-h-64 overflow-auto rounded-2xl bg-white/95 p-1.5 shadow-2xl ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/95 dark:ring-slate-700">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">{emptyText}</div>
          ) : (
            <ul ref={listRef} role="listbox" tabIndex={-1}>
              {options.map((o, idx) => {
                const isSel = o.value === value
                const isHi = idx === highlight
                return (
                  <li
                    key={`${o.value}-${idx}`}
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => { e.preventDefault(); if (!o.disabled) commit(o.value) }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer select-none ${
                      o.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isHi
                          ? "bg-primary-50 text-primary-800 dark:bg-primary-500/15 dark:text-primary-200"
                          : "text-slate-700 dark:text-slate-200"
                    } ${isSel ? "font-semibold" : ""}`}
                  >
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="text-xs text-slate-400 dark:text-slate-500">{o.hint}</span>}
                    {isSel && (
                      <svg viewBox="0 0 20 20" className="h-4 w-4 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l4 4 6-7" />
                      </svg>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
