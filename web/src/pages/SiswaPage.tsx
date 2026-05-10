import { useEffect, useMemo, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import Select from "../components/Select"
import {
  Classes,
  Students,
  getUser,
  waLink,
  type Klass,
  type Student,
} from "../lib/api"

type FormState = {
  id?: number
  name: string
  nis: string
  classId: number | null
  gender: "L" | "P" | ""
  birthDate: string
  parentName: string
  parentWa: string
  address: string
  status: "aktif" | "lulus" | "keluar"
}

const emptyForm: FormState = {
  name: "",
  nis: "",
  classId: null,
  gender: "",
  birthDate: "",
  parentName: "",
  parentWa: "",
  address: "",
  status: "aktif",
}

export default function SiswaPage() {
  const user = getUser()
  const [items, setItems] = useState<Student[]>([])
  const [classes, setClasses] = useState<Klass[]>([])
  const [q, setQ] = useState("")
  const [filterClass, setFilterClass] = useState<number | "">("")
  const [filterStatus, setFilterStatus] = useState<string>("aktif")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [s, c] = await Promise.all([
        Students.list({
          q: q || undefined,
          classId: filterClass || undefined,
          status: filterStatus || undefined,
        }),
        Classes.list(),
      ])
      setItems(s.items)
      setClasses(c.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [filterClass, filterStatus])

  function openNew() {
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(s: Student) {
    setForm({
      id: s.id,
      name: s.name,
      nis: s.nis ?? "",
      classId: s.class_id,
      gender: s.gender ?? "",
      birthDate: s.birth_date ? s.birth_date.slice(0, 10) : "",
      parentName: s.parent_name ?? "",
      parentWa: s.parent_wa ?? "",
      address: s.address ?? "",
      status: s.status,
    })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        nis: form.nis || null,
        classId: form.classId,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        parentName: form.parentName || null,
        parentWa: form.parentWa || null,
        address: form.address || null,
        status: form.status,
      }
      if (form.id) await Students.update(form.id, payload)
      else await Students.create(payload)
      setModalOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(s: Student) {
    if (!confirm(`Hapus siswa "${s.name}"?`)) return
    try {
      await Students.delete(s.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus")
    }
  }

  const filtered = useMemo(() => {
    if (!q) return items
    const needle = q.toLowerCase()
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.nis ?? "").toLowerCase().includes(needle) ||
        (s.parent_name ?? "").toLowerCase().includes(needle),
    )
  }, [items, q])

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Siswa</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{filtered.length} siswa ditampilkan</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Tambah Siswa</button>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / NIS / wali murid…"
          className="input-base"
        />
        <Select
          value={filterClass === "" ? "" : String(filterClass)}
          onChange={(v) => setFilterClass(v ? Number(v) : "")}
          options={[{ value: "", label: "Semua Kelas" }, ...classes.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Semua Status" },
            { value: "aktif", label: "Aktif" },
            { value: "lulus", label: "Lulus" },
            { value: "keluar", label: "Keluar" },
          ]}
        />
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">NIS</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">L/P</th>
                <th className="px-4 py-3 font-semibold">Wali</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Memuat…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Belum ada data.</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.nis || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.class_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.gender || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {s.parent_name ? (
                      <span>
                        {s.parent_name}
                        {s.parent_wa && <span className="text-slate-400 dark:text-slate-500"> · {s.parent_wa}</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {s.parent_wa && (
                      <a
                        href={waLink(s.parent_wa, `Halo ${s.parent_name || "Bapak/Ibu"}, mohon waktunya untuk informasi terkait ananda ${s.name} di sekolah.`) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 mr-1"
                        title="Chat WA wali murid"
                      >
                        WA
                      </a>
                    )}
                    <button onClick={() => openEdit(s)} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10 mr-1">Edit</button>
                    <button onClick={() => handleDelete(s)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Siswa" : "Tambah Siswa"} size="lg">
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-3">
          <Field label="Nama Lengkap *" full>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          </Field>
          <Field label="NIS">
            <input value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="input-base" />
          </Field>
          <Field label="Kelas">
            <Select
              value={form.classId ? String(form.classId) : ""}
              onChange={(v) => setForm({ ...form, classId: v ? Number(v) : null })}
              options={[{ value: "", label: "— Belum berkelas —" }, ...classes.map((c) => ({ value: String(c.id), label: c.name }))]}
            />
          </Field>
          <Field label="Jenis Kelamin">
            <Select
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v as "L" | "P" | "" })}
              options={[
                { value: "", label: "—" },
                { value: "L", label: "Laki-laki" },
                { value: "P", label: "Perempuan" },
              ]}
            />
          </Field>
          <Field label="Tanggal Lahir">
            <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="input-base" />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as "aktif" | "lulus" | "keluar" })}
              options={[
                { value: "aktif", label: "Aktif" },
                { value: "lulus", label: "Lulus" },
                { value: "keluar", label: "Keluar" },
              ]}
            />
          </Field>
          <Field label="Nama Wali Murid">
            <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="input-base" />
          </Field>
          <Field label="No. WhatsApp Wali">
            <input value={form.parentWa} onChange={(e) => setForm({ ...form, parentWa: e.target.value })} placeholder="08xxxxxxxxxx" className="input-base" />
          </Field>
          <Field label="Alamat" full>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="input-base" />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? "Menyimpan…" : form.id ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</span>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: "aktif" | "lulus" | "keluar" }) {
  const colors = {
    aktif: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    lulus: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    keluar: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status]}`}>{status}</span>
}
