type LogoProps = {
  className?: string
  variant?: "default" | "white"
}

export default function Logo({ className = "", variant = "default" }: LogoProps) {
  const isWhite = variant === "white"
  const baseColor = isWhite ? "text-white" : "text-slate-900"
  const accentColor = isWhite ? "text-accent-400" : "text-primary-600"
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo.png" alt="Taka School" className="h-9 w-9 rounded-xl object-contain" />
      <span className={`text-lg font-bold ${baseColor}`}>
        Taka<span className={accentColor}>School</span>
      </span>
    </div>
  )
}
