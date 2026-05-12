import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Select from "../components/Select"
import MonthPicker from "../components/MonthPicker"
import ConfirmDialog from "../components/ConfirmDialog"
import { AlertBox, EmptyState, TableSkeleton } from "../components/UiState"
import {
  Classes,
  Spp,
  Finance,
  type FinanceInvoice,

  getUser,
  waLink,
  type Klass,
  type SppInvoice,

} from "../lib/api"

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatRp(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n
  return "Rp " + num.toLocaleString("id-ID")
}

export default function SppPage() {
  const user = getUser()
  const [items, setItems] = useState<SppInvoice[]>([])
  const [financeItems, setFinanceItems] = useState<FinanceInvoice[]>([])
  const [classes, setClasses] = useState<Klass[]>([])

  const [period, setPeriod] = useState(currentPeriod())
  const [statusFilter, setStatusFilter] = useState(() => new URLSearchParams(window.location.search).get("status") || "")
  const [classFilter, setClassFilter] = useState<number | "">("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<SppInvoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [s, f, c] = await Promise.all([
        Spp.list({
          period: period || undefined,
          status: statusFilter || undefined,
          classId: classFilter || undefined,
        }),
        Finance.invoices({
          period: period || undefined,
          status: statusFilter === "lunas" ? "paid" : statusFilter === "belum" ? "unpaid" : statusFilter === "sebagian" ? "partial" : statusFilter === "lewat" ? "overdue" : undefined,
          classId: classFilter || undefined,
        }).catch(() => ({ items: [] })),
        Classes.list(),
      ])
      setItems(s.items)
      setFinanceItems(f.items)
      setClasses(c.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [period, statusFilter, classFilter])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await Spp.delete(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus")
    } finally {
      setDeleting(false)
    }
  }

  const sppSummary = items.reduce(
    (acc, inv) => {
      const amount = Number(inv.amount) || 0
      const paid = Number(inv.paid_amount) || 0
      acc.billed += amount
      acc.paid += paid
      acc.outstanding += Math.max(amount - paid, 0)
      if (inv.status === "lewat" || (inv.status !== "lunas" && inv.due_date.slice(0, 10) < new Date().toISOString().slice(0, 10))) acc.overdue_count += 1
      return acc
    },
    { billed: 0, paid: 0, outstanding: 0, overdue_count: 0 },
  )

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pembayaran SPP</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Kelola tagihan & pembayaran SPP siswa</p>
        </div>
        <div className="flex gap-2">
          <Link to="/spp/baru" className="btn-secondary">+ Tagihan Manual</Link>
          <Link to="/spp/generate" className="btn-primary">+ Generate Tagihan</Link>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Periode</span>
          <MonthPicker value={period} onChange={setPeriod} />
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelas</span>
          <Select
            value={classFilter === "" ? "" : String(classFilter)}
            onChange={(v) => setClassFilter(v ? Number(v) : "")}
            options={[{ value: "", label: "Semua kelas" }, ...classes.map((c) => ({ value: String(c.id), label: c.name }))]}
          />
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Semua" },
              { value: "belum", label: "Belum bayar" },
              { value: "sebagian", label: "Sebagian" },
              { value: "lunas", label: "Lunas" },
              { value: "lewat", label: "Lewat jatuh tempo" },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Tagihan" value={formatRp(sppSummary.billed)} />
        <SummaryCard label="Terbayar" value={formatRp(sppSummary.paid)} tone="emerald" />
        <SummaryCard label="Sisa Piutang" value={formatRp(sppSummary.outstanding)} tone="amber" />
        <SummaryCard label="Overdue" value={`${sppSummary.overdue_count || 0} invoice`} tone="rose" />
      </div>

      {financeItems.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Invoice Finance Baru</h2>
            <p className="text-xs text-slate-500">Mendukung multi item, diskon, denda, pembayaran parsial, dan reminder WhatsApp.</p>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
            {financeItems.slice(0, 8).map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">{inv.invoice_no}<div className="text-xs font-normal text-slate-500">{inv.student_name} • {inv.class_name || "—"}</div></td>
                <td className="px-4 py-3">{inv.period || "—"}</td>
                <td className="px-4 py-3">{formatRp(inv.total_amount)}<div className="text-xs text-slate-500">dibayar {formatRp(inv.paid_amount)}</div></td>
                <td className="px-4 py-3"><FinanceStatus status={inv.status} /></td>
                <td className="px-4 py-3 text-right">
                  {inv.parent_wa && <a className="btn-secondary-sm" target="_blank" rel="noreferrer" href={waLink(inv.parent_wa, `Yth. ${inv.parent_name || "Bapak/Ibu"}, tagihan ${inv.invoice_no} ananda ${inv.student_name} sebesar ${formatRp(inv.total_amount)} tersisa ${formatRp(Number(inv.total_amount) - Number(inv.paid_amount))}, jatuh tempo ${inv.due_date.slice(0,10)}. Terima kasih.`) || "#"}>Reminder WA</a>}
                </td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
      )}

      {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Siswa</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">Periode</th>
                <th className="px-4 py-3 font-semibold">Tagihan</th>
                <th className="px-4 py-3 font-semibold">Dibayar</th>
                <th className="px-4 py-3 font-semibold">Jatuh Tempo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} cols={8} />}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="Belum ada tagihan" desc="Generate tagihan SPP untuk siswa aktif atau ubah filter periode/status." action={<Link to="/spp/generate" className="btn-primary-sm">+ Generate Tagihan</Link>} />
                  </td>
                </tr>
              )}
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{inv.student_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.class_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.period}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{formatRp(inv.amount)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatRp(inv.paid_amount)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.due_date.slice(0, 10)}</td>
                  <td className="px-4 py-3"><SppStatus status={inv.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {inv.parent_wa && (
                      <a
                        href={waLink(inv.parent_wa, `Yth. ${inv.parent_name || "Bapak/Ibu"} wali murid ananda ${inv.student_name}.\n\nKami informasikan tagihan SPP periode ${inv.period} sebesar ${formatRp(inv.amount)}, jatuh tempo ${inv.due_date.slice(0, 10)}.\nStatus: ${inv.status}.\n\nMohon segera melakukan pembayaran. Terima kasih.`) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 mr-1"
                      >WA</a>
                    )}
                    <Link to={`/spp/${inv.id}/bayar`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10 mr-1">
                      {inv.status === "lunas" ? "Detail" : "Bayar"}
                    </Link>
                    <button onClick={() => setDeleteTarget(inv)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus tagihan SPP?"
        message={`Tagihan ${deleteTarget?.student_name || "siswa"} periode ${deleteTarget?.period || "ini"} akan dihapus permanen. Riwayat status pembayaran pada tagihan ini ikut hilang.`}
        confirmLabel="Hapus Tagihan"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}

function SummaryCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "amber" | "rose" }) {
  const tones = {
    slate: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
  }
  return <div className={`rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-slate-800 ${tones[tone]}`}><div className="text-xs font-semibold opacity-70">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>
}

function FinanceStatus({ status }: { status: FinanceInvoice["status"] }) {
  const map: Record<FinanceInvoice["status"], string> = {
    unpaid: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
    partial: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    overdue: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400",
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{status}</span>
}

function SppStatus({ status }: { status: SppInvoice["status"] }) {
  const map: Record<SppInvoice["status"], string> = {
    belum: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
    sebagian: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    lunas: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    lewat: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{status}</span>
}
