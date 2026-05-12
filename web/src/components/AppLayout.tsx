import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import Logo from "./Logo"
import { clearAuth, getUser } from "../lib/api"
import { can, roleLabels } from "../lib/permissions"
import { ThemeToggle } from "./ThemeProvider"

type NavGroup = "Utama" | "Master Data" | "Operasional" | "Keuangan" | "Publikasi" | "Sistem"

type NavItem = {
  to: string
  label: string
  shortLabel?: string
  icon: string
  group: NavGroup
  mobile?: boolean
  show?: (role: NonNullable<ReturnType<typeof getUser>>["role"]) => boolean
}

const GROUPS: NavGroup[] = ["Utama", "Master Data", "Operasional", "Keuangan", "Publikasi", "Sistem"]

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h14V10", group: "Utama", mobile: true },
  { to: "/portal", label: "Portal", icon: "M4 6h16M4 12h16M4 18h7", group: "Utama", mobile: true, show: (r) => ["teacher", "guru", "parent", "student"].includes(r) },
  { to: "/siswa", label: "Data Siswa", shortLabel: "Siswa", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z", group: "Master Data", mobile: true, show: can.readSchoolData },
  { to: "/guru", label: "Data Guru", icon: "M5 13l4 4L19 7", group: "Master Data", show: can.readSchoolData },
  { to: "/kelas", label: "Kelas", icon: "M3 7l9-4 9 4-9 4-9-4z M3 12l9 4 9-4", group: "Master Data", show: can.readSchoolData },
  { to: "/admissions", label: "PPDB", icon: "M9 12h6m-6 4h6M7 4h10l2 4v12H5V8l2-4z", group: "Master Data", show: (r) => ["admin", "staff"].includes(r) },
  { to: "/absensi", label: "Absensi", icon: "M9 12l2 2 4-4M5 5h14v14H5z", group: "Operasional", mobile: true, show: (r) => ["admin", "staff", "teacher", "guru"].includes(r) },
  { to: "/jadwal", label: "Jadwal", icon: "M8 7V3m8 4V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z", group: "Operasional", show: can.readSchoolData },
  { to: "/rapor", label: "Rapor", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z", group: "Operasional" },
  { to: "/operasional", label: "Operasional", icon: "M4 21V7l8-4 8 4v14M9 21v-6h6v6", group: "Operasional", show: (r) => ["admin", "staff", "teacher", "guru", "headmaster"].includes(r) },
  { to: "/akademik", label: "Akademik", icon: "M12 6v12M6 12h12M4 4h16v16H4z", group: "Operasional", show: can.manageAdminData },
  { to: "/spp", label: "SPP", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v2", group: "Keuangan", mobile: true, show: can.readSchoolData },
  { to: "/pengumuman", label: "Pengumuman", icon: "M11 5L6 9H2v6h4l5 4V5z M15.5 8a4 4 0 010 8", group: "Publikasi" },
  { to: "/galeri", label: "Galeri", icon: "M4 16l4-4 4 4 8-8M4 6h16v12H4z", group: "Publikasi" },
  { to: "/import-export", label: "Import/Export", icon: "M4 7h16M4 12h16M4 17h16M8 3v18m8-18v18", group: "Sistem", show: (r) => ["admin", "staff"].includes(r) },
  { to: "/ai-saas", label: "AI & SaaS", icon: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z", group: "Sistem", show: (r) => ["admin", "staff", "headmaster"].includes(r) },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const visible = NAV.filter((n) => !n.show || n.show(user.role))

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between gap-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Tutup menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 pb-8 overscroll-contain">
          {GROUPS.map((group) => {
            const items = visible.filter((n) => n.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="mb-5 last:mb-0">
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {group}
                </div>
                <div className="space-y-1">
                  {items.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      end={n.to === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
                      </svg>
                      {n.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/60 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="min-w-0 lg:ml-64 flex min-h-screen flex-col">
        <header className="bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sticky top-0 z-20">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6">
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu"
            >
              <svg className="h-6 w-6 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {currentTitle(location.pathname)}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {roleLabels[user.role] || user.role} · {user.schoolName}
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200 flex items-center justify-center font-bold">
                {user.name[0]?.toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-700 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 dark:text-slate-300 dark:hover:text-rose-400 dark:hover:bg-rose-500/10"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  )
}

function currentTitle(path: string): string {
  if (path.startsWith("/dashboard")) return "Dashboard"
  if (path.startsWith("/portal")) return "Portal"
  if (path.startsWith("/siswa")) return "Data Siswa"
  if (path.startsWith("/guru")) return "Data Guru"
  if (path.startsWith("/kelas")) return "Kelas"
  if (path.startsWith("/absensi")) return "Absensi"
  if (path.startsWith("/jadwal")) return "Jadwal"
  if (path.startsWith("/spp")) return "Pembayaran SPP"
  if (path.startsWith("/pengumuman")) return "Pengumuman"
  if (path.startsWith("/galeri")) return "Galeri"
  if (path.startsWith("/rapor")) return "Rapor"
  if (path.startsWith("/akademik")) return "Pengaturan Akademik"
  if (path.startsWith("/admissions") || path.startsWith("/ppdb/admin")) return "PPDB"
  if (path.startsWith("/import-export")) return "Import/Export"
  if (path.startsWith("/ai-saas")) return "AI & SaaS Foundation"
  return ""
}
