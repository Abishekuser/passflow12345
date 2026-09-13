import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from './StatusBadge';
import { X, Copy, Check, QrCode, Calendar, Clock, MapPin, User, Download } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';

export function QRCard({ outpass, studentName, onClose }) {
  const [copied, setCopied] = useState(false);
  const { showSuccess } = useToast();

  if (!outpass || !outpass.qr_token) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(outpass.qr_token);
    setCopied(true);
    showSuccess('QR Token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('passflow-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `PassFlow-QR-${outpass.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem 1.75rem' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="badge badge-approved" style={{ marginBottom: '0.75rem' }}>
            <QrCode size={13} /> Official Gate Pass
          </div>
          <h3 className="text-xl font-bold">Digital Outpass QR</h3>
          <p className="text-secondary text-xs mt-1">
            Present this QR code to the security guard at the gate.
          </p>
        </div>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            width: 'fit-content',
          }}
        >
          <QRCodeSVG
            id="passflow-qr-svg"
            value={outpass.qr_token}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Outpass Details */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {studentName && (
            <div className="flex items-center justify-between">
              <span className="text-secondary flex items-center gap-1">
                <User size={14} /> Student:
              </span>
              <span className="font-semibold text-primary">{studentName}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-secondary flex items-center gap-1">
              <MapPin size={14} /> Destination:
            </span>
            <span className="font-semibold">{outpass.destination}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-secondary flex items-center gap-1">
              <Calendar size={14} /> Date:
            </span>
            <span className="font-semibold">{outpass.date}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-secondary flex items-center gap-1">
              <Clock size={14} /> Departure / Return:
            </span>
            <span className="font-semibold">
              {outpass.departure_time} - {outpass.expected_return_time}
            </span>
          </div>

          <div className="flex items-center justify-between" style={{ paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-secondary">Current Status:</span>
            <StatusBadge status={outpass.status} size="sm" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleDownloadQR} className="btn btn-secondary btn-sm flex-1">
            <Download size={14} /> Download Pass
          </button>
          <button onClick={handleCopyToken} className="btn btn-outline btn-sm flex-1">
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            {copied ? 'Copied Token' : 'Copy Token'}
          </button>
        </div>
      </div>
    </div>
  );
}
