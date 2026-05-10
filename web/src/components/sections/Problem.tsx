const items = [
  { bad: "Data siswa di buku tulis & Excel", good: "Semua tersimpan rapi di satu app" },
  { bad: "Absensi manual, sulit direkap", good: "Centang sekali, otomatis terlapor" },
  { bad: "Jadwal nempel di papan, mudah hilang", good: "Jadwal digital per kelas, selalu update" },
  { bad: "SPP ditagih satu-satu via WA", good: "Reminder otomatis dengan template" },
  { bad: "Pengumuman tersebar di banyak grup", good: "Satu pengumuman, kirim ke semua kelas" },
  { bad: "Aplikasi sekolah lain ribet & mahal", good: "Sederhana, terjangkau, langsung pakai" },
]

export default function Problem() {
  return (
    <section className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Kenapa Taka School</span>
          <h2 className="section-title">Sekolah kecil punya masalah besar</h2>
          <p className="section-sub mx-auto">
            Tapi solusinya tidak harus rumit. Ini perbandingannya:
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div key={it.bad} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <p className="text-slate-500 line-through dark:text-slate-500">{it.bad}</p>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-slate-800 font-medium dark:text-slate-200">{it.good}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
