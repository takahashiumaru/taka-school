import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"

export default function UnauthorizedPage() {
  return (
    <AppLayout>
      <div className="max-w-xl rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Akses ditolak</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Role akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link to="/dashboard" className="btn-primary mt-5 inline-flex">Kembali ke Dashboard</Link>
      </div>
    </AppLayout>
  )
}
