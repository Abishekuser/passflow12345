import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  Loader2,
  KeyRound,
  GraduationCap,
  Building2,
  QrCode,
  HeartHandshake,
} from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      showSuccess(`Welcome back, ${username}!`);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Redirect according to backend role
      if (user.role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else if (user.role === 'WARDEN') {
        navigate('/warden/dashboard', { replace: true });
      } else if (user.role === 'SECURITY') {
        navigate('/security/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card animate-scale-up" style={{ maxWidth: '500px' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div className="auth-logo">
            <Shield size={28} />
          </div>
          <h1 className="text-xl font-bold">PassFlow Unified Portal</h1>
          <p className="text-secondary text-sm mt-1">
            Hostel Outpass & Gate Security Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Enter username (Student / Warden / Security)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block mt-4"
            disabled={loading}
            style={{ padding: '0.85rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span className="text-secondary">Are you a new student? </span>
          <Link to="/signup" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </div>

        {/* Unified Portal Guide */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            All Portals in One Website
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div
              style={{
                background: 'var(--bg-tertiary)',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <div className="font-bold flex items-center gap-1 text-primary">
                <GraduationCap size={14} /> Student Portal
              </div>
              <div className="text-muted text-xs mt-0.5">Apply outpasses & view QR pass</div>
            </div>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <div className="font-bold flex items-center gap-1" style={{ color: '#10B981' }}>
                <Building2 size={14} /> Warden Portal
              </div>
              <div className="text-muted text-xs mt-0.5">Hostel roll-call & curfew alerts</div>
            </div>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <div className="font-bold flex items-center gap-1" style={{ color: '#3B82F6' }}>
                <QrCode size={14} /> Security Gate
              </div>
              <div className="text-muted text-xs mt-0.5">Camera scan exit/return passes</div>
            </div>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <div className="font-bold flex items-center gap-1" style={{ color: '#F59E0B' }}>
                <HeartHandshake size={14} /> Parent Approval
              </div>
              <div className="text-muted text-xs mt-0.5">Approve / Reject via secure email link</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
