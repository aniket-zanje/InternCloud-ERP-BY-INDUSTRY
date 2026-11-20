import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { PrintProvider } from './context/PrintContext'
import { IconSprite } from './components/Icon'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layout/DashboardLayout'

import Login from './pages/Login'
import SignedOut from './pages/SignedOut'
import Verify from './pages/Verify'
import Overview from './pages/Overview'
import VirtualId from './pages/VirtualId'
import Tasks from './pages/Tasks'
import Attendance from './pages/Attendance'
import AiScore from './pages/AiScore'
import Certificate from './pages/Certificate'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PrintProvider>
            <IconSprite />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signed-out" element={<SignedOut />} />
              <Route path="/verify/:number" element={<Verify />} />

              <Route
                path="/intern"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="virtual-id" element={<VirtualId />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="score" element={<AiScore />} />
                <Route path="certificate" element={<Certificate />} />
              </Route>

              <Route path="*" element={<Navigate to="/intern" replace />} />
            </Routes>
          </PrintProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
