import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Assessments, Finance, Operations, Reports, getUser, type Report } from "../lib/api"

const money = (n: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n || 0))
const date = (v: any) => v ? String(v).slice(0, 10) : "—"

type Kind = "invoice" | "receipt" | "report" | "letter" | "report-card"

export default function PrintDocumentPage({ kind }: { kind: Kind }) {
  const { id } = useParams()
  const user = getUser()
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const docId = Number(id)
        let result: any
        if (kind === "invoice" || kind === "receipt") result = await Finance.getInvoice(docId)
        else if (kind === "report") result = await Reports.get(docId)
        else if (kind === "report-card") result = await Assessments.previewCard(docId)
        else {
          const list = await Operations.letters()
          result = list.items.find((x: any) => Number(x.id) === docId)
          if (!result) throw new Error("Surat tidak ditemukan")
        }
        if (!off) setData(result)
      } catch (e) { if (!off) setErr(e instanceof Error ? e.message : "Gagal memuat dokumen") }
    })()
    return () => { off = true }
  }, [id, kind])

  const title = useMemo(() => ({ invoice: "Invoice", receipt: "Kwitansi Pembayaran", report: "Rapor", letter: "Surat Sekolah", "report-card": "Rapor Akademik" }[kind]), [kind])

  return <div className="min-h-screen bg-slate-100 p-4 text-slate-900 print:bg-white print:p-0">
    <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 print:hidden">
      <Link to={kind === "invoice" || kind === "receipt" ? `/spp/${id}` : kind === "report" ? `/rapor/${id}` : "/operasional"} className="text-sm font-semibold text-primary-700">← Kembali</Link>
      <button className="btn-primary" onClick={() => window.print()}>Cetak / Simpan PDF</button>
    </div>
    <main className="mx-auto max-w-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 print:max-w-none print:shadow-none print:ring-0">
      <header className="border-b-2 border-slate-900 pb-4 text-center">
        <div className="text-2xl font-black uppercase">{user?.schoolName || "Taka School"}</div>
        <div className="mt-1 text-sm text-slate-600">Dokumen resmi sekolah</div>
      </header>
      {err && <div className="mt-6 rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">{err}</div>}
      {!data && !err && <div className="mt-8 text-center text-slate-500">Memuat dokumen...</div>}
      {data && <section className="mt-8">{kind === "invoice" && <InvoiceDoc data={data} title={title} />}{kind === "receipt" && <ReceiptDoc data={data} title={title} />}{kind === "report" && <ReportDoc report={data} />}{kind === "report-card" && <ReportCardDoc data={data} />}{kind === "letter" && <LetterDoc letter={data} />}</section>}
      <footer className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
        <div />
        <div><div>{date(new Date().toISOString())}</div><div className="mt-16 border-t border-slate-400 pt-2">Petugas / Kepala Sekolah</div></div>
      </footer>
    </main>
  </div>
}

function Row({ l, v }: { l: string; v: any }) { return <div className="flex border-b py-2"><div className="w-40 text-slate-500">{l}</div><div className="font-medium">{v || "—"}</div></div> }
function InvoiceDoc({ data, title }: any) { const inv = data.invoice; return <><h1 className="text-center text-xl font-black uppercase">{title}</h1><div className="mt-6 grid grid-cols-2 gap-6"><div><Row l="Nomor" v={inv.invoice_no}/><Row l="Siswa" v={inv.student_name}/><Row l="Kelas" v={inv.class_name}/></div><div><Row l="Periode" v={inv.period}/><Row l="Tanggal" v={date(inv.issue_date)}/><Row l="Jatuh Tempo" v={date(inv.due_date)}/></div></div><Items items={data.items}/><Totals inv={inv}/></> }
function ReceiptDoc({ data, title }: any) { const inv = data.invoice; return <><h1 className="text-center text-xl font-black uppercase">{title}</h1><div className="mt-6"><Row l="Nomor Invoice" v={inv.invoice_no}/><Row l="Siswa" v={`${inv.student_name} (${inv.class_name || "—"})`}/><Row l="Total Tagihan" v={money(inv.total_amount)}/><Row l="Terbayar" v={money(inv.paid_amount)}/><Row l="Sisa" v={money(Number(inv.total_amount) - Number(inv.paid_amount))}/></div><h2 className="mt-6 font-bold">Riwayat Pembayaran</h2><Items items={data.payments.map((p:any)=>({ description: `${date(p.paid_at)} · ${p.payment_method_name || "Pembayaran"}${p.reference_no ? ` · ${p.reference_no}` : ""}`, quantity: 1, unit_amount: p.amount, line_total: p.amount }))}/></> }
function Items({ items }: any) { return <table className="mt-6 w-full border-collapse text-sm"><thead><tr className="bg-slate-100"><th className="border p-2 text-left">Deskripsi</th><th className="border p-2">Qty</th><th className="border p-2 text-right">Harga</th><th className="border p-2 text-right">Jumlah</th></tr></thead><tbody>{items.map((it:any,i:number)=><tr key={i}><td className="border p-2">{it.description || it.note}</td><td className="border p-2 text-center">{it.quantity || 1}</td><td className="border p-2 text-right">{money(it.unit_amount || it.amount)}</td><td className="border p-2 text-right">{money(it.line_total || it.amount)}</td></tr>)}</tbody></table> }
function Totals({ inv }: any) { return <div className="ml-auto mt-4 w-72 text-sm"><Row l="Subtotal" v={money(inv.subtotal)}/><Row l="Diskon" v={money(inv.discount_amount)}/><Row l="Denda" v={money(inv.late_fee_amount)}/><Row l="Total" v={money(inv.total_amount)}/><Row l="Terbayar" v={money(inv.paid_amount)}/></div> }
function ReportDoc({ report }: { report: Report }) { return <><h1 className="text-center text-xl font-black uppercase">Rapor Siswa</h1><div className="mt-6 grid grid-cols-3 gap-3"><Row l="Siswa" v={report.student_name}/><Row l="Kelas" v={report.class_name}/><Row l="Semester" v={report.semester}/></div><article className="mt-6 whitespace-pre-wrap leading-7">{report.body}</article></> }
function ReportCardDoc({ data }: any) { const c=data.card; return <><h1 className="text-center text-xl font-black uppercase">Rapor Akademik</h1><Row l="Siswa" v={c.student_name}/><Row l="Kelas" v={c.class_name}/><Row l="Semester" v={c.semester_label}/><h2 className="mt-6 font-bold">Nilai</h2><Items items={data.grades.map((g:any)=>({description:`${g.subject_name || "Asesmen"} - ${g.assessment_type_name || "Nilai"}`,quantity:1,unit_amount:g.score,line_total:g.score}))}/><h2 className="mt-6 font-bold">Catatan</h2><p className="mt-2 whitespace-pre-wrap">{c.summary || "—"}</p>{data.observations?.length>0&&<ul className="mt-4 list-disc pl-6">{data.observations.map((o:any)=><li key={o.id}>{o.aspect_name}: {o.observation} {o.level ? `(${o.level})` : ""}</li>)}</ul>}</> }
function LetterDoc({ letter }: any) { return <><h1 className="text-center text-xl font-black uppercase">{letter.subject}</h1><div className="mt-6"><Row l="Nomor" v={letter.letter_no}/><Row l="Jenis" v={letter.type}/><Row l="Penerima" v={letter.recipient}/><Row l="Status" v={letter.status}/></div><p className="mt-8 leading-7">Dengan hormat,</p><p className="mt-4 leading-7">Melalui surat ini kami menyampaikan perihal <b>{letter.subject}</b>{letter.recipient ? ` kepada ${letter.recipient}` : ""}. Dokumen ini dapat dilengkapi sesuai kebutuhan administrasi sekolah.</p><p className="mt-4 leading-7">Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.</p></> }
