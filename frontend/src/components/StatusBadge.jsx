import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStatusLabel = (st) => {
    switch (st) {
      case 'DRAFT': return 'Bản nháp';
      case 'QUOTED': return 'Đã báo giá';
      case 'BOUND': return 'Đã ký kết';
      case 'ACTIVE': return 'Đang hiệu lực';
      case 'CANCELLED': return 'Đã hủy';
      case 'EXPIRED': return 'Đã hết hạn';
      default: return st || 'N/A';
    }
  };

  return (
    <span className={`status-badge status-${status || 'DRAFT'}${status === 'ACTIVE' ? ' v2-pulse' : ''}`}>
      <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
