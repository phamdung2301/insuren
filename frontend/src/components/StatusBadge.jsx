import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStatusLabel = (st) => {
    switch (st) {
      case 'DRAFT': return 'DRAFT - Bản nháp';
      case 'QUOTED': return 'QUOTED - Báo phí';
      case 'BOUND': return 'BOUND - Gắn kết';
      case 'ACTIVE': return 'ACTIVE - Hiệu lực';
      case 'CANCELLED': return 'CANCELLED - Đã hủy';
      case 'EXPIRED': return 'EXPIRED - Hết hạn';
      default: return st || 'N/A';
    }
  };

  return (
    <span className={`status-badge status-${status || 'DRAFT'}`}>
      <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
