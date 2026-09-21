import React, { useState, useEffect, useCallback } from 'react';
import { wardenApi } from '../../api/wardenApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  Building2,
  Users,
  Clock,
  ArrowRightCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  Calendar,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

export function WardenDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [students, setStudents] = useState([]);
  const [pendingOutpasses, setPendingOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('STUDENTS'); // 'STUDENTS' | 'PENDING' | 'LATE'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedOutpassIds, setSelectedOutpassIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [studentsData, pendingData] = await Promise.all([
        wardenApi.getStudents(),
        wardenApi.getPendingOutpasses(selectedYear),
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setPendingOutpasses(Array.isArray(pendingData) ? pendingData : []);
      setSelectedOutpassIds([]);
    } catch (err) {
      showError(err.message || 'Failed to load warden hostel data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleOutpassSelection = (outpassId) => {
    setSelectedOutpassIds((current) =>
      current.includes(outpassId)
        ? current.filter((id) => id !== outpassId)
        : [...current, outpassId]
    );
  };

  const allPendingSelected = pendingOutpasses.length > 0 &&
    pendingOutpasses.every((pass) => selectedOutpassIds.includes(pass.outpass_id));

  const toggleSelectAll = () => {
    setSelectedOutpassIds(allPendingSelected ? [] : pendingOutpasses.map((pass) => pass.outpass_id));
  };

  const handleApproveSelected = async () => {
    if (selectedOutpassIds.length === 0) return;
    setActionLoading('bulk');
    try {
      const response = await wardenApi.approveSelected(selectedOutpassIds);
      showSuccess(response.message || `${selectedOutpassIds.length} outpass${selectedOutpassIds.length === 1 ? '' : 'es'} approved successfully.`);
      await fetchData(true);
    } catch (err) {
      showError(err.message || 'Failed to approve selected outpasses.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleIndividualAction = async (outpassId, action) => {
    setActionLoading(outpassId);
    try {
      const response = action === 'approve'
        ? await wardenApi.approveOutpass(outpassId)
        : await wardenApi.rejectOutpass(outpassId);
      showSuccess(response.message || `Outpass ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      await fetchData(true);
    } catch (err) {
      showError(err.message || `Failed to ${action} outpass.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Derived statistics
  const totalStudents = students.length;
  const currentlyOut = students.filter((s) => s.status === 'OUT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const inHostelCount = students.filter((s) => s.status === 'IN' || s.status === 'RETURNED').length;
  const pendingCount = pendingOutpasses.length;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesStatus =
      statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter;
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.room_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Late / Out students
  const urgentStudents = students.filter((s) => s.status === 'LATE' || s.status === 'OUT');

  if (loading) {
    return <LoadingSpinner text="Loading hostel surveillance dashboard..." fullPage />;
  }

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 size={28} style={{ color: 'var(--primary)' }} /> Warden Monitoring Console
          </h1>
          <p className="page-subtitle">
            Real-time hostel occupancy, active outpass status, and curfew compliance tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid-stats">
        <StatCard
          label="Total Registered Students"
          value={totalStudents}
          icon={Users}
          color="var(--primary)"
          bg="rgba(99, 102, 241, 0.12)"
        />
        <StatCard
          label="Currently Outside"
          value={currentlyOut}
          icon={ArrowRightCircle}
          color="var(--status-out-text)"
          bg="var(--status-out-bg)"
        />
        <StatCard
          label="Late / Past Curfew"
          value={lateCount}
          icon={AlertTriangle}
          color="var(--status-late-text)"
          bg="var(--status-late-bg)"
        />
        <StatCard
          label="Pending Parent Approval"
          value={pendingCount}
          icon={Clock}
          color="var(--status-pending-text)"
          bg="var(--status-pending-bg)"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'STUDENTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('STUDENTS')}
        >
          <Users size={16} /> Student Roll-Call ({students.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          <Clock size={16} /> Pending Requests ({pendingOutpasses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'LATE' ? 'active' : ''}`}
          onClick={() => setActiveTab('LATE')}
        >
          <ShieldAlert size={16} /> Attention / Outside List ({urgentStudents.length})
        </button>
      </div>

      {/* Tab 1: All Students List */}
      {activeTab === 'STUDENTS' && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'IN', 'OUT', 'LATE', 'RETURNED', 'PENDING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {st === 'ALL' ? 'All Statuses' : st}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="Search name, roll, room..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.825rem' }}
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

          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={32} className="empty-state-icon" />
              <h3 className="empty-state-title">No students found</h3>
              <p className="empty-state-desc">Try clearing search filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Room No.</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, idx) => (
                    <tr key={`${st.roll_number}-${idx}`}>
                      <td className="font-bold text-primary">{st.name}</td>
                      <td className="font-mono text-sm">{st.roll_number}</td>
                      <td>{st.department}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>
                          {st.room_number}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={st.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Outpasses Queue */}
      {activeTab === 'PENDING' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pending Outpass Queue</h2>
              <p className="card-subtitle">
                Requests approved by parents and awaiting warden approval
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="form-select"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                style={{ width: '140px', padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                aria-label="Filter by year"
              >
                <option value="ALL">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleApproveSelected}
                disabled={selectedOutpassIds.length === 0 || actionLoading !== null}
              >
                <CheckCircle2 size={14} /> Approve Selected ({selectedOutpassIds.length})
              </button>
            </div>
          </div>

          {pendingOutpasses.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={36} className="empty-state-icon" style={{ color: 'var(--status-approved-text)' }} />
              <h3 className="empty-state-title">No pending requests</h3>
              <p className="empty-state-desc">All student outpasses have been resolved.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all pending outpasses"
                      />
                    </th>
                    <th>Outpass ID</th>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Room</th>
                    <th>Destination</th>
                    <th>Date</th>
                    <th>Timings</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOutpasses.map((p) => (
                    <tr key={p.outpass_id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={selectedOutpassIds.includes(p.outpass_id)}
                          onChange={() => toggleOutpassSelection(p.outpass_id)}
                          aria-label={`Select outpass ${p.outpass_id}`}
                        />
                      </td>
                      <td className="font-mono text-xs text-muted">#{p.outpass_id}</td>
                      <td className="font-bold text-primary">{p.name}</td>
                      <td className="font-mono text-xs">{p.roll_number}</td>
                      <td>{p.department}</td>
                      <td>{p.year}</td>
                      <td>{p.room_number}</td>
                      <td className="font-semibold">{p.destination}</td>
                      <td>{p.date}</td>
                      <td>
                        <span className="text-xs">
                          {p.departure_time} - {p.expected_return_time}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleIndividualAction(p.outpass_id, 'approve')}
                            disabled={actionLoading !== null}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleIndividualAction(p.outpass_id, 'reject')}
                            disabled={actionLoading !== null}
                          >
                            <AlertTriangle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Urgent / Late Curfew Watchlist */}
      {activeTab === 'LATE' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-danger flex items-center gap-2">
                <AlertTriangle size={20} /> Curfew & Outside Monitoring
              </h2>
              <p className="card-subtitle">
                Students currently outside or flagged for late arrival
              </p>
            </div>
          </div>

          {urgentStudents.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={36} className="empty-state-icon" style={{ color: 'var(--status-approved-text)' }} />
              <h3 className="empty-state-title">All Students Accounted For</h3>
              <p className="empty-state-desc">No students are currently overdue or outside.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Room No.</th>
                    <th>Status Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentStudents.map((st, idx) => (
                    <tr
                      key={`${st.roll_number}-${idx}`}
                      style={
                        st.status === 'LATE'
                          ? { background: 'rgba(239, 68, 68, 0.06)' }
                          : {}
                      }
                    >
                      <td className="font-bold">{st.name}</td>
                      <td className="font-mono text-xs">{st.roll_number}</td>
                      <td>{st.department}</td>
                      <td>{st.room_number}</td>
                      <td>
                        <StatusBadge status={st.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
