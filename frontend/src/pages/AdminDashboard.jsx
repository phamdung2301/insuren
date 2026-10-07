import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, PieChart, TrendingUp, Award, RefreshCw, DollarSign, Users, Layers, ShieldCheck, CheckCircle, Download, Upload, Table } from 'lucide-react';
import reportApi from '../api/reportApi';
import StatusBadge from '../components/StatusBadge';
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
      console.error('Lỗi tải báo cáo từ MongoDB Aggregation', err);
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
      alert('Lỗi tải Excel template: ' + err.message);
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
      setImportMsg(`✅ Đã cập nhật ${Object.keys(res || {}).length} tỷ lệ phí thành công!`);
      fetchCurrentRates();
    } catch (err) {
      setImportMsg('❌ Lỗi import: ' + err.message);
    } finally {
      setRatesLoading(false);
      e.target.value = '';
    }
  };

  const totalOverallPremium = statusPremiums.reduce((sum, item) => sum + (item.totalPremium || 0), 0);
  const totalOverallCount = statusCounts.reduce((sum, item) => sum + (item.count || 0), 0);


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Trung Tâm Báo Cáo Phân Tích Kế Toán Bảo Hiểm</h1>
          <p style={{ color: 'var(--text-muted)' }}>4 MongoDB Aggregation Pipelines xử lý trực tiếp trên tập dữ liệu lớn (Thống kê P09 & P10)</p>
        </div>
        <button onClick={fetchReports} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
          <RefreshCw size={18} />
          <span>Thực Thi Aggregation Pipelines</span>
        </button>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: 50, height: 50 }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tổng Số Đơn Bảo Hiểm</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalOverallCount.toLocaleString()} hợp đồng
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', width: 50, height: 50 }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tổng Phí Bảo Hiểm Ghi Nhận</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>
              ${totalOverallPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', width: 50, height: 50 }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Số Đơn Đang Hiệu Lực</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
              {(statusCounts.find(s => s.status === 'ACTIVE')?.count || 0).toLocaleString()} đơn ACTIVE
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: 50, height: 50 }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Hợp Đồng Giá Trị Nhất</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${(topPolicies[0]?.totalPremium || 0).toLocaleString()} USD
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Đang xử lý MongoDB Aggregation Pipeline ($group, $match, $sort, $limit)...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1 & 2 Grid: Count by Status & Premium by Status */}
          <div className="grid-2">
            {/* Report 1: Count by Status */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={20} />
                <span>1. Số Lượng Đơn Theo Trạng Thái Vòng Đời</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Pipeline `$group` gom nhóm theo `status` và tính `$sum: 1`</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Trạng Thái Vòng Đời</th>
                      <th>Số Lượng Đơn</th>
                      <th>Tỷ Lệ Phần Trăm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusCounts.map((sc) => {
                      const pct = totalOverallCount > 0 ? ((sc.count / totalOverallCount) * 100).toFixed(1) : 0;
                      return (
                        <tr key={sc.status}>
                          <td><StatusBadge status={sc.status} /></td>
                          <td><strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{sc.count?.toLocaleString()}</strong> đơn</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 8, backgroundColor: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', width: 45, fontWeight: 700 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report 2: Total Premium by Status */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} />
                <span>2. Tổng Phí Bảo Hiểm Doanh Thu Theo Trạng Thái</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Pipeline `$group` tổng hợp tích lũy `$sum: "$totalPremium"`</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Trạng Thái Vòng Đời</th>
                      <th>Tổng Phí Bảo Hiểm</th>
                      <th>Trung Bình / Đơn</th>
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
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} />
                <span>3. Top 5 Hợp Đồng Bảo Hiểm Phí Khủng Nhất</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Pipeline `$sort: totalPremium DESC` kết hợp `$limit: 5`</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Hạng</th>
                      <th>Mã Hợp Đồng</th>
                      <th>Bên Mua Bảo Hiểm</th>
                      <th>Tổng Phí Quy Đổi</th>
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
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={20} />
                <span>4. Thống Kế Phí Theo Tháng Hiệu Lực (Monthly Trends)</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Pipeline chiết xuất `$year` và `$month` từ `effectiveDate`</p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tháng / Năm</th>
                      <th>Số Lượng Hợp Đồng</th>
                      <th>Tổng Doanh Thu Phí</th>
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
                  <span>5. Ma Trận Định Mức Tỷ Lệ Phí Bảo Hiểm (Excel In / Out Matrix)</span>
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Công cụ dành riêng cho Chuyên viên Định phí (Actuary): Xuất ma trận định phí Excel, hiệu chỉnh công thức/hệ số rủi ro, và nạp (import) vào hệ thống để áp dụng tức thì.
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
                  <span>Xuất Ma Trận Excel (.xlsx)</span>
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
                  <span>Nạp File Excel Cập Nhật Tỷ Lệ</span>
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
                backgroundColor: importMsg.startsWith('✅') ? 'var(--status-active-bg)' : 'var(--status-cancelled-bg)',
                color: importMsg.startsWith('✅') ? 'var(--status-active-text)' : 'var(--status-cancelled-text)'
              }}>
                {importMsg}
              </div>
            )}

            <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Bảng Tỷ Lệ Cơ Sở (Base Rates) Hiện Hành Trên Bộ Nhớ Hệ Thống:
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
