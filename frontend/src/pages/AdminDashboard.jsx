import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, PieChart, Award, RefreshCw, DollarSign, Download, Upload, Table } from 'lucide-react';
import reportApi from '../api/reportApi';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import AnimatedBar from '../components/AnimatedBar';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export const AdminDashboard = () => {
  const [statusCounts, setStatusCounts] = useState([]);
  const [statusPremiums, setStatusPremiums] = useState([]);
  const [topPolicies, setTopPolicies] = useState([]);
  const [monthlyPremiums, setMonthlyPremiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRates, setCurrentRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, topRes, mRes] = await Promise.all([
        reportApi.getPolicyCountByStatus(),
        reportApi.getTotalPremiumByStatus(),
        reportApi.getTopFivePoliciesByPremium(),
        reportApi.getTotalPremiumByEffectiveMonth(),
      ]);

      setStatusCounts(cRes || []);
      setStatusPremiums(pRes || []);
      setTopPolicies(topRes || []);
      setMonthlyPremiums(mRes || []);
    } catch (err) {
      console.error('Không tải được báo cáo', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchCurrentRates();
  }, []);

  const fetchCurrentRates = async () => {
    try {
      const rates = await axiosClient.get('/excel/current-rates');
      setCurrentRates(rates || {});
    } catch (err) {
      console.error('Could not load current rates', err);
    }
  };

  const handleDownloadTemplate = async () => {
    setRatesLoading(true);
    try {
      const response = await axiosClient.get('/excel/template', { responseType: 'arraybuffer' });
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `InsurancePricingMatrix_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Không tải được file mẫu Excel: ' + err.message);
    } finally {
      setRatesLoading(false);
    }
  };

  const handleImportRates = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRatesLoading(true);
    setImportMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post('/excel/import-rates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportMsg(`Đã cập nhật ${Object.keys(res || {}).length} tỷ lệ phí ✓`);
      fetchCurrentRates();
    } catch (err) {
      setImportMsg('Không nhập được file: ' + err.message);
    } finally {
      setRatesLoading(false);
      e.target.value = '';
    }
  };

  const totalOverallPremium = statusPremiums.reduce((sum, item) => sum + (item.totalPremium || 0), 0);
  const totalOverallCount = statusCounts.reduce((sum, item) => sum + (item.count || 0), 0);


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Báo cáo tổng hợp"
        subtitle="Số liệu tính trực tiếp từ hệ thống, cập nhật theo thời gian thực"
        delay="v2-d1"
        actions={
          <button onClick={fetchReports} className="btn" style={{ background: '#fff', color: 'var(--primary)', padding: '0.6rem 1.25rem', fontWeight: 700, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={18} />
            <span>Tải lại báo cáo</span>
          </button>
        }
      />

      {/* KPI Overview Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <KpiCard label="Tổng số hợp đồng" delay="v2-d2"
          value={<>{totalOverallCount.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>hợp đồng</span></>}
          sub="Tất cả trạng thái" colors={['#1e3a8a', '#6366f1']} />
        <KpiCard label="Tổng phí đã ghi nhận" delay="v2-d3"
          value={<span style={{ color: 'var(--secondary)' }}>${totalOverallPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '1rem', fontWeight: 600 }}>USD</span></span>}
          sub="Cộng dồn theo thời gian" colors={['#0d9488', '#14b8a6']} />
        <KpiCard label="Số hợp đồng đang hiệu lực" delay="v2-d4"
          value={<>{(statusCounts.find(s => s.status === 'ACTIVE')?.count || 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>hợp đồng</span></>}
          sub="Trạng thái đang hiệu lực" colors={['#047857', '#10b981']} />
        <KpiCard label="Hợp đồng giá trị nhất" delay="v2-d5"
          value={<>${(topPolicies[0]?.totalPremium || 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>USD</span></>}
          sub={topPolicies[0]?.policyNumber || 'Chưa có dữ liệu'} colors={['#b45309', '#f59e0b']} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Đang tổng hợp số liệu...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1 & 2 Grid: Count by Status & Premium by Status */}
          <div className="grid-2">
            {/* Report 1: Count by Status */}
            <div className="card v2-card-lift v2-anim">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={20} />
                <span>1. Số hợp đồng theo trạng thái</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Số hợp đồng phân bổ theo từng trạng thái</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Trạng thái</th>
                      <th>Số lượng</th>
                      <th>Tỷ lệ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusCounts.map((sc) => {
                      const pct = totalOverallCount > 0 ? ((sc.count / totalOverallCount) * 100).toFixed(1) : 0;
                      return (
                        <tr key={sc.status}>
                          <td><StatusBadge status={sc.status} /></td>
                          <td><strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{sc.count?.toLocaleString()}</strong> hợp đồng</td>
                          <td style={{ minWidth: 220 }}>
                            <AnimatedBar percent={pct} value={`${pct}%`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report 2: Total Premium by Status */}
            <div className="card v2-card-lift v2-anim">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} />
                <span>2. Tổng phí theo trạng thái</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Tổng phí và phí trung bình theo trạng thái</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Trạng thái</th>
                      <th>Tổng phí</th>
                      <th>Trung bình / hợp đồng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusPremiums.map((sp) => {
                      const avg = sp.count > 0 ? sp.totalPremium / sp.count : 0;
                      return (
                        <tr key={sp.status}>
                          <td><StatusBadge status={sp.status} /></td>
                          <td><strong style={{ fontSize: '1.05rem', color: 'var(--secondary)' }}>${sp.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong></td>
                          <td>${avg.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3 & 4 Grid: Top 5 Policies & Monthly Revenues */}
          <div className="grid-2">
            {/* Report 3: Top 5 Highest Premium Policies */}
            <div className="card v2-card-lift v2-anim">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} />
                <span>3. Top 5 hợp đồng phí cao nhất</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Các hợp đồng có tổng phí cao nhất</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Top</th>
                      <th>Số hợp đồng</th>
                      <th>Bên mua</th>
                      <th>Tổng phí quy đổi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPolicies.map((tp, idx) => (
                      <tr key={tp.policyNumber || idx}>
                        <td><strong style={{ color: idx === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>#{idx + 1}</strong></td>
                        <td>
                          <Link to={`/policies/${tp.policyNumber}`} style={{ color: 'var(--primary)', fontWeight: 800 }}>
                            {tp.policyNumber}
                          </Link>
                        </td>
                        <td>{tp.insured?.name || 'Chưa cập nhật'}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 800 }}>
                          ${tp.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report 4: Monthly Premium Breakdown */}
            <div className="card v2-card-lift v2-anim">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={20} />
                <span>4. Phí theo tháng hiệu lực</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Tổng phí theo tháng hợp đồng có hiệu lực</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tháng/Năm</th>
                      <th>Số lượng hợp đồng</th>
                      <th>Tổng phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPremiums.map((mp, idx) => (
                      <tr key={idx}>
                        <td><strong>Tháng {mp.month} / {mp.year}</strong></td>
                        <td>{mp.count?.toLocaleString()} hợp đồng</td>
                        <td style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                          ${mp.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 5: Dynamic Excel Rate In/Out Matrix Management */}
          <div className="card" style={{ marginTop: '2rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Table size={22} />
                  <span>5. Bảng tỷ lệ phí (nhập/xuất Excel)</span>
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Dành cho chuyên viên định phí: xuất bảng tỷ lệ ra Excel, chỉnh công thức và hệ số rồi tải lên để áp dụng ngay.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={ratesLoading}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <Download size={16} />
                  <span>Tải bảng tỷ lệ (Excel)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportRates}
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ratesLoading}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <Upload size={16} />
                  <span>Tải lên file Excel cập nhật tỷ lệ</span>
                </button>
              </div>
            </div>

            {importMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                backgroundColor: importMsg.startsWith('Không') ? 'var(--status-cancelled-bg)' : 'var(--status-active-bg)',
                color: importMsg.startsWith('Không') ? 'var(--status-cancelled-text)' : 'var(--status-active-text)'
              }}>
                {importMsg}
              </div>
            )}

            <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Bảng tỷ lệ phí đang áp dụng:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(currentRates).length > 0 ? (
                  Object.entries(currentRates).map(([code, rate]) => (
                    <div key={code} style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>{code}</span>
                      <span style={{
                        fontWeight: 800,
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        {(rate * 100).toFixed(2)}% / năm
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang nạp dữ liệu tỷ lệ phí...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
