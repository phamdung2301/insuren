import React from 'react';

/**
 * KpiCard — thẻ chỉ số KPI phong cách v2: viền gradient trên, hover nâng.
 * Props: label (nhãn), value (giá trị, node), sub (dòng phụ), colors [c1, c2] cho viền gradient, delay (v2-d1..d6)
 */
export const KpiCard = ({ label, value, sub, colors = ['#1e3a8a', '#6366f1'], delay = '', style = {} }) => {
  return (
    <div
      className={`v2-kpi v2-anim ${delay}`}
      style={{ ...style, '--kpi-c1': colors[0], '--kpi-c2': colors[1] }}
    >
      <div className="v2-kpi-label">{label}</div>
      <div className="v2-kpi-value">{value}</div>
      {sub && <div className="v2-kpi-sub">{sub}</div>}
    </div>
  );
};

export default KpiCard;
