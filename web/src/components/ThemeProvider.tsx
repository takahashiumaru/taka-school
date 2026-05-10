import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = "takaschool.theme"

function getInitial(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyToDoc(t: Theme) {
  const root = document.documentElement
  if (t === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
  root.style.colorScheme = t
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitial())

  useEffect(() => {
    applyToDoc(theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  const value: Ctx = {
    theme,
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setTheme: setThemeState,
  }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Ctx {
  const v = useContext(ThemeContext)
  if (!v) throw new Error("useTheme must be inside ThemeProvider")
  return v
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aktifkan light mode" : "Aktifkan dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ring-1 ring-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors ${className}`}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  )
}
