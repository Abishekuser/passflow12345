import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parentApi } from '../../api/parentApi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export function ParentApprovalPage() {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  const [inputToken, setInputToken] = useState('');
  const activeToken = urlToken || inputToken;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success: boolean, message: string, status: string }
  const [error, setError] = useState('');

  const handleAction = async (actionType) => {
    if (!activeToken || !activeToken.trim()) {
      setError('Please provide an outpass approval token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (actionType === 'APPROVE') {
        response = await parentApi.approveOutpass(activeToken.trim());
        setResult({
          success: true,
          status: 'APPROVED',
          message: response.message || 'Outpass approved successfully and student QR generated.',
        });
      } else {
        response = await parentApi.rejectOutpass(activeToken.trim());
        setResult({
          success: true,
          status: 'REJECTED',
          message: response.message || 'Outpass rejected.',
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to process request. The token may be expired or already used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card animate-scale-up" style={{ maxWidth: '520px', padding: '2.5rem 2rem' }}>
        {/* Brand Header */}
        <div className="auth-header" style={{ marginBottom: '1.75rem' }}>
          <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-xl font-bold">PassFlow Parent Portal</h1>
          <p className="text-secondary text-sm mt-1">
            Hostel Outpass Authorization & Verification
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div className="font-bold">Notice</div>
              <div className="text-sm mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Success / Result View */}
        {result ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              className="empty-state-icon"
              style={{
                background: result.status === 'APPROVED' ? 'var(--status-approved-bg)' : 'var(--status-late-bg)',
                color: result.status === 'APPROVED' ? 'var(--status-approved-text)' : 'var(--status-late-text)',
                width: '72px',
                height: '72px',
                marginBottom: '1.25rem',
              }}
            >
              {result.status === 'APPROVED' ? <CheckCircle2 size={38} /> : <XCircle size={38} />}
            </div>

            <h2 className="text-xl font-bold mb-2">
              {result.status === 'APPROVED' ? 'Outpass Approved!' : 'Outpass Rejected'}
            </h2>

            <p className="text-secondary text-sm mb-6" style={{ lineHeight: 1.6 }}>
              {result.message}
            </p>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
              }}
            >
              {result.status === 'APPROVED'
                ? 'Your student has been issued a verified QR gate pass for departure.'
                : 'The hostel management and your student have been notified that this request was declined.'}
            </div>
          </div>
        ) : (
          <div>
            {/* Manual Token Input if opened without URL parameter */}
            {!urlToken && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="parentToken">
                  Enter Parent Approval Token:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="parentToken"
                    type="text"
                    placeholder="Paste parent token here..."
                    className="form-input"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                  />
                  <KeyRound
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
            )}

            <div
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                textAlign: 'center',
              }}
            >
              <div className="text-sm font-semibold text-primary mb-1">
                Student Outpass Authorization
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Your ward has submitted a request to leave the hostel campus. Please review and provide your authorization below.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleAction('APPROVE')}
                className="btn btn-success btn-lg"
                disabled={loading || !activeToken}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ThumbsUp size={20} /> Approve Outpass Request
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAction('REJECT')}
                className="btn btn-danger btn-lg"
                disabled={loading || !activeToken}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ThumbsDown size={20} /> Reject Outpass Request
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              Secured with 256-bit cryptographic token verification • PassFlow Security
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
