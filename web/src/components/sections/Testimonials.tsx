const items = [
  {
    quote: "Akhirnya guru tidak repot rekap absensi tiap akhir bulan. Orang tua juga makin terinfo.",
    name: "Ibu Sari",
    role: "Kepala TK Tunas Bangsa",
  },
  {
    quote: "Tagihan SPP yang biasanya nunggak banyak, sekarang bisa diingatkan otomatis lewat WA.",
    name: "Bapak Irfan",
    role: "Pemilik PAUD Cendekia",
  },
  {
    quote: "Setup-nya gampang banget. Saya yang gaptek pun bisa input data 80 siswa dalam sehari.",
    name: "Ibu Rani",
    role: "Admin TK Mutiara",
  },
]

export default function Testimonials() {
  return (
    <section className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Testimoni</span>
          <h2 className="section-title">Kata mereka yang sudah pakai</h2>
          <p className="section-sub mx-auto">
            Cerita dari sekolah-sekolah kecil yang lebih rapi sejak pakai Taka School.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <figure key={t.name} className="rounded-2xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-slate-200 p-6 dark:from-primary-900/30 dark:to-slate-900 dark:ring-slate-800">
              <svg className="h-8 w-8 text-primary-300 dark:text-primary-500/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.17 6A4.17 4.17 0 003 10.17v2.66A4.17 4.17 0 007.17 17H8v-5H5.5v-1.83A1.67 1.67 0 017.17 8.5H8V6H7.17zm10 0a4.17 4.17 0 00-4.17 4.17v2.66A4.17 4.17 0 0017.17 17H18v-5h-2.5v-1.83a1.67 1.67 0 011.67-1.67H18V6h-.83z"/>
              </svg>
              <blockquote className="mt-3 text-slate-700 dark:text-slate-300">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-bold dark:bg-primary-500/20 dark:text-primary-200">
                  {t.name.split(" ").pop()?.[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
