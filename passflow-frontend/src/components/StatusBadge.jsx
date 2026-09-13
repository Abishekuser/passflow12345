import React from 'react';
import { Clock, CheckCircle2, ArrowRightCircle, CheckCheck, AlertTriangle, XCircle, Home } from 'lucide-react';

export function StatusBadge({ status, size = 'normal', showIcon = true }) {
  const normalized = (status || '').toUpperCase();

  let badgeClass = 'badge-pending';
  let Icon = Clock;
  let label = normalized || 'UNKNOWN';

  switch (normalized) {
    case 'PENDING':
      badgeClass = 'badge-pending';
      Icon = Clock;
      label = 'Pending Parent Approval';
      break;
    case 'APPROVED':
      badgeClass = 'badge-approved';
      Icon = CheckCircle2;
      label = 'Approved';
      break;
    case 'OUT':
      badgeClass = 'badge-out';
      Icon = ArrowRightCircle;
      label = 'Currently OUT';
      break;
    case 'RETURNED':
    case 'IN':
      badgeClass = 'badge-returned';
      Icon = CheckCheck;
      label = normalized === 'IN' ? 'Hostel (IN)' : 'Returned (IN)';
      break;
    case 'LATE':
      badgeClass = 'badge-late';
      Icon = AlertTriangle;
      label = 'Returned Late / Overdue';
      break;
    case 'REJECTED':
      badgeClass = 'badge-rejected';
      Icon = XCircle;
      label = 'Rejected';
      break;
    default:
      badgeClass = 'badge-pending';
      Icon = Home;
      label = normalized;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <span className={`badge ${badgeClass} ${isSmall ? 'badge-sm' : ''}`} style={isSmall ? { fontSize: '0.7rem', padding: '0.2rem 0.5rem' } : {}}>
      {showIcon && <Icon size={isSmall ? 12 : 14} />}
      <span>{label}</span>
    </span>
  );
}
