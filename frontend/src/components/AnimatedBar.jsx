import React from 'react';

/**
 * AnimatedBar — thanh tiến trình mọc dần khi mount (v2).
 * Props: percent (0-100), label (nhãn trái), value (giá trị phải, node/string)
 */
export const AnimatedBar = ({ percent = 0, label = '', value = '' }) => {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
      {label && (
        <span style={{ width: 110, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      )}
      <div className="v2-bar-track">
        <div className="v2-bar-fill" style={{ width: `${pct}%`, '--v2-w': `${pct}%` }} />
      </div>
      {value !== '' && (
        <span style={{ width: 72, textAlign: 'right', fontWeight: 800, flexShrink: 0 }}>{value}</span>
      )}
    </div>
  );
};

export default AnimatedBar;
