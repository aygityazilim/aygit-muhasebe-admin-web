import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegistrationListPage from './pages/RegistrationListPage'
import RegistrationDetailPage from './pages/RegistrationDetailPage'
import PackageListPage from './pages/PackageListPage'
import CompanyListPage from './pages/CompanyListPage'
import Layout from './components/Layout'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><RegistrationListPage /></RequireAuth>} />
        <Route path="/registrations/:trackingNumber" element={<RequireAuth><RegistrationDetailPage /></RequireAuth>} />
        <Route path="/packages" element={<RequireAuth><PackageListPage /></RequireAuth>} />
        <Route path="/companies" element={<RequireAuth><CompanyListPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
