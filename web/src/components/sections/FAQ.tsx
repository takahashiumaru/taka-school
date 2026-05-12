import { useState } from "react"

const faqs = [
  { q: "Jenjang apa saja yang didukung?", a: "Taka School diarahkan untuk PAUD, TK, SD, SMP, SMA, dan sekolah multi-jenjang/yayasan. Struktur kelas fleksibel sehingga bisa disesuaikan dengan kebutuhan sekolah." },
  { q: "Apakah PPDB sudah bisa mencari alamat di peta?", a: "Ya. Form PPDB publik mendukung pencarian alamat via OpenStreetMap/Nominatim, peta Leaflet, klik/drag marker, tombol lokasi user, dan penyimpanan latitude-longitude." },
  { q: "Apakah ringkasan SPP sudah real-time?", a: "Ya. Halaman SPP menghitung Total Tagihan, Terbayar, Sisa Piutang, dan Overdue dari invoice yang sedang tampil sesuai filter periode, kelas, dan status." },
  { q: "Apakah orang tua perlu install aplikasi?", a: "Tidak. Orang tua tetap bisa menerima info melalui WhatsApp/link. Admin atau guru dapat memakai template WA untuk absensi, SPP, pengumuman, dan informasi penting lain." },
  { q: "Siapa saja yang bisa login ke aplikasi?", a: "Admin dan guru. Admin punya akses penuh; guru diarahkan untuk modul operasional seperti data kelas, absensi, rapor, dan informasi siswa sesuai kebutuhan." },
  { q: "Apakah ada data demo dan SQL?", a: "Ada. Repo menyertakan seed demo SMA realistis dan export SQL demo di database/taka-school-demo.sql. File .env asli tetap di-ignore agar database/secret produksi tidak ikut commit." },
  { q: "Apakah pembayaran otomatis dengan payment gateway?", a: "Saat ini fokusnya pencatatan tagihan/pembayaran manual, piutang, overdue, dan reminder WhatsApp. Integrasi payment gateway seperti Midtrans/Xendit bisa masuk fase berikutnya." },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-3xl mx-auto container-px">
        <div className="text-center">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title">Pertanyaan yang sering ditanyakan</h2>
          <p className="section-sub mx-auto">
            Ringkasan kemampuan terbaru Taka School berdasarkan kondisi aplikasi saat ini.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`rounded-2xl bg-white ring-1 transition dark:bg-slate-900 ${isOpen ? "ring-primary-300 shadow-soft dark:ring-primary-500/50" : "ring-slate-200 dark:ring-slate-800"}`}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 text-left p-5" aria-expanded={isOpen}>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{f.q}</span>
                  <svg className={`h-5 w-5 flex-none text-primary-600 transition dark:text-primary-400 ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && <div className="px-5 pb-5 -mt-1 text-slate-600 dark:text-slate-400">{f.a}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
