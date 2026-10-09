import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Plus, Filter, ShieldCheck, MapPin, DollarSign, Calendar, ArrowRight, RefreshCw, ChevronLeft, ChevronRight, XCircle, Download, Trash2, Zap, CreditCard } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import policyApi from '../api/policyApi';
import axiosClient from '../api/axiosClient';

export const CustomerPortal = ({ user, isAdmin }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({ pageNumber: 0, pageSize: 12, totalElements: 0, totalPages: 0 });

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPremium, setMinPremium] = useState('');
  const [maxPremium, setMaxPremium] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [page, setPage] = useState(0);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 12,
        sortBy,
        sortDirection,
      };

      if (search.trim()) {
        if (search.trim().toUpperCase().startsWith('POL-')) {
          params.policyNumber = search.trim();
        } else {
          params.insuredName = search.trim();
        }
      }

      if (selectedStatus) params.status = selectedStatus;
      if (minPremium) params.minPremium = Number(minPremium);
      if (maxPremium) params.maxPremium = Number(maxPremium);

      const res = await policyApi.getPolicies(params);
      if (res && res.content !== undefined) {
        setPolicies(res.content || []);
        setPageInfo({
          pageNumber: res.pageNumber || 0,
          pageSize: res.pageSize || 12,
          totalElements: res.totalElements || 0,
          totalPages: res.totalPages || 0,
        });
      } else {
        setPolicies(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      console.error('Không tải được danh sách hợp đồng:', err);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, sortBy, sortDirection, search, minPremium, maxPremium]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]); // FIX: includes all filter deps via useCallback

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    // fetchPolicies is auto-triggered by useCallback deps changing
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setMinPremium('');
    setMaxPremium('');
    setSortBy('updatedAt');
    setSortDirection('DESC');
    setPage(0);
    // fetchPolicies triggers automatically via useCallback
  };

  const handleDeletePolicy = async (policyNumber) => {
    if (!window.confirm(`Xóa hợp đồng ${policyNumber}? Hành động này không thể hoàn tác.`)) return;
    try {
      await policyApi.deletePolicy(policyNumber);
      fetchPolicies();
    } catch (err) {
      alert('Chưa xóa được hợp đồng: ' + err.message);
    }
  };

  const handleDownloadExcel = async (policyNumber) => {
    try {
      const response = await axiosClient.get(`/excel/policy/${policyNumber}/download`, { responseType: 'arraybuffer' });
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PremiumCalc_${policyNumber}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Không xuất được file Excel: ' + err.message);
    }
  };

  const handleQuickAdminOfflineActive = async (policyNumber) => {
    if (!window.confirm(`⚡ Bạn có chắc muốn kích hoạt ngay hợp đồng ${policyNumber}? (Xác nhận đã thu phí trực tiếp)`)) return;
    try {
      await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: 'Quản trị viên xác nhận đã thu phí trực tiếp và kích hoạt hợp đồng.',
        actor: user?.fullName || 'Quản trị viên',
      });
      alert(`⚡ Đã kích hoạt thành công hợp đồng ${policyNumber}!`);
      fetchPolicies();
    } catch (err) {
      alert('Chưa kích hoạt được: ' + (err.message || 'Có lỗi xảy ra'));
    }
  };

  const statusFilters = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Bản nháp', value: 'DRAFT' },
    { label: 'Đã báo giá', value: 'QUOTED' },
    { label: 'Đã ký kết', value: 'BOUND' },
    { label: 'Đang hiệu lực', value: 'ACTIVE' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Đã hết hạn', value: 'EXPIRED' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Hợp đồng của tôi"
        subtitle="Tra cứu và theo dõi hợp đồng, phụ lục bổ sung và trạng thái xử lý"
        delay="v2-d1"
        actions={
          <Link to="/buy" className="btn" style={{ background: '#fff', color: 'var(--primary)', padding: '0.75rem 1.25rem', fontWeight: 700, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            <span>Tạo hợp đồng mới</span>
          </Link>
        }
      />

      {/* Advanced Search & Filter Bar */}
      <div className="card v2-anim v2-d2" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Keyword Search */}
            <div style={{ position: 'relative' }}>
              <label className="form-label">Số hợp đồng / tên bên mua</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập số hợp đồng hoặc tên khách hàng, ví dụ: POL-2026-0042"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label">Trạng thái hợp đồng</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
              >
                {statusFilters.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* Min Premium */}
            <div>
              <label className="form-label">Phí tối thiểu (USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Từ"
                value={minPremium}
                onChange={(e) => setMinPremium(e.target.value)}
              />
            </div>

            {/* Max Premium */}
            <div>
              <label className="form-label">Phí tối đa (USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Đến"
                value={maxPremium}
                onChange={(e) => setMaxPremium(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sắp xếp:</span>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 160, padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              >
                <option value="updatedAt">Ngày cập nhật</option>
                <option value="createdAt">Ngày khởi tạo</option>
                <option value="totalPremium">Tổng phí bảo hiểm</option>
                <option value="policyNumber">Số hợp đồng</option>
              </select>

              <select
                className="form-select"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                style={{ width: 120, padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              >
                <option value="DESC">Giảm dần</option>
                <option value="ASC">Tăng dần</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <XCircle size={16} />
                <span>Xóa bộ lọc</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                <Filter size={16} />
                <span>Áp dụng</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Result Count Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Hiển thị <strong>{policies.length}</strong> / <strong>{pageInfo.totalElements}</strong> hợp đồng
        </span>
        <button onClick={fetchPolicies} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
          <RefreshCw size={14} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Policy List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
          <p>Đang tải danh sách hợp đồng...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}>Không tìm thấy hợp đồng nào phù hợp</h3>
          <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Bạn thử nới lỏng điều kiện lọc, hoặc tạo hợp đồng mới.</p>
          <Link to="/buy" className="btn btn-primary">Tạo hợp đồng mới</Link>
        </div>
      ) : (
        <div className="grid-2">
          {policies.map((p) => (
            <div key={p.id || p.policyNumber} className="card v2-card-lift v2-anim" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
                      Phiên bản V{p.version || 1}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>{p.policyNumber}</h3>
                  </div>
                  <StatusBadge status={p.status} />
                  {p.status === 'ACTIVE' && p.expirationDate && (() => {
                    const d = Math.ceil((new Date(p.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return d >= 0 && d <= 30 ? (
                      <span className="status-badge" style={{ marginTop: '0.35rem', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                        <Calendar size={12} />
                        <span>Sắp hết hạn · còn {d} ngày</span>
                      </span>
                    ) : null;
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--secondary)', shrink: 0 }} />
                    <span><strong>Bên mua:</strong> {p.insured?.name || 'N/A'} {p.insured?.email ? `(${p.insured.email})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--accent)', shrink: 0 }} />
                    <span><strong>Số địa điểm:</strong> {p.locations?.length || 0} địa điểm được bảo hiểm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--text-muted)', shrink: 0 }} />
                    <span><strong>Thời hạn bảo hiểm:</strong> {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString('vi-VN') : 'N/A'} - {p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng phí (quy đổi)</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ${p.totalPremium ? p.totalPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USD
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Quick Action for BOUND status */}
                  {p.status === 'BOUND' && isAdmin && (
                    <button
                      onClick={() => handleQuickAdminOfflineActive(p.policyNumber)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderColor: '#10b981', color: '#047857', backgroundColor: '#ecfdf5', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Kích hoạt ngay (đã thu phí trực tiếp)"
                    >
                      <Zap size={14} />
                      <span>Kích hoạt ngay</span>
                    </button>
                  )}

                  {p.status === 'BOUND' && !isAdmin && (
                    <Link
                      to={`/policies/${p.policyNumber}`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', fontWeight: 700, backgroundColor: '#f59e0b', borderColor: '#d97706', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Xem thông tin chuyển khoản và xác nhận thanh toán"
                    >
                      <CreditCard size={14} />
                      <span>Thanh toán phí</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleDownloadExcel(p.policyNumber)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
                    title="Tải bảng phí (Excel)"
                  >
                    <Download size={14} />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePolicy(p.policyNumber)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', borderColor: '#fca5a5', color: '#dc2626' }}
                      title="Xóa hợp đồng"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <Link to={`/policies/${p.policyNumber}`} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                    <span>Chi tiết</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pageInfo.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem' }}
          >
            <ChevronLeft size={18} />
            <span>Trang trước</span>
          </button>

          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
            Trang {page + 1} / {pageInfo.totalPages}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(pageInfo.totalPages - 1, prev + 1))}
            disabled={page >= pageInfo.totalPages - 1}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem' }}
          >
            <span>Trang sau</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
