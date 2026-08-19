import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import MedicalRecords from './pages/MedicalRecords'
import Medications from './pages/Medications'
import Onboarding from './pages/Onboarding'
import PrescriptionScanner from './pages/PrescriptionScanner'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route
          path="/prescription-scanner"
          element={<PrescriptionScanner />}
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App