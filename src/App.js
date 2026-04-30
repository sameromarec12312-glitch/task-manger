import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminSignup from './pages/AdminSignup'
import OrgSelector from './pages/OrgSelector'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeLogin from './pages/EmployeeLogin'
import EmployeeSubmit from './pages/EmployeeSubmit'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/orgs" element={<OrgSelector />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/org/:slug" element={<EmployeeLogin />} />
        <Route path="/org/:slug/submit" element={<EmployeeSubmit />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
