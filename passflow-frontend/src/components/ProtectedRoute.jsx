import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authorization..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="main-content flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div className="empty-state-icon" style={{ background: 'var(--status-late-bg)', color: 'var(--status-late-text)' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-secondary text-sm mb-6">
            Your account ({role}) does not have permission to access this portal.
          </p>
          <div className="flex gap-2 justify-center">
            {role === 'STUDENT' && (
              <a href="/student/dashboard" className="btn btn-primary btn-sm">Go to Student Portal</a>
            )}
            {role === 'WARDEN' && (
              <a href="/warden/dashboard" className="btn btn-primary btn-sm">Go to Warden Portal</a>
            )}
            {role === 'SECURITY' && (
              <a href="/security/dashboard" className="btn btn-primary btn-sm">Go to Gate Security</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
}
