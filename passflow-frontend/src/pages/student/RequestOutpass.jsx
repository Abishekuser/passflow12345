import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useToast } from '../../context/ToastContext';
import {
  FilePlus2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export function RequestOutpass() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Default times: current hour and current hour + 3 hours
  const now = new Date();
  const depTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const returnHour = Math.min(23, now.getHours() + 3);
  const retTimeStr = `${String(returnHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [date, setDate] = useState(todayStr);
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState(depTimeStr);
  const [expectedReturnTime, setExpectedReturnTime] = useState(retTimeStr);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    if (!date) return 'Please select an outpass date.';
    if (date < todayStr) return 'Outpass date cannot be in the past.';
    if (!destination.trim()) return 'Please specify your destination.';
    if (!departureTime) return 'Please specify departure time.';
    if (!expectedReturnTime) return 'Please specify expected return time.';
    if (departureTime >= expectedReturnTime) {
      return 'Expected return time must be strictly after departure time.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Backend expects { date, destination, departure_time, expected_return_time }
      // Time format should be "HH:MM:SS" or "HH:MM"
      const payload = {
        date,
        destination: destination.trim(),
        departure_time: departureTime.length === 5 ? `${departureTime}:00` : departureTime,
        expected_return_time:
          expectedReturnTime.length === 5 ? `${expectedReturnTime}:00` : expectedReturnTime,
      };

      const response = await studentApi.createOutpass(payload);
      showSuccess('Outpass request submitted successfully!');
      setSubmissionSuccess(response);
    } catch (err) {
      setError(err.message || 'Unable to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApprovalUrl = () => {
    if (!submissionSuccess?.parent_token) return;
    const approvalUrl = `${window.location.origin}/parent/approve/${submissionSuccess.parent_token}`;
    navigator.clipboard.writeText(approvalUrl);
    setCopiedLink(true);
    showSuccess('Parent approval URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Apply for Outpass</h1>
          <p className="page-subtitle">
            Fill out your departure details. Your parent will receive an email approval link.
          </p>
        </div>

        <Link to="/student/dashboard" className="btn btn-secondary btn-sm">
          Back to Dashboard
        </Link>
      </div>

      {submissionSuccess ? (
        <div className="card animate-scale-up" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div
            className="empty-state-icon"
            style={{
              background: 'var(--status-approved-bg)',
              color: 'var(--status-approved-text)',
              width: '72px',
              height: '72px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-xl font-bold mb-2">Outpass Request Submitted Successfully!</h2>
          <p className="text-secondary text-sm mb-4" style={{ maxWidth: '520px', margin: '0 auto 1.25rem' }}>
            Your outpass request is currently <strong className="text-primary">PENDING</strong>.
          </p>

          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              margin: '0 auto 1.75rem',
              maxWidth: '520px',
              textAlign: 'center',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1" style={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.95rem' }}>
              <Clock size={16} /> Waiting for parent approval by email
            </div>
            <p className="text-xs text-secondary mt-1">
              A secure email approval link has been sent to your parent. Once they approve it, the request moves to the warden approval step and the QR is unlocked after approval.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="btn btn-primary"
            >
              Go to Student Dashboard
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setDestination('');
              }}
              className="btn btn-secondary"
            >
              Create Another Request
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="destination">
                <span>Destination / Purpose <span className="required">*</span></span>
                <span className="text-xs text-muted">Where are you going?</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="destination"
                  type="text"
                  className="form-input"
                  placeholder="e.g. City Central Library, Medical Center, Market..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={loading}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <MapPin
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

            <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="date">
                  <span>Outpass Date <span className="required">*</span></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="date"
                    type="date"
                    min={todayStr}
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={loading}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Calendar
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
                <label className="form-label" htmlFor="departureTime">
                  <span>Departure Time <span className="required">*</span></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="departureTime"
                    type="time"
                    className="form-input"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    disabled={loading}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Clock
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
                <label className="form-label" htmlFor="expectedReturnTime">
                  <span>Expected Return <span className="required">*</span></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="expectedReturnTime"
                    type="time"
                    className="form-input"
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                    disabled={loading}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Clock
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
            </div>

            {/* Workflow Guide Alert */}
            <div
              style={{
                marginTop: '1.5rem',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem 1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <div className="font-bold text-primary mb-1">How it works:</div>
              <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Submit your destination and times.</li>
                <li>Your parent receives a secure approval email with a direct approval link.</li>
                <li>After parent and warden approval, the QR gate pass unlocks.</li>
                <li>Present the QR code at the main hostel gate when leaving and returning.</li>
              </ol>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting request...
                </>
              ) : (
                <>
                  Submit Outpass Application <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
