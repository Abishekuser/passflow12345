import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { RequestOutpass } from './pages/student/RequestOutpass';
import { MyOutpasses } from './pages/student/MyOutpasses';
import { ParentApprovalPage } from './pages/parent/ParentApprovalPage';
import { SecurityDashboard } from './pages/security/SecurityDashboard';
import { WardenDashboard } from './pages/warden/WardenDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

function HomeRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }
  if (role === 'WARDEN') {
    return <Navigate to="/warden/dashboard" replace />;
  }
  if (role === 'SECURITY') {
    return <Navigate to="/security/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <Routes>
              {/* Home Router */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Student Portal */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/request-outpass"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <RequestOutpass />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/outpasses"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <MyOutpasses />
                  </ProtectedRoute>
                }
              />

              {/* Parent Approval Portal */}
              <Route path="/parent" element={<ParentApprovalPage />} />
              <Route path="/parent/approve" element={<ParentApprovalPage />} />
              <Route path="/parent/approve/:token" element={<ParentApprovalPage />} />
              <Route path="/parent/reject/:token" element={<ParentApprovalPage />} />
              <Route path="/parent/:token" element={<ParentApprovalPage />} />

              {/* Security Gate Portal */}
              <Route
                path="/security/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SECURITY']}>
                    <SecurityDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Warden Monitoring Portal */}
              <Route
                path="/warden/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['WARDEN']}>
                    <WardenDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
