import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import {
  Classes,
  Spp,
  Students,
  getUser,
  waLink,
  type Klass,
  type SppInvoice,
  type Student,
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
  const [classes, setClasses] = useState<Klass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [period, setPeriod] = useState(currentPeriod())
  const [statusFilter, setStatusFilter] = useState("")
  const [classFilter, setClassFilter] = useState<number | "">("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [payOpen, setPayOpen] = useState<SppInvoice | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [s, c, st] = await Promise.all([
        Spp.list({
          period: period || undefined,
          status: statusFilter || undefined,
          classId: classFilter || undefined,
        }),
        Classes.list(),
        Students.list({ status: "aktif" }),
      ])
      setItems(s.items)
      setClasses(c.items)
      setStudents(st.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [period, statusFilter, classFilter])

  async function handleDelete(inv: SppInvoice) {
    if (!confirm(`Hapus tagihan ${inv.student_name} (${inv.period})?`)) return
    try {
      await Spp.delete(inv.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pembayaran SPP</h1>
          <p className="text-sm text-slate-600 mt-1">Kelola tagihan & pembayaran SPP siswa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateOpen(true)} className="btn-secondary">+ Tagihan Manual</button>
          <button onClick={() => setBatchOpen(true)} className="btn-primary">+ Generate Tagihan</button>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Periode</span>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="input-base" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Kelas</span>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : "")} className="input-base">
            <option value="">Semua kelas</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base">
            <option value="">Semua</option>
            <option value="belum">Belum bayar</option>
            <option value="sebagian">Sebagian</option>
            <option value="lunas">Lunas</option>
            <option value="lewat">Lewat jatuh tempo</option>
          </select>
        </label>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3">{error}</div>}

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
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
              {loading && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Memuat…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Belum ada tagihan.</td></tr>}
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{inv.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.class_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.period}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{formatRp(inv.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatRp(inv.paid_amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.due_date.slice(0, 10)}</td>
                  <td className="px-4 py-3"><SppStatus status={inv.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {inv.parent_wa && (
                      <a
                        href={waLink(inv.parent_wa, `Yth. ${inv.parent_name || "Bapak/Ibu"} wali murid ananda ${inv.student_name}.\n\nKami informasikan tagihan SPP periode ${inv.period} sebesar ${formatRp(inv.amount)}, jatuh tempo ${inv.due_date.slice(0, 10)}.\nStatus: ${inv.status}.\n\nMohon segera melakukan pembayaran. Terima kasih.`) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 mr-1"
                      >WA</a>
                    )}
                    <button onClick={() => setPayOpen(inv)} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 mr-1">
                      {inv.status === "lunas" ? "Detail" : "Bayar"}
                    </button>
                    <button onClick={() => handleDelete(inv)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BatchModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        classes={classes}
        defaultPeriod={period}
        onSuccess={() => { setBatchOpen(false); refresh() }}
        submitting={submitting}
        setSubmitting={setSubmitting}
      />

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        students={students}
        defaultPeriod={period}
        onSuccess={() => { setCreateOpen(false); refresh() }}
        submitting={submitting}
        setSubmitting={setSubmitting}
      />

      <PayModal
        invoice={payOpen}
        onClose={() => setPayOpen(null)}
        onSuccess={() => { setPayOpen(null); refresh() }}
      />
    </AppLayout>
  )
}

function SppStatus({ status }: { status: SppInvoice["status"] }) {
  const map: Record<SppInvoice["status"], string> = {
    belum: "bg-slate-100 text-slate-700",
    sebagian: "bg-amber-50 text-amber-700",
    lunas: "bg-emerald-50 text-emerald-700",
    lewat: "bg-rose-50 text-rose-700",
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{status}</span>
}

function BatchModal({
  open, onClose, classes, defaultPeriod, onSuccess, submitting, setSubmitting,
}: {
  open: boolean
  onClose: () => void
  classes: Klass[]
  defaultPeriod: string
  onSuccess: () => void
  submitting: boolean
  setSubmitting: (v: boolean) => void
}) {
  const [classId, setClassId] = useState<number | "">("")
  const [period, setPeriod] = useState(defaultPeriod)
  const [amount, setAmount] = useState(150000)
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setClassId("")
      setPeriod(defaultPeriod)
      setAmount(150000)
      setError(null)
      setResult(null)
      const [y, m] = defaultPeriod.split("-").map(Number)
      const d = new Date(y, m - 1, 10)
      setDueDate(d.toISOString().slice(0, 10))
    }
  }, [open, defaultPeriod])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const r = await Spp.batch({
        classId: classId || null,
        period,
        amount,
        dueDate,
      })
      setResult(`Berhasil membuat ${r.created} tagihan baru dari ${r.total} siswa.`)
      setTimeout(onSuccess, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate Tagihan SPP">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <p className="text-sm text-slate-600">
          Buat tagihan SPP untuk semua siswa aktif sekaligus. Tagihan yang sudah ada (untuk periode & siswa yang sama) akan dilewati.
        </p>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Kelas</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : "")} className="input-base">
            <option value="">Semua kelas</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Periode (bulan)</span>
          <input type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} className="input-base" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</span>
          <input type="number" required min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input-base" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo</span>
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-base" />
        </label>
        {error && <div className="rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-2">{error}</div>}
        {result && <div className="rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-sm p-2">{result}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Memproses…" : "Generate"}</button>
        </div>
      </form>
    </Modal>
  )
}

function CreateInvoiceModal({
  open, onClose, students, defaultPeriod, onSuccess, submitting, setSubmitting,
}: {
  open: boolean
  onClose: () => void
  students: Student[]
  defaultPeriod: string
  onSuccess: () => void
  submitting: boolean
  setSubmitting: (v: boolean) => void
}) {
  const [studentId, setStudentId] = useState<number | "">("")
  const [period, setPeriod] = useState(defaultPeriod)
  const [amount, setAmount] = useState(150000)
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStudentId(students[0]?.id ?? "")
      setPeriod(defaultPeriod)
      setAmount(150000)
      setError(null)
      const [y, m] = defaultPeriod.split("-").map(Number)
      const d = new Date(y, m - 1, 10)
      setDueDate(d.toISOString().slice(0, 10))
    }
  }, [open, defaultPeriod, students])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) return
    setSubmitting(true)
    setError(null)
    try {
      await Spp.create({ studentId: Number(studentId), period, amount, dueDate })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Tagihan SPP">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Siswa *</span>
          <select required value={studentId} onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : "")} className="input-base">
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} {s.class_name ? `(${s.class_name})` : ""}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Periode</span>
          <input type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} className="input-base" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</span>
          <input type="number" required min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input-base" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo</span>
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-base" />
        </label>
        {error && <div className="rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-2">{error}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : "Tambah"}</button>
        </div>
      </form>
    </Modal>
  )
}

function PayModal({
  invoice, onClose, onSuccess,
}: {
  invoice: SppInvoice | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [paidAmount, setPaidAmount] = useState(0)
  const [method, setMethod] = useState<"cash" | "transfer" | "lain">("cash")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invoice) {
      setPaidAmount(Number(invoice.paid_amount) || Number(invoice.amount))
      setMethod((invoice.method as "cash" | "transfer" | "lain") || "cash")
      setError(null)
    }
  }, [invoice])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    setSubmitting(true)
    setError(null)
    try {
      await Spp.pay(invoice.id, { paidAmount, method })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!invoice} onClose={onClose} title="Catat Pembayaran SPP">
      {invoice && (
        <form onSubmit={handleSave} className="grid gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <div><span className="text-slate-500">Siswa:</span> <span className="font-medium">{invoice.student_name}</span></div>
            <div><span className="text-slate-500">Periode:</span> {invoice.period}</div>
            <div><span className="text-slate-500">Tagihan:</span> {formatRp(invoice.amount)}</div>
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Dibayar (Rp)</span>
            <input type="number" required min={0} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Metode</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "transfer" | "lain")} className="input-base">
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="lain">Lainnya</option>
            </select>
          </label>
          {error && <div className="rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Tutup</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : "Simpan"}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
