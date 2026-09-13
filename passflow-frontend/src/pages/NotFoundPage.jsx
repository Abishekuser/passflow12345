import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="main-content flex items-center justify-center" style={{ minHeight: '70vh' }}>
      <div className="card text-center animate-scale-up" style={{ maxWidth: '480px', padding: '3rem 2rem' }}>
        <div className="empty-state-icon" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending-text)' }}>
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-xl font-bold mb-2">404 - Page Not Found</h1>
        <p className="text-secondary text-sm mb-6">
          The outpass or portal page you are trying to reach does not exist.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/" className="btn btn-primary btn-sm">
            <Home size={15} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
