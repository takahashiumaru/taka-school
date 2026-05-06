import Logo from "./Logo"

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto container-px py-14">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo variant="white" />
            <p className="mt-4 text-sm text-slate-400 max-w-sm">
              Aplikasi manajemen sekolah ringan untuk PAUD, TK, dan sekolah kecil.
              Sederhana untuk guru, otomatis untuk orang tua.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Produk</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#fitur" className="hover:text-white">Fitur</a></li>
              <li><a href="#harga" className="hover:text-white">Harga</a></li>
              <li><a href="#cara" className="hover:text-white">Cara Kerja</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Kontak</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="https://wa.me/628000000000" className="hover:text-white inline-flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4z"/>
                  </svg>
                  WhatsApp Admin
                </a>
              </li>
              <li><a href="mailto:halo@takaschool.id" className="hover:text-white">halo@takaschool.id</a></li>
              <li className="text-slate-400">Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} Taka School. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-slate-300">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-300">Syarat Layanan</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
