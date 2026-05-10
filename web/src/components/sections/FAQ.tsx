import { useState } from "react"

const faqs = [
  {
    q: "Apakah orang tua perlu install aplikasi?",
    a: "Tidak. Orang tua tidak perlu login atau install apa-apa. Semua info (kehadiran, tagihan SPP, pengumuman, foto kegiatan, rapor) dikirim oleh admin/guru lewat WhatsApp dengan template otomatis.",
  },
  {
    q: "Siapa saja yang bisa login ke aplikasi?",
    a: "Hanya admin sekolah dan guru. Admin punya akses penuh untuk semua modul; guru hanya akses kelas yang ditugaskan kepadanya.",
  },
  {
    q: "Apakah Taka School bisa dipakai untuk SD?",
    a: "Bisa. Taka School cocok untuk SD swasta kecil (≤ 200 siswa). Untuk lembaga lebih besar, paket Sekolah+ tersedia dengan custom konfigurasi.",
  },
  {
    q: "Apakah pembayaran SPP otomatis dengan payment gateway?",
    a: "Belum di MVP. Saat ini sistem mencatat pembayaran manual (cash/transfer) dan kirim reminder via WA. Payment gateway (Midtrans/Xendit) ada di roadmap fase berikutnya.",
  },
  {
    q: "Bagaimana cara import data siswa lama?",
    a: "Ada fitur import via CSV. Tim onboarding kami juga bisa bantu setup awal untuk paket Pro & Sekolah+.",
  },
  {
    q: "Apakah data sekolah aman?",
    a: "Ya. Data terenkripsi, akses berbasis role, backup harian otomatis. Data anak di bawah umur tidak pernah dibagikan ke pihak ketiga.",
  },
  {
    q: "Apakah ada kontrak jangka panjang?",
    a: "Tidak. Bayar per bulan, bisa upgrade/downgrade/berhenti kapan saja.",
  },
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
            Belum terjawab? Klik tombol WhatsApp di pojok kanan bawah untuk bertanya langsung.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div
                key={f.q}
                className={`rounded-2xl bg-white ring-1 transition dark:bg-slate-900 ${
                  isOpen ? "ring-primary-300 shadow-soft dark:ring-primary-500/50" : "ring-slate-200 dark:ring-slate-800"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left p-5"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{f.q}</span>
                  <svg
                    className={`h-5 w-5 flex-none text-primary-600 transition dark:text-primary-400 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1 text-slate-600 dark:text-slate-400">
                    {f.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
