const items = [
  { bad: "Data siswa, guru, kelas tercecer di Excel", good: "Semua data inti sekolah tersimpan di satu dashboard" },
  { bad: "PPDB manual dan alamat sering tidak akurat", good: "PPDB online dengan pencarian alamat + titik OpenStreetMap" },
  { bad: "Absensi, rapor, dan jadwal direkap terpisah", good: "Operasional harian terhubung ke analytics sekolah" },
  { bad: "SPP ditagih satu-satu tanpa rekap piutang", good: "Tagihan, terbayar, piutang, overdue, dan reminder WA terpantau" },
  { bad: "Pengumuman, galeri, dan dokumen tersebar di grup", good: "Portal sekolah rapi untuk info, jadwal, galeri, dan cetak dokumen" },
  { bad: "Aplikasi hanya cocok untuk satu jenjang", good: "Fleksibel untuk PAUD, TK, SD, SMP, SMA, dan yayasan multi-jenjang" },
]

export default function Problem() {
  return (
    <section className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-3xl mx-auto">
          <span className="eyebrow">Kenapa Taka School</span>
          <h2 className="section-title">Bukan cuma absensi — ini pusat operasional sekolah</h2>
          <p className="section-sub mx-auto">
            Sekolah butuh satu tempat untuk PPDB, akademik, keuangan, komunikasi, dan laporan. Taka School menyatukannya tanpa alur yang ribet.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div key={it.bad} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </span>
                <p className="text-slate-500 line-through dark:text-slate-500">{it.bad}</p>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
