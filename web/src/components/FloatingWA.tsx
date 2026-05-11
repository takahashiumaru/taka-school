const WA_NUMBER = "628000000000"
const WA_MSG = encodeURIComponent(
  "Halo Taka School, saya tertarik dengan produknya. Bisa info lebih lanjut?"
)

export default function FloatingWA() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat WhatsApp Taka School"
      className="group fixed bottom-5 right-5 z-50"
    >
      <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-soft text-white transition sm:h-auto sm:w-auto sm:gap-2 sm:pl-3 sm:pr-4 sm:py-3">
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4zM12.05 21.4h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.75.98 1-3.65-.23-.38a9.46 9.46 0 01-1.45-5.04c0-5.23 4.26-9.49 9.49-9.49 2.53 0 4.91.99 6.7 2.78a9.43 9.43 0 012.78 6.71c0 5.23-4.26 9.49-9.49 9.49z"/>
        </svg>
        <span className="hidden sm:inline text-sm font-semibold">Chat Admin</span>
      </span>
    </a>
  )
}
