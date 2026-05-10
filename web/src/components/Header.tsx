import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Logo from "./Logo"
import { ThemeToggle } from "./ThemeProvider"

const navLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cocok", label: "Cocok Untuk" },
  { href: "#cara", label: "Cara Kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "bg-white/85 backdrop-blur ring-1 ring-slate-200 dark:bg-slate-950/85 dark:ring-slate-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto container-px h-16 flex items-center justify-between">
        <Link to="/" aria-label="Taka School">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 rounded-lg hover:bg-primary-50 transition dark:text-slate-300 dark:hover:text-primary-300 dark:hover:bg-slate-800"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost">
            Masuk
          </Link>
          <a href="#daftar" className="btn-primary">
            Daftar Sekolah
          </a>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Buka menu"
          >
          <svg className="h-6 w-6 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto container-px py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-primary-50 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-secondary flex-1">
                Masuk
              </Link>
              <a href="#daftar" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                Daftar
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
