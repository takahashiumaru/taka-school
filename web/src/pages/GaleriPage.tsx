import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import {
  Galleries,
  uploadFile,
  type Gallery,
  type GalleryItem,
} from "../lib/api"


export default function GaleriPage() {
  const [items, setItems] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<(Gallery & { items: GalleryItem[] }) | null>(null)
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoCaption, setPhotoCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Gallery | null>(null)
  const [photoDeleteTarget, setPhotoDeleteTarget] = useState<number | null>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)
  const bulkFileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const r = await Galleries.list()
      setItems(r.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleDelete(g: Gallery) {
    try {
      await Galleries.delete(g.id)
      setDeleteTarget(null)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  async function openView(g: Gallery) {
    try {
      const data = await Galleries.get(g.id)
      setViewing(data)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  async function handleAddPhotoUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!viewing || !photoUrl) return
    try {
      await Galleries.addItem(viewing.id, { photoUrl, caption: photoCaption || null })
      const data = await Galleries.get(viewing.id)
      setViewing(data)
      setPhotoUrl("")
      setPhotoCaption("")
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !viewing) return
    setUploading(true)
    try {
      const r = await uploadFile(file)
      await Galleries.addItem(viewing.id, { photoUrl: r.url, caption: photoCaption || null })
      const data = await Galleries.get(viewing.id)
      setViewing(data)
      setPhotoCaption("")
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload gagal")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !viewing) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const r = await uploadFile(file)
        await Galleries.addItem(viewing.id, { photoUrl: r.url, caption: null })
      }
      const data = await Galleries.get(viewing.id)
      setViewing(data)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload gagal")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleRemovePhoto(itemId: number) {
    if (!viewing) return
    try {
      await Galleries.removeItem(viewing.id, itemId)
      setPhotoDeleteTarget(null)
      const data = await Galleries.get(viewing.id)
      setViewing(data)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Galeri Kegiatan</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Album foto kegiatan sekolah</p>
        </div>
        <Link to="/galeri/baru" className="btn-primary">+ Album Baru</Link>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="text-slate-500 dark:text-slate-400">Memuat…</div>}
        {!loading && items.length === 0 && <div className="text-slate-500 dark:text-slate-400">Belum ada album.</div>}
        {items.map((g) => (
          <div key={g.id} className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
            <button onClick={() => openView(g)} className="block w-full text-left">
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden dark:bg-slate-800">
                {g.cover_url ? (
                  <img src={g.cover_url} alt={g.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm dark:text-slate-500">Tanpa cover</div>
                )}
              </div>
              <div className="p-4">
                <div className="font-bold text-slate-900 dark:text-slate-100">{g.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {g.event_date ? new Date(g.event_date).toLocaleDateString("id-ID") : "—"}
                  <span> · {g.photo_count} foto</span>
                </div>
                {g.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{g.description}</p>}
              </div>
            </button>
            <div className="px-4 pb-3 flex gap-2">
              <Link to={`/galeri/${g.id}/edit`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10">Edit</Link>
              <button onClick={() => setDeleteTarget(g)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || ""} size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 space-y-2 dark:bg-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={bulkFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkUpload}
                  hidden
                />
                <button
                  type="button"
                  onClick={() => bulkFileRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary-sm disabled:opacity-50"
                >
                  {uploading ? "Mengupload…" : "📷 Upload foto (bisa banyak)"}
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">atau tambah via URL ↓</span>
              </div>
              <form onSubmit={handleAddPhotoUrl} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="URL foto (https://…)"
                  className="input-base"
                />
                <input
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Caption (opsional)"
                  className="input-base"
                />
                <div className="flex gap-2">
                  <input ref={photoFileRef} type="file" accept="image/*" onChange={handlePhotoFile} hidden />
                  <button
                    type="button"
                    onClick={() => photoFileRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary-sm disabled:opacity-50"
                  >
                    Upload
                  </button>
                  <button type="submit" disabled={!photoUrl || uploading} className="btn-primary-sm disabled:opacity-50">+ URL</button>
                </div>
              </form>
            </div>
            {viewing.items.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Belum ada foto.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {viewing.items.map((it) => (
                  <div key={it.id} className="rounded-xl overflow-hidden ring-1 ring-slate-200 relative group dark:ring-slate-700">
                    <img src={it.photo_url} alt={it.caption ?? ""} className="aspect-square w-full object-cover" />
                    {it.caption && <div className="p-2 text-xs text-slate-600 dark:text-slate-300 dark:bg-slate-800">{it.caption}</div>}
                    <button
                      onClick={() => setPhotoDeleteTarget(it.id)}
                      className="absolute top-1 right-1 px-2 py-0.5 rounded-md text-xs bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus album galeri?"
        message={`Album "${deleteTarget?.title || "ini"}" beserta semua fotonya akan dihapus permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus Album"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? handleDelete(deleteTarget) : undefined}
      />
      <ConfirmDialog
        open={photoDeleteTarget !== null}
        title="Hapus foto?"
        message="Foto ini akan dihapus permanen dari album dan tidak bisa dikembalikan."
        confirmLabel="Hapus Foto"
        onClose={() => setPhotoDeleteTarget(null)}
        onConfirm={() => photoDeleteTarget !== null ? handleRemovePhoto(photoDeleteTarget) : undefined}
      />
    </AppLayout>
  )
}
