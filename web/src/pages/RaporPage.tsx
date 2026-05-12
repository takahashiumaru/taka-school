import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Select from "../components/Select"
import { Academic, Assessments, Reports, Students, getUser, waLink, type AssessmentType, type GradeEntry, type PaudAspect, type PaudIndicator, type PaudObservation, type Report, type ReportCard, type Student, type Subject } from "../lib/api"

type Tab = "catatan" | "nilai" | "paud" | "kartu"
function defaultSemester(){const d=new Date();const y=d.getFullYear();const m=d.getMonth()+1;return `${m>=7?`${y}/${y+1}`:`${y-1}/${y}`} ${m>=7?"Ganjil":"Genap"}`}

export default function RaporPage() {
  const user = getUser()
  const [tab,setTab]=useState<Tab>("catatan")
  const [items, setItems] = useState<Report[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades,setGrades]=useState<GradeEntry[]>([])
  const [observations,setObservations]=useState<PaudObservation[]>([])
  const [cards,setCards]=useState<ReportCard[]>([])
  const [types,setTypes]=useState<AssessmentType[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [aspects,setAspects]=useState<PaudAspect[]>([])
  const [indicators,setIndicators]=useState<PaudIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStudent, setFilterStudent] = useState<number | "">("")
  const [semester,setSemester]=useState(defaultSemester())
  const [gradeForm,setGradeForm]=useState({studentId:"",subjectId:"",typeId:"",score:"",note:""})
  const [obsForm,setObsForm]=useState({studentId:"",aspectId:"",indicatorId:"",level:"",observation:""})
  const [typeName,setTypeName]=useState("")
  const [aspectName,setAspectName]=useState("")

  async function refresh() {
    setLoading(true); setError(null)
    try {
      const [r, s, g, o, c, m, a] = await Promise.all([
        Reports.list(filterStudent || undefined), Students.list({ status: "aktif" }), Assessments.listGrades(filterStudent || undefined), Assessments.listObservations(filterStudent || undefined), Assessments.listCards(), Assessments.metadata(), Academic.metadata(),
      ])
      setItems(r.items); setStudents(s.items); setGrades(g.items); setObservations(o.items); setCards(c.items); setTypes(m.assessmentTypes); setAspects(m.paudAspects); setIndicators(m.paudIndicators); setSubjects(a.subjects)
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal") } finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [filterStudent])

  const studentMap = useMemo(() => new Map(students.map(s=>[s.id,s])), [students])
  if (!user) return null
  const studentOptions = students.map(s=>({value:String(s.id),label:s.name,hint:s.class_name||undefined}))

  async function addGrade(e:React.FormEvent){e.preventDefault(); await Assessments.createGrade({studentId:Number(gradeForm.studentId),subjectId:gradeForm.subjectId?Number(gradeForm.subjectId):null,assessmentTypeId:gradeForm.typeId?Number(gradeForm.typeId):null,semesterLabel:semester,score:Number(gradeForm.score),note:gradeForm.note||null,assessedAt:new Date().toISOString().slice(0,10)}); setGradeForm({...gradeForm,score:"",note:""}); refresh()}
  async function addObservation(e:React.FormEvent){e.preventDefault(); await Assessments.createObservation({studentId:Number(obsForm.studentId),aspectId:obsForm.aspectId?Number(obsForm.aspectId):null,indicatorId:obsForm.indicatorId?Number(obsForm.indicatorId):null,semesterLabel:semester,level:(obsForm.level||null) as any,observation:obsForm.observation,observedAt:new Date().toISOString().slice(0,10)}); setObsForm({...obsForm,observation:""}); refresh()}
  async function addType(e:React.FormEvent){e.preventDefault(); if(!typeName.trim())return; await Assessments.createType({name:typeName.trim(),weight:1}); setTypeName(""); refresh()}
  async function addAspect(e:React.FormEvent){e.preventDefault(); if(!aspectName.trim())return; await Assessments.createPaudAspect({name:aspectName.trim()}); setAspectName(""); refresh()}
  async function createCard(studentId:number){await Assessments.createCard({studentId,semesterLabel:semester,summary:"Rapor dibuat dari rekap nilai dan observasi."}); refresh()}

  return <AppLayout>
    <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nilai & Rapor</h1><p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Fondasi nilai numerik, observasi PAUD/TK, dan kartu rapor dasar.</p></div><Link to="/rapor/baru" className="btn-primary">+ Catatan Rapor</Link></div>
    <div className="mt-5 grid md:grid-cols-2 gap-3"><div><span className="block text-xs font-semibold mb-1">Filter Siswa</span><Select value={filterStudent===""?"":String(filterStudent)} onChange={(v)=>setFilterStudent(v?Number(v):"")} options={[{value:"",label:"Semua siswa"},...studentOptions]}/></div><label><span className="block text-xs font-semibold mb-1">Semester Aktif</span><input className="input-base" value={semester} onChange={e=>setSemester(e.target.value)}/></label></div>
    <div className="mt-5 flex gap-2 flex-wrap">{([['catatan','Catatan'],['nilai','Nilai'],['paud','PAUD/TK'],['kartu','Kartu Rapor']] as [Tab,string][]).map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={tab===k?"btn-primary":"btn-secondary"}>{l}</button>)}</div>
    {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}
    {loading ? <div className="mt-5 text-slate-500">Memuat…</div> : <>
      {tab==="catatan" && <div className="mt-5 grid lg:grid-cols-2 gap-4">{items.map(r=>{const stud=studentMap.get(r.student_id); const wa=stud?.parent_wa?waLink(stud.parent_wa,`Yth. ${stud.parent_name||"Bapak/Ibu"}, berikut catatan rapor ananda ${r.student_name} untuk ${r.semester}:\n\n${r.body}`):null; return <article key={r.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{r.student_name}</h2><div className="text-xs text-slate-500">{r.semester}{r.class_name&&` · ${r.class_name}`}</div></div><div className="flex gap-1">{wa&&<a href={wa} target="_blank" className="text-xs font-semibold text-emerald-700">WA</a>}<Link to={`/rapor/${r.id}/edit`} className="text-xs font-semibold text-primary-700">Edit</Link></div></div><p className="mt-3 text-sm whitespace-pre-wrap">{r.body}</p></article>})}{items.length===0&&<Empty text="Belum ada catatan rapor."/>}</div>}
      {tab==="nilai" && <div className="mt-5 grid lg:grid-cols-3 gap-4"><form onSubmit={addGrade} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 grid gap-3 dark:bg-slate-900 dark:ring-slate-800"><h2 className="font-bold">Input Nilai</h2><Select required value={gradeForm.studentId} onChange={v=>setGradeForm({...gradeForm,studentId:v})} placeholder="Siswa" options={studentOptions}/><Select value={gradeForm.subjectId} onChange={v=>setGradeForm({...gradeForm,subjectId:v})} placeholder="Mapel" options={subjects.map(s=>({value:String(s.id),label:s.name}))}/><Select value={gradeForm.typeId} onChange={v=>setGradeForm({...gradeForm,typeId:v})} placeholder="Jenis penilaian" options={types.map(t=>({value:String(t.id),label:t.name}))}/><input required type="number" min="0" max="100" className="input-base" placeholder="Nilai" value={gradeForm.score} onChange={e=>setGradeForm({...gradeForm,score:e.target.value})}/><input className="input-base" placeholder="Catatan" value={gradeForm.note} onChange={e=>setGradeForm({...gradeForm,note:e.target.value})}/><button className="btn-primary">Simpan Nilai</button><div className="flex gap-2"><input className="input-base" placeholder="Jenis baru" value={typeName} onChange={e=>setTypeName(e.target.value)}/><button type="button" onClick={addType as any} className="btn-secondary">Tambah</button></div></form><List title="Daftar Nilai" className="lg:col-span-2" items={grades.map(g=>`${g.student_name} · ${g.subject_name||'-'} · ${g.assessment_type_name||'-'}: ${g.score}`)}/></div>}
      {tab==="paud" && <div className="mt-5 grid lg:grid-cols-3 gap-4"><form onSubmit={addObservation} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 grid gap-3 dark:bg-slate-900 dark:ring-slate-800"><h2 className="font-bold">Observasi PAUD/TK</h2><Select required value={obsForm.studentId} onChange={v=>setObsForm({...obsForm,studentId:v})} placeholder="Siswa" options={studentOptions}/><Select value={obsForm.aspectId} onChange={v=>setObsForm({...obsForm,aspectId:v,indicatorId:""})} placeholder="Aspek" options={aspects.map(a=>({value:String(a.id),label:a.name}))}/><Select value={obsForm.indicatorId} onChange={v=>setObsForm({...obsForm,indicatorId:v})} placeholder="Indikator" options={indicators.filter(i=>!obsForm.aspectId||i.aspect_id===Number(obsForm.aspectId)).map(i=>({value:String(i.id),label:i.description}))}/><Select value={obsForm.level} onChange={v=>setObsForm({...obsForm,level:v})} placeholder="Capaian" options={["BB","MB","BSH","BSB"].map(x=>({value:x,label:x}))}/><textarea required className="input-base" rows={4} placeholder="Observasi" value={obsForm.observation} onChange={e=>setObsForm({...obsForm,observation:e.target.value})}/><button className="btn-primary">Simpan Observasi</button><div className="flex gap-2"><input className="input-base" placeholder="Aspek baru" value={aspectName} onChange={e=>setAspectName(e.target.value)}/><button type="button" onClick={addAspect as any} className="btn-secondary">Tambah</button></div></form><List title="Daftar Observasi" className="lg:col-span-2" items={observations.map(o=>`${o.student_name} · ${o.aspect_name||'-'} · ${o.level||'-'}: ${o.observation}`)}/></div>}
      {tab==="kartu" && <div className="mt-5 grid lg:grid-cols-2 gap-4"><div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 dark:bg-slate-900 dark:ring-slate-800"><h2 className="font-bold mb-3">Buat Kartu Rapor</h2><div className="grid gap-2">{students.map(s=><button key={s.id} onClick={()=>createCard(s.id)} className="btn-secondary text-left">+ {s.name} {s.class_name&&`· ${s.class_name}`}</button>)}</div></div><List title="Kartu Rapor" items={cards.map(c=>`${c.student_name} · ${c.semester_label} · ${c.status}`)}/></div>}
    </>}
  </AppLayout>
}
function Empty({text}:{text:string}){return <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-500 dark:bg-slate-900 dark:ring-slate-800">{text}</div>}
function List({title,items,className=""}:{title:string;items:string[];className?:string}){return <div className={`rounded-2xl bg-white ring-1 ring-slate-200 p-4 dark:bg-slate-900 dark:ring-slate-800 ${className}`}><h2 className="font-bold mb-3">{title}</h2><div className="divide-y divide-slate-100 dark:divide-slate-800">{items.length?items.map((x,i)=><div key={i} className="py-2 text-sm">{x}</div>):<div className="text-sm text-slate-500">Belum ada data.</div>}</div></div>}
