import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { gateApi } from '../../api/gateApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  QrCode,
  Camera,
  CameraOff,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
  CheckCheck,
  Building,
} from 'lucide-react';

export function SecurityDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);

  const html5QrCodeRef = useRef(null);

  // Stop camera cleanly on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((e) => console.error(e));
      }
    };
  }, []);

  const handleProcessToken = async (tokenToProcess) => {
    if (!tokenToProcess || !tokenToProcess.trim()) {
      setError('Please provide a valid QR pass token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await gateApi.scanQr(tokenToProcess.trim());
      setScanResult(response);
      showSuccess(response.message || 'Pass verified successfully!');

      // Add to session logs
      setRecentLogs((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          studentName: response.student?.name || 'Unknown',
          rollNumber: response.student?.roll_number || '',
          action: response.action,
          returnStatus: response.return_status,
          destination: response.outpass?.destination,
        },
        ...prev.slice(0, 19),
      ]);

      // Clear manual input
      setManualToken('');
    } catch (err) {
      setError(err.message || 'Invalid or expired QR pass.');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const startCameraScanner = async () => {
    setError('');
    setIsCameraActive(true);

    try {
      // Small timeout to ensure DOM container is rendered
      setTimeout(async () => {
        const qrCodeScanner = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = qrCodeScanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        try {
          await qrCodeScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              // On Successful QR read:
              qrCodeScanner.stop().then(() => {
                setIsCameraActive(false);
                handleProcessToken(decodedText);
              });
            },
            () => {
              // Ignore frame-by-frame non-matches
            }
          );
        } catch (camError) {
          console.error('Camera start error:', camError);
          setError('Camera permission denied or camera not found. Please use manual token input.');
          setIsCameraActive(false);
        }
      }, 200);
    } catch (err) {
      setError('Unable to initialize camera scanner.');
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsCameraActive(false);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={28} style={{ color: 'var(--primary)' }} /> Gate Security Verification
          </h1>
          <p className="page-subtitle">
            Scan student digital outpass QR codes to log campus exit and return.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-out">
            <span className="badge-dot animate-pulse"></span>
            <span>Security Gate Active</span>
          </div>
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="layout-2col">
        {/* Left Column: Scanner & Verification Result */}
        <div>
          {/* Scanner Controls Card */}
          <div className="card mb-6">
            <div className="card-header">
              <div>
                <h2 className="card-title">Scan Student Gate Pass</h2>
                <p className="card-subtitle">Use optical camera or manual token search</p>
              </div>
              <button
                type="button"
                onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
                className={`btn btn-sm ${isCameraActive ? 'btn-danger' : 'btn-primary'}`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff size={15} /> Stop Camera
                  </>
                ) : (
                  <>
                    <Camera size={15} /> Open Camera Scanner
                  </>
                )}
              </button>
            </div>

            {/* Camera Viewport */}
            {isCameraActive && (
              <div className="qr-scanner-box animate-fade-in">
                <div id="qr-reader" style={{ width: '100%' }}></div>
                <p className="text-center text-xs text-muted mt-2 mb-2">
                  Position student QR code inside the frame
                </p>
              </div>
            )}

            {/* Manual Token Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessToken(manualToken);
              }}
              style={{ marginTop: '1rem' }}
            >
              <label className="form-label" htmlFor="manualToken">
                QR Token Input / Barcode Scanner:
              </label>
              <div className="flex gap-2">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    id="manualToken"
                    type="text"
                    placeholder="Enter or paste QR token UUID (e.g. 550e8400-e29b-41d4-a716...)"
                    className="form-input"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    disabled={loading}
                    style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <QrCode
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !manualToken.trim()}
                  style={{ minWidth: '130px' }}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Search size={16} /> Verify Pass
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger animate-fade-in">
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <div className="font-bold">Scan Verification Failed</div>
                <div className="text-sm mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Verification Result Card */}
          {scanResult && (
            <div
              className="card animate-scale-up"
              style={{
                border: `2px solid ${
                  scanResult.action === 'OUT'
                    ? 'var(--status-out-border)'
                    : scanResult.return_status === 'LATE'
                    ? 'var(--status-late-border)'
                    : 'var(--status-approved-border)'
                }`,
                background:
                  scanResult.action === 'OUT'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 21, 34, 0.95) 100%)'
                    : scanResult.return_status === 'LATE'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(16, 21, 34, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 21, 34, 0.95) 100%)',
              }}
            >
              {/* Verdict Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={24}
                    color={
                      scanResult.action === 'OUT'
                        ? 'var(--status-out-text)'
                        : scanResult.return_status === 'LATE'
                        ? 'var(--status-late-text)'
                        : 'var(--status-approved-text)'
                    }
                  />
                  <h2 className="text-lg font-bold">{scanResult.message}</h2>
                </div>

                {scanResult.action === 'OUT' ? (
                  <span className="badge badge-out">
                    <ArrowRight size={13} /> STUDENT MARKED OUT
                  </span>
                ) : (
                  <span
                    className={`badge ${
                      scanResult.return_status === 'LATE' ? 'badge-late' : 'badge-approved'
                    }`}
                  >
                    <ArrowLeft size={13} />
                    {scanResult.return_status === 'LATE'
                      ? 'RETURNED LATE'
                      : 'RETURNED ON TIME'}
                  </span>
                )}
              </div>

              {/* Student & Outpass Details */}
              <div className="flex gap-4 flex-wrap" style={{ alignItems: 'flex-start' }}>
                {/* Photo */}
                <div
                  style={{
                    width: '100px',
                    height: '110px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {scanResult.student?.photo_url ? (
                    <img
                      src={scanResult.student.photo_url}
                      alt={scanResult.student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User size={40} className="text-muted" />
                  )}
                </div>

                {/* Profile Grid */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <h3 className="text-xl font-bold text-primary">
                    {scanResult.student?.name}
                  </h3>

                  <div className="grid grid-2 mt-2" style={{ gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted">Roll Number: </span>
                      <strong className="text-primary">{scanResult.student?.roll_number}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Room No: </span>
                      <strong>{scanResult.student?.room_number}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Department: </span>
                      <span>{scanResult.student?.department}</span>
                    </div>
                    <div>
                      <span className="text-muted">Destination: </span>
                      <strong>{scanResult.outpass?.destination}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Expected Return: </span>
                      <strong>{scanResult.outpass?.expected_return_time}</strong>
                    </div>
                    {scanResult.outpass?.actual_return_time && (
                      <div>
                        <span className="text-muted">Actual Return: </span>
                        <strong>{scanResult.outpass?.actual_return_time}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Shift Audit Logs */}
        <div>
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Gate Activity Log</h3>
                <p className="card-subtitle">Recent scans this session</p>
              </div>
              <span className="badge badge-in">{recentLogs.length} scans</span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <QrCode size={32} className="empty-state-icon" />
                <div className="text-sm font-semibold">No gate scans recorded yet</div>
                <div className="text-xs text-muted mt-1">
                  Scanned passes will automatically appear here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div>
                      <div className="font-bold text-primary">{log.studentName}</div>
                      <div className="text-xs text-secondary">
                        {log.rollNumber} • {log.destination}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        className={`badge ${
                          log.action === 'OUT'
                            ? 'badge-out'
                            : log.returnStatus === 'LATE'
                            ? 'badge-late'
                            : 'badge-approved'
                        }`}
                        style={{ fontSize: '0.675rem', padding: '0.15rem 0.45rem' }}
                      >
                        {log.action}
                      </span>
                      <div className="text-xs text-muted mt-1">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
