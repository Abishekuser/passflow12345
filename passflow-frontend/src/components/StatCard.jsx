import React from 'react';

export function StatCard({ label, value, icon: Icon, color = 'var(--primary)', bg = 'rgba(99, 102, 241, 0.1)', helper }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ background: bg, color: color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {helper && <div className="text-xs text-muted mt-1">{helper}</div>}
      </div>
    </div>
  );
}
