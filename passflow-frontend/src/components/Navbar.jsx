import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LogOut,
  User,
  Menu,
  X,
  FilePlus2,
  ListFilter,
  LayoutDashboard,
  QrCode,
  Building2,
  KeyRound,
} from 'lucide-react';

export function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="brand-icon-box">
            <Shield size={22} />
          </div>
          <span>
            Pass<span style={{ color: 'var(--primary)' }}>Flow</span>
          </span>
        </Link>

        {/* Navigation Links for Authenticated Roles */}
        {isAuthenticated ? (
          <nav className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
            {role === 'STUDENT' && (
              <>
                <NavLink
                  to="/student/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </NavLink>
                <NavLink
                  to="/student/request-outpass"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <FilePlus2 size={16} /> Request Outpass
                </NavLink>
                <NavLink
                  to="/student/outpasses"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <ListFilter size={16} /> My Outpasses
                </NavLink>
              </>
            )}

            {role === 'WARDEN' && (
              <NavLink
                to="/warden/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <Building2 size={16} /> Hostel Monitoring
              </NavLink>
            )}

            {role === 'SECURITY' && (
              <NavLink
                to="/security/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <QrCode size={16} /> Gate Scanner
              </NavLink>
            )}
          </nav>
        ) : null}

        {/* User Info / Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="nav-user">
              <div className="user-badge">
                <div className="user-avatar-mini">
                  {user?.username ? user.username.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user?.username || 'User'}
                  </div>
                  <div style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Logout"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-outline btn-sm">
                <KeyRound size={14} /> Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Student Signup
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          {isAuthenticated && (
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
