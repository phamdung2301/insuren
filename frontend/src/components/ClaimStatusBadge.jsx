import React from 'react';
import { claimStatusLabels } from '../api/claimApi';

const STATUS_STYLES = {
  SUBMITTED: { bg: '#f1f5f9', color: '#475569' },
  UNDER_REVIEW: { bg: '#e0e7ff', color: '#4338ca' },
  APPROVED: { bg: '#fef3c7', color: '#92400e' },
  REJECTED: { bg: '#fef2f2', color: '#b91c1c' },
  PAID: { bg: '#ecfdf5', color: '#047857' },
  CANCELLED: { bg: '#f1f5f9', color: '#94a3b8' },
};

export const ClaimStatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.SUBMITTED;
  return (
    <span
      className={`status-badge${status === 'PAID' ? ' v2-pulse' : ''}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {claimStatusLabels[status] || status || 'N/A'}
    </span>
  );
};

export default ClaimStatusBadge;
