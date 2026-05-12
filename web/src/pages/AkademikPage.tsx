import { useEffect, useMemo, useState } from "react"
import AppLayout from "../components/AppLayout"
import Pagination from "../components/Pagination"
import { usePagination } from "../hooks/usePagination"
import { Academic, type AcademicYear, type ClassSubject, type EducationLevel, type GradeLevel, type Major, type Semester, type Subject, type TeacherSubject } from "../lib/api"

type Meta = { educationLevels: EducationLevel[]; gradeLevels: GradeLevel[]; academicYears: AcademicYear[]; semesters: Semester[]; majors: Major[]; subjects: Subject[]; teacherSubjects: TeacherSubject[]; classSubjects: ClassSubject[] }
const empty: Meta = { educationLevels: [], gradeLevels: [], academicYears: [], semesters: [], majors: [], subjects: [], teacherSubjects: [], classSubjects: [] }

export default function AkademikPage() {
  const [meta, setMeta] = useState<Meta>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forms, setForms] = useState({ eduCode: "", eduName: "", eduSort: 0, gradeEdu: "", gradeCode: "", gradeName: "", gradeSort: 0, yearName: "", yearStart: "", yearEnd: "", semYear: "", semName: "", semSort: 1, majorEdu: "", majorName: "", subjectEdu: "", subjectCode: "", subjectName: "" })
  
  // Pagination hooks for each section
  const eduPagination = usePagination({ defaultPageSize: 10 })
  const gradePagination = usePagination({ defaultPageSize: 10 })
  const yearPagination = usePagination({ defaultPageSize: 10 })
  const semesterPagination = usePagination({ defaultPageSize: 10 })
  const majorPagination = usePagination({ defaultPageSize: 10 })
  const subjectPagination = usePagination({ defaultPageSize: 10 })
  const teacherSubjectPagination = usePagination({ defaultPageSize: 10 })
  const classSubjectPagination = usePagination({ defaultPageSize: 10 })
  
  // Paginated slices
  const paginatedEducationLevels = useMemo(() => {
    const start = (eduPagination.page - 1) * eduPagination.pageSize
    return meta.educationLevels.slice(start, start + eduPagination.pageSize)
  }, [meta.educationLevels, eduPagination.page, eduPagination.pageSize])
  
  const paginatedGradeLevels = useMemo(() => {
    const start = (gradePagination.page - 1) * gradePagination.pageSize
    return meta.gradeLevels.slice(start, start + gradePagination.pageSize)
  }, [meta.gradeLevels, gradePagination.page, gradePagination.pageSize])
  
  const paginatedAcademicYears = useMemo(() => {
    const start = (yearPagination.page - 1) * yearPagination.pageSize
    return meta.academicYears.slice(start, start + yearPagination.pageSize)
  }, [meta.academicYears, yearPagination.page, yearPagination.pageSize])
  
  const paginatedSemesters = useMemo(() => {
    const start = (semesterPagination.page - 1) * semesterPagination.pageSize
    return meta.semesters.slice(start, start + semesterPagination.pageSize)
  }, [meta.semesters, semesterPagination.page, semesterPagination.pageSize])
  
  const paginatedMajors = useMemo(() => {
    const start = (majorPagination.page - 1) * majorPagination.pageSize
    return meta.majors.slice(start, start + majorPagination.pageSize)
  }, [meta.majors, majorPagination.page, majorPagination.pageSize])
  
  const paginatedSubjects = useMemo(() => {
    const start = (subjectPagination.page - 1) * subjectPagination.pageSize
    return meta.subjects.slice(start, start + subjectPagination.pageSize)
  }, [meta.subjects, subjectPagination.page, subjectPagination.pageSize])
  
  const paginatedTeacherSubjects = useMemo(() => {
    const start = (teacherSubjectPagination.page - 1) * teacherSubjectPagination.pageSize
    return meta.teacherSubjects.slice(start, start + teacherSubjectPagination.pageSize)
  }, [meta.teacherSubjects, teacherSubjectPagination.page, teacherSubjectPagination.pageSize])
  
  const paginatedClassSubjects = useMemo(() => {
    const start = (classSubjectPagination.page - 1) * classSubjectPagination.pageSize
    return meta.classSubjects.slice(start, start + classSubjectPagination.pageSize)
  }, [meta.classSubjects, classSubjectPagination.page, classSubjectPagination.pageSize])
  
  async function load() { setLoading(true); try { setMeta(await Academic.metadata()); setError(null) } catch(e) { setError(e instanceof Error ? e.message : "Gagal memuat") } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  async function act(fn: () => Promise<unknown>) { try { setError(null); await fn(); await load() } catch(e) { setError(e instanceof Error ? e.message : "Gagal menyimpan") } }
  const input = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
  return <AppLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pengaturan Akademik</h1><p className="text-sm text-slate-500 dark:text-slate-400">Kelola jenjang, tingkat kelas, tahun ajaran, semester, dan jurusan.</p></div>{error&&<div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">{error}</div>}{loading?<div className="text-slate-500">Memuat…</div>:<>
    <section className="grid gap-4 lg:grid-cols-2"><Card title="Jenjang Pendidikan"><form className="grid grid-cols-4 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createEducationLevel({code:forms.eduCode,name:forms.eduName,sortOrder:forms.eduSort}))}}><input className={input} placeholder="Kode" value={forms.eduCode} onChange={e=>setForms({...forms,eduCode:e.target.value})}/><input className={`${input} col-span-2`} placeholder="Nama" value={forms.eduName} onChange={e=>setForms({...forms,eduName:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedEducationLevels.map(x=><Row key={x.id} title={`${x.code} · ${x.name}`} meta={`Urut ${x.sort_order} · ${x.is_active?"Aktif":"Nonaktif"}`} onDelete={()=>act(()=>Academic.deleteEducationLevel(x.id))}/>)}</List>{meta.educationLevels.length > 0 && <Pagination page={eduPagination.page} pageSize={eduPagination.pageSize} total={meta.educationLevels.length} loading={loading} onPageChange={eduPagination.setPage} onPageSizeChange={eduPagination.setPageSize} />}</Card>
    <Card title="Tingkat Kelas"><form className="grid grid-cols-5 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createGradeLevel({educationLevelId:Number(forms.gradeEdu),code:forms.gradeCode,name:forms.gradeName,sortOrder:forms.gradeSort}))}}><select className={input} value={forms.gradeEdu} onChange={e=>setForms({...forms,gradeEdu:e.target.value})}><option value="">Jenjang</option>{meta.educationLevels.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input className={input} placeholder="Kode" value={forms.gradeCode} onChange={e=>setForms({...forms,gradeCode:e.target.value})}/><input className={`${input} col-span-2`} placeholder="Nama" value={forms.gradeName} onChange={e=>setForms({...forms,gradeName:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedGradeLevels.map(x=><Row key={x.id} title={`${x.education_level_name||""} · ${x.name}`} meta={x.code} onDelete={()=>act(()=>Academic.deleteGradeLevel(x.id))}/>)}</List>{meta.gradeLevels.length > 0 && <Pagination page={gradePagination.page} pageSize={gradePagination.pageSize} total={meta.gradeLevels.length} loading={loading} onPageChange={gradePagination.setPage} onPageSizeChange={gradePagination.setPageSize} />}</Card></section>
    <section className="grid gap-4 lg:grid-cols-2"><Card title="Tahun Ajaran"><form className="grid grid-cols-4 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createAcademicYear({name:forms.yearName,startDate:forms.yearStart||null,endDate:forms.yearEnd||null,isActive:true}))}}><input className={input} placeholder="2025/2026" value={forms.yearName} onChange={e=>setForms({...forms,yearName:e.target.value})}/><input className={input} type="date" value={forms.yearStart} onChange={e=>setForms({...forms,yearStart:e.target.value})}/><input className={input} type="date" value={forms.yearEnd} onChange={e=>setForms({...forms,yearEnd:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedAcademicYears.map(x=><Row key={x.id} title={x.name} meta={x.is_active?"Aktif":"Nonaktif"} action={!x.is_active?<button onClick={()=>act(()=>Academic.activateAcademicYear(x.id))} className="text-xs font-semibold text-primary-700">Aktifkan</button>:null} onDelete={()=>act(()=>Academic.deleteAcademicYear(x.id))}/>)}</List>{meta.academicYears.length > 0 && <Pagination page={yearPagination.page} pageSize={yearPagination.pageSize} total={meta.academicYears.length} loading={loading} onPageChange={yearPagination.setPage} onPageSizeChange={yearPagination.setPageSize} />}</Card>
    <Card title="Semester"><form className="grid grid-cols-4 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createSemester({academicYearId:Number(forms.semYear),name:forms.semName,sortOrder:forms.semSort,isActive:false}))}}><select className={input} value={forms.semYear} onChange={e=>setForms({...forms,semYear:e.target.value})}><option value="">Tahun</option>{meta.academicYears.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input className={`${input} col-span-2`} placeholder="Ganjil/Genap" value={forms.semName} onChange={e=>setForms({...forms,semName:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedSemesters.map(x=><Row key={x.id} title={`${x.academic_year_name||""} · ${x.name}`} meta={x.is_active?"Aktif":"Nonaktif"} action={!x.is_active?<button onClick={()=>act(()=>Academic.activateSemester(x.id))} className="text-xs font-semibold text-primary-700">Aktifkan</button>:null} onDelete={()=>act(()=>Academic.deleteSemester(x.id))}/>)}</List>{meta.semesters.length > 0 && <Pagination page={semesterPagination.page} pageSize={semesterPagination.pageSize} total={meta.semesters.length} loading={loading} onPageChange={semesterPagination.setPage} onPageSizeChange={semesterPagination.setPageSize} />}</Card></section>
    <Card title="Jurusan / Peminatan"><form className="grid grid-cols-4 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createMajor({educationLevelId:Number(forms.majorEdu),name:forms.majorName}))}}><select className={input} value={forms.majorEdu} onChange={e=>setForms({...forms,majorEdu:e.target.value})}><option value="">Jenjang</option>{meta.educationLevels.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input className={`${input} col-span-2`} placeholder="Nama jurusan" value={forms.majorName} onChange={e=>setForms({...forms,majorName:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedMajors.map(x=><Row key={x.id} title={x.name} meta={`${x.education_level_name||""} · ${x.is_active?"Aktif":"Nonaktif"}`} onDelete={()=>act(()=>Academic.deleteMajor(x.id))}/>)}</List>{meta.majors.length > 0 && <Pagination page={majorPagination.page} pageSize={majorPagination.pageSize} total={meta.majors.length} loading={loading} onPageChange={majorPagination.setPage} onPageSizeChange={majorPagination.setPageSize} />}</Card>
    <Card title="Mata Pelajaran / Mapel"><form className="grid grid-cols-5 gap-2" onSubmit={e=>{e.preventDefault(); act(()=>Academic.createSubject({educationLevelId:forms.subjectEdu?Number(forms.subjectEdu):null,code:forms.subjectCode||null,name:forms.subjectName}))}}><select className={input} value={forms.subjectEdu} onChange={e=>setForms({...forms,subjectEdu:e.target.value})}><option value="">Semua jenjang</option>{meta.educationLevels.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input className={input} placeholder="Kode" value={forms.subjectCode} onChange={e=>setForms({...forms,subjectCode:e.target.value})}/><input className={`${input} col-span-2`} placeholder="Nama mapel" value={forms.subjectName} onChange={e=>setForms({...forms,subjectName:e.target.value})}/><button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white">Tambah</button></form><List>{paginatedSubjects.map(x=><Row key={x.id} title={`${x.code?x.code+" · ":""}${x.name}`} meta={`${x.education_level_name||"Semua jenjang"} · ${x.is_active?"Aktif":"Nonaktif"}`} onDelete={()=>act(()=>Academic.deleteSubject(x.id))}/>)}</List>{meta.subjects.length > 0 && <Pagination page={subjectPagination.page} pageSize={subjectPagination.pageSize} total={meta.subjects.length} loading={loading} onPageChange={subjectPagination.setPage} onPageSizeChange={subjectPagination.setPageSize} />}</Card>
    <section className="grid gap-4 lg:grid-cols-2"><Card title="Ringkasan Penugasan Guru"><List>{meta.teacherSubjects.length?paginatedTeacherSubjects.map(x=><Row key={x.id} title={`${x.teacher_name} → ${x.subject_name}`} meta={x.class_name||"Lintas kelas"} onDelete={()=>act(()=>Academic.deleteTeacherSubject(x.id))}/>):<div className="text-sm text-slate-500 py-2">Belum ada penugasan guru-mapel.</div>}</List>{meta.teacherSubjects.length > 0 && <Pagination page={teacherSubjectPagination.page} pageSize={teacherSubjectPagination.pageSize} total={meta.teacherSubjects.length} loading={loading} onPageChange={teacherSubjectPagination.setPage} onPageSizeChange={teacherSubjectPagination.setPageSize} />}</Card><Card title="Ringkasan Mapel per Kelas"><List>{meta.classSubjects.length?paginatedClassSubjects.map(x=><Row key={x.id} title={`${x.class_name} → ${x.subject_name}`} meta={x.teacher_name||"Guru belum ditentukan"} onDelete={()=>act(()=>Academic.deleteClassSubject(x.id))}/>):<div className="text-sm text-slate-500 py-2">Belum ada mapel kelas.</div>}</List>{meta.classSubjects.length > 0 && <Pagination page={classSubjectPagination.page} pageSize={classSubjectPagination.pageSize} total={meta.classSubjects.length} loading={loading} onPageChange={classSubjectPagination.setPage} onPageSizeChange={classSubjectPagination.setPageSize} />}</Card></section>
  </>}</div></AppLayout>
}
function Card({title,children}:{title:string;children:React.ReactNode}){return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">{title}</h2>{children}</div>}
function List({children}:{children:React.ReactNode}){return <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{children}</div>}
function Row({title,meta,action,onDelete}:{title:string;meta:string;action?:React.ReactNode;onDelete:()=>void}){return <div className="flex items-center justify-between gap-3 py-2"><div><div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div><div className="text-xs text-slate-500">{meta}</div></div><div className="flex items-center gap-2">{action}<button onClick={onDelete} className="text-xs font-semibold text-rose-600">Hapus</button></div></div>}
