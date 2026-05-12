import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SiswaPage from './pages/SiswaPage'
import SiswaFormPage from './pages/SiswaFormPage'
import SiswaDetailPage from './pages/SiswaDetailPage'
import GuruPage from './pages/GuruPage'
import GuruFormPage from './pages/GuruFormPage'
import KelasPage from './pages/KelasPage'
import KelasFormPage from './pages/KelasFormPage'
import KelasDetailPage from './pages/KelasDetailPage'
import AbsensiPage from './pages/AbsensiPage'
import SppPage from './pages/SppPage'
import SppFormPage from './pages/SppFormPage'
import JadwalPage from './pages/JadwalPage'
import JadwalFormPage from './pages/JadwalFormPage'
import PengumumanPage from './pages/PengumumanPage'
import PengumumanFormPage from './pages/PengumumanFormPage'
import GaleriPage from './pages/GaleriPage'
import GaleriFormPage from './pages/GaleriFormPage'
import RaporPage from './pages/RaporPage'
import RaporFormPage from './pages/RaporFormPage'
import RaporDetailPage from './pages/RaporDetailPage'
import AkademikPage from './pages/AkademikPage'
import PortalPage from './pages/PortalPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import PpdbPage from './pages/PpdbPage'
import AdmissionsPage from './pages/AdmissionsPage'
import AdmissionDetailPage from './pages/AdmissionDetailPage'
import OperasionalPage from './pages/OperasionalPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import PrintDocumentPage from './pages/PrintDocumentPage'
import ImportExportPage from './pages/ImportExportPage'
import AiSaasPage from './pages/AiSaasPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './components/ThemeProvider'
import type { AuthUser } from './lib/api'

const schoolRead: AuthUser["role"][] = ["admin", "staff", "teacher", "guru", "headmaster"]
const office: AuthUser["role"][] = ["admin", "staff"]
const admin: AuthUser["role"][] = ["admin"]

const protectedRoutes: { path: string; element: React.ReactNode; roles?: AuthUser["role"][] }[] = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/siswa", element: <SiswaPage />, roles: schoolRead },
  { path: "/siswa/:id", element: <SiswaDetailPage />, roles: schoolRead },
  { path: "/siswa/baru", element: <SiswaFormPage />, roles: office },
  { path: "/siswa/:id/edit", element: <SiswaFormPage />, roles: office },
  { path: "/guru", element: <GuruPage />, roles: schoolRead },
  { path: "/guru/baru", element: <GuruFormPage />, roles: admin },
  { path: "/guru/:id/edit", element: <GuruFormPage />, roles: admin },
  { path: "/kelas", element: <KelasPage />, roles: schoolRead },
  { path: "/kelas/:id", element: <KelasDetailPage />, roles: schoolRead },
  { path: "/kelas/baru", element: <KelasFormPage />, roles: office },
  { path: "/kelas/:id/edit", element: <KelasFormPage />, roles: office },
  { path: "/absensi", element: <AbsensiPage />, roles: ["admin", "staff", "teacher", "guru"] },
  { path: "/spp", element: <SppPage />, roles: schoolRead },
  { path: "/spp/:id", element: <InvoiceDetailPage />, roles: schoolRead },
  { path: "/spp/:id/print", element: <PrintDocumentPage kind="invoice" />, roles: schoolRead },
  { path: "/spp/:id/receipt", element: <PrintDocumentPage kind="receipt" />, roles: schoolRead },
  { path: "/spp/baru", element: <SppFormPage />, roles: office },
  { path: "/spp/generate", element: <SppFormPage />, roles: office },
  { path: "/spp/:id/bayar", element: <SppFormPage />, roles: office },
  { path: "/jadwal", element: <JadwalPage />, roles: schoolRead },
  { path: "/jadwal/baru", element: <JadwalFormPage />, roles: office },
  { path: "/jadwal/:id/edit", element: <JadwalFormPage />, roles: office },
  { path: "/pengumuman", element: <PengumumanPage /> },
  { path: "/pengumuman/baru", element: <PengumumanFormPage /> },
  { path: "/pengumuman/:id/edit", element: <PengumumanFormPage /> },
  { path: "/galeri", element: <GaleriPage /> },
  { path: "/galeri/baru", element: <GaleriFormPage /> },
  { path: "/galeri/:id/edit", element: <GaleriFormPage /> },
  { path: "/rapor", element: <RaporPage /> },
  { path: "/rapor/:id", element: <RaporDetailPage /> },
  { path: "/rapor/:id/print", element: <PrintDocumentPage kind="report" /> },
  { path: "/assessments/report-cards/:id/print", element: <PrintDocumentPage kind="report-card" />, roles: schoolRead },
  { path: "/operasional/letters/:id/print", element: <PrintDocumentPage kind="letter" />, roles: schoolRead },
  { path: "/rapor/baru", element: <RaporFormPage /> },
  { path: "/rapor/:id/edit", element: <RaporFormPage /> },
  { path: "/akademik", element: <AkademikPage />, roles: admin },
  { path: "/operasional", element: <OperasionalPage />, roles: ["admin", "staff", "teacher", "headmaster"] },
  { path: "/admissions", element: <AdmissionsPage />, roles: office },
  { path: "/admissions/:id", element: <AdmissionDetailPage />, roles: office },
  { path: "/ppdb/admin", element: <AdmissionsPage />, roles: office },
  { path: "/import-export", element: <ImportExportPage />, roles: office },
  { path: "/ai-saas", element: <AiSaasPage />, roles: ["admin", "staff", "headmaster"] },
  { path: "/portal", element: <PortalPage />, roles: ["teacher", "guru", "parent", "student"] },
  { path: "/portal/teacher", element: <PortalPage kind="teacher" />, roles: ["teacher", "guru"] },
  { path: "/portal/parent", element: <PortalPage kind="parent" />, roles: ["parent"] },
  { path: "/portal/student", element: <PortalPage kind="student" />, roles: ["student"] },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ppdb" element={<PpdbPage />} />
          {protectedRoutes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<ProtectedRoute roles={r.roles}>{r.element}</ProtectedRoute>}
            />
          ))}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
