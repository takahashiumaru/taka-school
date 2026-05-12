import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { AlertBox, TableSkeleton } from "../components/UiState"
import { Finance, type FinanceInvoice, waLink } from "../lib/api"

type Detail = { invoice: FinanceInvoice & { subtotal?: number; discount_amount?: number; late_fee_amount?: number; issue_date?: string }; items: any[]; payments: any[] }
const money = (n: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n || 0))

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { (async () => { try { setLoading(true); setData(await Finance.getInvoice(Number(id))) } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat invoice") } finally { setLoading(false) } })() }, [id])
  const inv = data?.invoice
  const wa = inv?.parent_wa ? waLink(inv.parent_wa, `Yth. ${inv.parent_name || "Bapak/Ibu"}, tagihan ${inv.invoice_no} ananda ${inv.student_name} sebesar ${money(inv.total_amount - inv.paid_amount)}.`) : null
  return <AppLayout>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link to="/spp" className="text-sm font-semibold text-primary-700 dark:text-primary-300">← Kembali</Link><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{inv?.invoice_no || "Detail Invoice"}</h1></div>
      {inv && <div className="flex flex-wrap gap-2"><Link to={`/spp/${inv.id}/print`} className="btn-secondary">Cetak Invoice</Link><Link to={`/spp/${inv.id}/receipt`} className="btn-secondary">Kwitansi</Link>{inv.status !== "paid" && <Link to={`/spp/${inv.id}/bayar`} className="btn-primary">Bayar</Link>}</div>}
    </div>
    {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}
    {loading ? <div className="mt-5"><TableSkeleton rows={4} cols={2} /></div> : inv && data && <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><h2 className="font-bold">Ringkasan</h2><Info k="Siswa" v={`${inv.student_name} (${inv.class_name || "—"})`} /><Info k="Periode" v={inv.period} /><Info k="Jatuh Tempo" v={String(inv.due_date).slice(0, 10)} /><Info k="Status" v={inv.status} />{wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-secondary mt-4 w-full justify-center">Kirim WA</a>}</section>
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:col-span-2"><h2 className="font-bold">Nominal</h2><div className="mt-4 grid sm:grid-cols-3 gap-3"><Card l="Total" v={money(inv.total_amount)} /><Card l="Terbayar" v={money(inv.paid_amount)} /><Card l="Sisa" v={money(Number(inv.total_amount) - Number(inv.paid_amount))} /></div><h3 className="mt-6 font-bold">Item</h3><div className="mt-2 overflow-x-auto"><table className="min-w-full text-sm"><tbody>{data.items.map((it) => <tr key={it.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-2">{it.description}</td><td className="py-2 text-right">{money(it.line_total)}</td></tr>)}</tbody></table></div><h3 className="mt-6 font-bold">Pembayaran</h3><div className="mt-2 space-y-2">{data.payments.length ? data.payments.map((p) => <div key={p.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><b>{money(p.amount)}</b> · {p.payment_method_name || "—"} · {String(p.paid_at).slice(0, 10)}</div>) : <div className="text-sm text-slate-500">Belum ada pembayaran.</div>}</div></section>
    </div>}
  </AppLayout>
}
function Info({ k, v }: { k: string; v: any }) { return <div className="mt-3"><div className="text-xs text-slate-500">{k}</div><div className="font-medium">{v || "—"}</div></div> }
function Card({ l, v }: { l: string; v: string }) { return <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><div className="text-xs text-slate-500">{l}</div><div className="mt-1 font-black">{v}</div></div> }
