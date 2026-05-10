import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import { ApiError, login } from "../lib/api"

export default function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"admin" | "guru">("guru")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function fillDemo(r: "admin" | "guru") {
    setRole(r)
    setEmail(r === "admin" ? "admin@demo.id" : "guru@demo.id")
    setPassword(r === "admin" ? "admin123" : "guru123")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await login(email, password)
      navigate(res.user.role === "admin" ? "/dashboard" : "/dashboard")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Tidak bisa terhubung ke server"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="relative hidden lg:flex bg-gradient-to-br from-primary-600 to-primary-800 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative">
          <Link to="/">
            <Logo variant="white" />
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Selamat datang kembali</h2>
          <p className="mt-3 text-primary-100 max-w-md">
            Masuk untuk kelola data sekolah, input absensi, dan kirim info ke orang tua.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-100">
            {[
              "Dashboard ringkas, mudah dipahami",
              "Absensi cepat dengan bulk input",
              "Reminder SPP & pengumuman via WhatsApp",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <svg className="h-5 w-5 flex-none text-primary-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-200">© {new Date().getFullYear()} Taka School</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Masuk ke Taka School</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Halaman login untuk admin & guru sekolah.</p>

          <div className="mt-6 inline-flex p-1 rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            {(["guru", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  role === r
                    ? "bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {r === "guru" ? "Guru" : "Admin Sekolah"}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-primary-50 ring-1 ring-primary-100 px-4 py-3 text-sm text-primary-800 dark:bg-primary-500/10 dark:ring-primary-500/30 dark:text-primary-200">
            <div className="font-semibold">Akun demo:</div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="text-left rounded-lg bg-white px-2 py-1.5 ring-1 ring-primary-100 hover:bg-primary-100 dark:bg-slate-900 dark:ring-primary-500/40 dark:hover:bg-primary-500/15"
              >
                <div className="font-semibold">Admin</div>
                <div className="text-slate-600 dark:text-slate-400">admin@demo.id / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("guru")}
                className="text-left rounded-lg bg-white px-2 py-1.5 ring-1 ring-primary-100 hover:bg-primary-100 dark:bg-slate-900 dark:ring-primary-500/40 dark:hover:bg-primary-500/15"
              >
                <div className="font-semibold">Guru</div>
                <div className="text-slate-600 dark:text-slate-400">guru@demo.id / guru123</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "admin" ? "admin@sekolah.sch.id" : "guru@sekolah.sch.id"}
                className="mt-1.5 w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none px-4 py-3 text-sm dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200">
                  Lupa password?
                </a>
              </div>
              <div className="relative mt-1.5">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none px-4 py-3 pr-11 text-sm dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label={showPwd ? "Sembunyikan" : "Tampilkan"}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showPwd ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.65A10.94 10.94 0 0112 4.5c5 0 9.27 3.11 10.5 7.5a11.36 11.36 0 01-3.04 4.39M6.12 6.12A11.36 11.36 0 001.5 12c1.23 4.39 5.5 7.5 10.5 7.5 1.6 0 3.12-.32 4.5-.9" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12C3.7 7.6 7.5 4.5 12 4.5s8.3 3.1 9.5 7.5c-1.2 4.4-5 7.5-9.5 7.5S3.7 16.4 2.5 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800" />
              Ingat saya di perangkat ini
            </label>

            {error && (
              <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 disabled:opacity-60">
              {submitting ? "Memproses…" : `Masuk sebagai ${role === "admin" ? "Admin" : "Guru"}`}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600 text-center dark:text-slate-400">
            Belum punya akun sekolah?{" "}
            <Link to="/#daftar" className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200">
              Daftar Sekolah
            </Link>
          </p>

          <p className="mt-8 text-xs text-slate-500 text-center dark:text-slate-500">
            Orang tua tidak perlu login. Info anak dikirim via WhatsApp dari sekolah.
          </p>
        </div>
      </div>
    </div>
  )
}
