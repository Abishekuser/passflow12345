import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { QRCard } from '../../components/QRCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  FilePlus2,
  QrCode,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowRightCircle,
  History,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();
  const { showError } = useToast();

  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQRPass, setSelectedQRPass] = useState(null);

  const fetchOutpasses = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await studentApi.getMyOutpasses();
      // Sort newest first
      const sorted = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        : [];
      setOutpasses(sorted);
    } catch (err) {
      showError(err.message || 'Failed to fetch outpass records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOutpasses();
  }, [fetchOutpasses]);

  // Identify active outpass (PENDING, APPROVED, OUT)
  const activePass = outpasses.find((p) =>
    ['PENDING', 'APPROVED', 'OUT'].includes(p.status?.toUpperCase())
  );

  // Statistics calculation from real backend data
  const totalCount = outpasses.length;
  const pendingCount = outpasses.filter((p) => p.status === 'PENDING').length;
  const approvedCount = outpasses.filter((p) => p.status === 'APPROVED' || p.status === 'OUT').length;
  const returnedCount = outpasses.filter((p) => p.status === 'RETURNED').length;

  if (loading) {
    return <LoadingSpinner text="Loading your outpass dashboard..." fullPage />;
  }

  return (
    <div className="main-content">
      {/* Top Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.username || 'Student'}</h1>
          <p className="page-subtitle">
            Manage and track your digital hostel outpasses in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOutpasses(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/student/request-outpass" className="btn btn-primary btn-sm">
            <FilePlus2 size={16} /> Request Outpass
          </Link>
        </div>
      </div>

      {/* Live Active Outpass Banner / Status Card */}
      {activePass ? (
        <div className="active-pass-hero animate-fade-in">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="badge-dot animate-pulse" style={{ width: '10px', height: '10px', background: 'var(--primary)' }}></span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Active Outpass in Progress
              </span>
            </div>
            <StatusBadge status={activePass.status} />
          </div>

          <div className="grid grid-2" style={{ gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <MapPin size={20} color="var(--primary)" /> {activePass.destination}
              </h2>
              <div className="flex items-center gap-4 text-sm text-secondary flex-wrap mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} /> {activePass.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} /> {activePass.departure_time} - {activePass.expected_return_time}
                </span>
              </div>

              {activePass.status === 'PENDING' && (
                <div className="alert alert-warning mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
                  <div>
                    <strong>Pending Parent Approval:</strong> Waiting for approval through Telegram. An authorization request with Approve/Reject buttons has been sent to your parent's Telegram bot.
                  </div>
                </div>
              )}

              {activePass.status === 'APPROVED' && (
                <div className="alert alert-success mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
                  <div>
                    <strong>Approved:</strong> Your parent approved the outpass via Telegram. Your digital QR pass is ready below.
                  </div>
                </div>
              )}

              {activePass.status === 'OUT' && (
                <div className="alert alert-info mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
                  <div>
                    <strong>You are currently outside:</strong> Return to the hostel gate before{' '}
                    <strong>{activePass.expected_return_time}</strong> and present your QR code for entry.
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end justify-center">
              {activePass.qr_token ? (
                <button
                  onClick={() => setSelectedQRPass(activePass)}
                  className="btn btn-success btn-lg"
                  style={{ width: '100%', maxWidth: '280px' }}
                >
                  <QrCode size={22} /> View Digital Gate QR
                </button>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.25rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                    maxWidth: '280px',
                  }}
                >
                  <Clock size={32} style={{ color: 'var(--status-pending-text)', margin: '0 auto 0.5rem' }} />
                  <div className="text-xs font-semibold text-secondary">
                    QR Pass unlocks automatically upon Telegram approval
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {outpasses[0]?.status === 'REJECTED' && (
            <div className="alert alert-danger mb-6 animate-fade-in" style={{ fontSize: '0.875rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Outpass Rejected:</strong> Your parent rejected your outpass request for{' '}
                <strong>{outpasses[0].destination}</strong> ({outpasses[0].date}) via Telegram.
              </div>
            </div>
          )}

          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 21, 34, 0.6) 100%)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold">No Active Outpass</h2>
                <p className="text-secondary text-sm mt-1">
                  You are currently inside the hostel campus. Planning to go out?
                </p>
              </div>
              <Link to="/student/request-outpass" className="btn btn-primary">
                <FilePlus2 size={16} /> Apply for New Outpass
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Metrics Row */}
      <div className="grid-stats">
        <StatCard
          label="Total Outpasses"
          value={totalCount}
          icon={History}
          color="var(--primary)"
          bg="rgba(99, 102, 241, 0.12)"
        />
        <StatCard
          label="Approved / Active"
          value={approvedCount}
          icon={CheckCircle2}
          color="var(--status-approved-text)"
          bg="var(--status-approved-bg)"
        />
        <StatCard
          label="Pending Approval"
          value={pendingCount}
          icon={Clock}
          color="var(--status-pending-text)"
          bg="var(--status-pending-bg)"
        />
        <StatCard
          label="Completed & Returned"
          value={returnedCount}
          icon={ArrowRightCircle}
          color="var(--status-returned-text)"
          bg="var(--status-returned-bg)"
        />
      </div>

      {/* Recent Outpasses Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Outpass Requests</h2>
            <p className="card-subtitle">Showing your recent requests and gate passes</p>
          </div>
          <Link to="/student/outpasses" className="btn btn-ghost btn-sm">
            View All ({outpasses.length}) <ExternalLink size={14} />
          </Link>
        </div>

        {outpasses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FilePlus2 size={28} />
            </div>
            <h3 className="empty-state-title">No outpass requests yet</h3>
            <p className="empty-state-desc">
              Submit your first hostel gate pass application to get started.
            </p>
            <Link to="/student/request-outpass" className="btn btn-primary btn-sm">
              Apply Now
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Departure</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {outpasses.slice(0, 5).map((pass) => (
                  <tr key={pass.id}>
                    <td className="font-semibold">{pass.destination}</td>
                    <td>{pass.date}</td>
                    <td>{pass.departure_time}</td>
                    <td>{pass.expected_return_time}</td>
                    <td>
                      <StatusBadge status={pass.status} size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pass.qr_token ? (
                        <button
                          onClick={() => setSelectedQRPass(pass)}
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          <QrCode size={13} /> View QR
                        </button>
                      ) : (
                        <span className="text-xs text-muted">No QR</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Pass Modal */}
      {selectedQRPass && (
        <QRCard
          outpass={selectedQRPass}
          studentName={user?.username}
          onClose={() => setSelectedQRPass(null)}
        />
      )}
    </div>
  );
}
