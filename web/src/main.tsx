import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SiswaPage from './pages/SiswaPage'
import GuruPage from './pages/GuruPage'
import KelasPage from './pages/KelasPage'
import AbsensiPage from './pages/AbsensiPage'
import SppPage from './pages/SppPage'
import JadwalPage from './pages/JadwalPage'
import PengumumanPage from './pages/PengumumanPage'
import GaleriPage from './pages/GaleriPage'
import RaporPage from './pages/RaporPage'
import ProtectedRoute from './components/ProtectedRoute'

const protectedRoutes: { path: string; element: React.ReactNode; admin?: boolean }[] = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/siswa", element: <SiswaPage /> },
  { path: "/guru", element: <GuruPage />, admin: true },
  { path: "/kelas", element: <KelasPage /> },
  { path: "/absensi", element: <AbsensiPage /> },
  { path: "/spp", element: <SppPage /> },
  { path: "/jadwal", element: <JadwalPage /> },
  { path: "/pengumuman", element: <PengumumanPage /> },
  { path: "/galeri", element: <GaleriPage /> },
  { path: "/rapor", element: <RaporPage /> },
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {protectedRoutes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<ProtectedRoute>{r.element}</ProtectedRoute>}
          />
        ))}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
