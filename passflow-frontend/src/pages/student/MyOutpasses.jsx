import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { QRCard } from '../../components/QRCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  FilePlus2,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export function MyOutpasses() {
  const { user } = useAuth();
  const { showError } = useToast();

  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQRPass, setSelectedQRPass] = useState(null);

  const fetchOutpasses = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await studentApi.getMyOutpasses();
      const sorted = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        : [];
      setOutpasses(sorted);
    } catch (err) {
      showError(err.message || 'Failed to load outpasses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOutpasses();
  }, [fetchOutpasses]);

  // Filtering
  const filtered = outpasses.filter((pass) => {
    const matchesStatus =
      filterStatus === 'ALL' || (pass.status || '').toUpperCase() === filterStatus;
    const matchesSearch =
      (pass.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pass.date || '').includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner text="Loading your outpass records..." fullPage />;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Outpasses</h1>
          <p className="page-subtitle">Complete history of your hostel outpass applications</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOutpasses(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/student/request-outpass" className="btn btn-primary btn-sm">
            <FilePlus2 size={16} /> New Outpass
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'PENDING', 'PARENT_APPROVED', 'APPROVED', 'OUT', 'RETURNED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                {st === 'ALL' ? 'All Requests' : st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search destination or date..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '36px', fontSize: '0.825rem' }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Outpass List / Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderOpen size={28} />
            </div>
            <h3 className="empty-state-title">No matching outpasses found</h3>
            <p className="empty-state-desc">
              {searchTerm || filterStatus !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : "You haven't created any outpasses yet."}
            </p>
            {searchTerm || filterStatus !== 'ALL' ? (
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setSearchTerm('');
                }}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/student/request-outpass" className="btn btn-primary btn-sm">
                Apply for Outpass
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Departure Time</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Digital Pass</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pass) => (
                  <tr key={pass.id}>
                    <td className="font-mono text-xs text-muted">#{pass.id}</td>
                    <td>
                      <div className="font-semibold text-primary">{pass.destination}</div>
                      {pass.created_at && (
                        <div className="text-xs text-muted">Applied: {pass.created_at.split('.')[0]}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted" /> {pass.date}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted" /> {pass.departure_time}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted" /> {pass.expected_return_time}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={pass.status} size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pass.qr_token && ['APPROVED', 'OUT'].includes(pass.status?.toUpperCase()) ? (
                        <button
                          onClick={() => setSelectedQRPass(pass)}
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.35rem 0.75rem' }}
                        >
                          <QrCode size={13} /> View QR
                        </button>
                      ) : (
                        <span className="text-xs text-muted">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
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
