import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import { apiFetch } from "../lib/api"

type Sub = { school: { name: string; slug: string; plan_code: string; subscription_status: string; custom_domain: string | null; tenant_uid: string | null }; plan: { name: string; features: string[] } }

export default function AiSaasPage() {
  const [report, setReport] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const [analytics, setAnalytics] = useState("")
  const [sub, setSub] = useState<Sub | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ planCode: "starter", subscriptionStatus: "trial", customDomain: "", tenantUid: "" })

  useEffect(() => { loadSub() }, [])
  async function loadSub() {
    const data = await apiFetch<Sub>("/api/saas/subscription")
    setSub(data)
    setForm({ planCode: data.school.plan_code, subscriptionStatus: data.school.subscription_status, customDomain: data.school.custom_domain || "", tenantUid: data.school.tenant_uid || "" })
  }
  async function genReport() {
    const r = await apiFetch<{ text: string }>("/api/ai/report-comment", { method: "POST", body: JSON.stringify({ studentName: "Ananda", strengths: "aktif, mandiri, dan antusias mengikuti kegiatan", improvements: "dapat meningkatkan konsistensi fokus saat kegiatan kelompok", nextSteps: "latihan singkat membaca cerita dan refleksi harian", tone: "hangat" }) })
    setReport(r.text)
  }
  async function genAnnouncement() {
    const r = await apiFetch<{ body: string }>("/api/ai/announcement-draft", { method: "POST", body: JSON.stringify({ title: "Pengumuman Kegiatan Sekolah", audience: "Bapak/Ibu orang tua/wali", date: "Jumat mendatang", details: "sekolah akan mengadakan kegiatan tematik bersama siswa", action: "Mohon siswa membawa bekal dan perlengkapan sesuai arahan wali kelas" }) })
    setAnnouncement(r.body)
  }
  async function genAnalytics() {
    const r = await apiFetch<{ prompt: string }>("/api/ai/analytics-prompt", { method: "POST", body: JSON.stringify({ focus: "kehadiran, pembayaran SPP, dan tindak lanjut kelas" }) })
    setAnalytics(r.prompt)
  }
  async function saveSaas() {
    setSaving(true)
    try { await apiFetch("/api/saas/subscription", { method: "PUT", body: JSON.stringify(form) }); await loadSub() } finally { setSaving(false) }
  }

  return <AppLayout>
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI & SaaS Foundation</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Template AI lokal yang aman dan fondasi subscription/custom domain untuk kesiapan multi-sekolah.</p>
      </div>
      <section className="grid lg:grid-cols-3 gap-4">
        <Tool title="Komentar Rapor" onClick={genReport} text={report} />
        <Tool title="Draft Pengumuman" onClick={genAnnouncement} text={announcement} />
        <Tool title="Prompt Analitik" onClick={genAnalytics} text={analytics} />
      </section>
      <section className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 p-5 space-y-4">
        <div><h2 className="font-bold text-slate-900 dark:text-slate-100">SaaS Readiness</h2><p className="text-sm text-slate-500 dark:text-slate-400">Sekolah: {sub?.school.name || "-"} · Plan aktif: {sub?.plan.name || "-"}</p></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-sm text-slate-600 dark:text-slate-300">Plan<select className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-950 dark:border-slate-700" value={form.planCode} onChange={e=>setForm({...form, planCode:e.target.value})}><option value="starter">Starter</option><option value="growth">Growth</option><option value="network">Network</option></select></label>
          <label className="text-sm text-slate-600 dark:text-slate-300">Status<select className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-950 dark:border-slate-700" value={form.subscriptionStatus} onChange={e=>setForm({...form, subscriptionStatus:e.target.value})}><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past due</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select></label>
          <label className="text-sm text-slate-600 dark:text-slate-300">Custom domain<input className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-950 dark:border-slate-700" value={form.customDomain} onChange={e=>setForm({...form, customDomain:e.target.value})} placeholder="sekolah.example.com" /></label>
          <label className="text-sm text-slate-600 dark:text-slate-300">Tenant UID<input className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-950 dark:border-slate-700" value={form.tenantUid} onChange={e=>setForm({...form, tenantUid:e.target.value})} placeholder="school-1" /></label>
        </div>
        <button onClick={saveSaas} disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan fondasi SaaS"}</button>
        <p className="text-xs text-slate-500 dark:text-slate-400">Catatan: belum terhubung payment gateway; field ini disiapkan untuk billing, domain mapping, dan tenant isolation berikutnya.</p>
      </section>
    </div>
  </AppLayout>
}

function Tool({ title, onClick, text }: { title: string; onClick: () => void; text: string }) {
  return <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 p-5 space-y-3">
    <h2 className="font-bold text-slate-900 dark:text-slate-100">{title}</h2>
    <button onClick={onClick} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold">Buat template</button>
    <textarea readOnly value={text} placeholder="Hasil template akan muncul di sini" className="w-full min-h-44 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm" />
  </div>
}
