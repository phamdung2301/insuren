import React from 'react';

/**
 * PageHeader — hero banner gradient v2 với blob chuyển động.
 * Props: title (tiêu đề), subtitle (mô tả), actions (node: các nút bên phải)
 */
export const PageHeader = ({ title, subtitle, actions, delay = '' }) => {
  return (
    <div className={`v2-hero v2-anim ${delay}`} style={{ marginBottom: '1.5rem' }}>
      <div className="v2-blob" style={{ width: 200, height: 200, background: '#6366f1', top: -60, right: '10%' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
