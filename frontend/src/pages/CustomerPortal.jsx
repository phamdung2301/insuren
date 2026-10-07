import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Plus, Filter, ShieldCheck, MapPin, DollarSign, Calendar, ArrowRight, RefreshCw, ChevronLeft, ChevronRight, XCircle, Download, Trash2, Zap, CreditCard } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
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
      console.error('Lỗi tải danh sách hợp đồng:', err);
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
      alert('Lỗi xóa hợp đồng: ' + err.message);
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
      alert('Lỗi xuất Excel: ' + err.message);
    }
  };

  const handleQuickAdminOfflineActive = async (policyNumber) => {
    if (!window.confirm(`⚡ [Admin] Bạn có chắc chắn muốn kích hoạt ngoại tuyến (ACTIVE) ngay lập tức cho hợp đồng ${policyNumber}? (Xác nhận đã thu phí trực tiếp)`)) return;
    try {
      await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: 'Quản trị viên phê duyệt kích hoạt ngoại tuyến (Offline Payment Confirmed). Đã thu tiền mặt/đối ứng.',
        actor: user?.fullName || 'Quản trị viên (Admin)',
      });
      alert(`⚡ Đã kích hoạt thành công hợp đồng ${policyNumber} sang trạng thái ACTIVE!`);
      fetchPolicies();
    } catch (err) {
      alert('Kích hoạt ngoại tuyến thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const statusFilters = [
    { label: 'Tất cả trạng thái vòng đời', value: '' },
    { label: 'DRAFT - Đơn nháp', value: 'DRAFT' },
    { label: 'QUOTED - Đã báo phí', value: 'QUOTED' },
    { label: 'BOUND - Đã cam kết', value: 'BOUND' },
    { label: 'ACTIVE - Đang hiệu lực', value: 'ACTIVE' },
    { label: 'CANCELLED - Đã hủy đơn', value: 'CANCELLED' },
    { label: 'EXPIRED - Đã hết hạn', value: 'EXPIRED' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Sổ Tay Quản Lý Đơn Bảo Hiểm</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Tra cứu, theo dõi tiến độ cấp đơn, quy trình điều chỉnh phụ lục và trạng thái hợp đồng</p>
        </div>
        <Link to="/buy" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          <Plus size={18} />
          <span>Yêu Cầu Cấp Đơn Mới</span>
        </Link>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Keyword Search */}
            <div style={{ position: 'relative' }}>
              <label className="form-label">Mã Hợp đồng / Tên Bên mua</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập POL-... hoặc tên khách hàng"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label">Trạng thái Hợp đồng</label>
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
              <label className="form-label">Phí tối thiểu ($ USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Từ $ USD"
                value={minPremium}
                onChange={(e) => setMinPremium(e.target.value)}
              />
            </div>

            {/* Max Premium */}
            <div>
              <label className="form-label">Phí tối đa ($ USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Đến $ USD"
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
                <option value="policyNumber">Mã số Hợp đồng</option>
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
                <span>Áp dụng Lọc</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Result Count Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Hiển thị <strong>{policies.length}</strong> / <strong>{pageInfo.totalElements}</strong> hợp đồng bảo hiểm
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
          <p>Đang truy vấn MongoDB Aggregation & Indexing...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}>Không tìm thấy Đơn bảo hiểm thỏa điều kiện</h3>
          <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Vui lòng kiểm tra lại bộ lọc hoặc tạo một Yêu cầu Cấp đơn mới.</p>
          <Link to="/buy" className="btn btn-primary">Tạo Đơn Bảo Hiểm Ngay</Link>
        </div>
      ) : (
        <div className="grid-2">
          {policies.map((p) => (
            <div key={p.id || p.policyNumber} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease-in-out' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
                      Phiên bản V{p.version || 1}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>{p.policyNumber}</h3>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--secondary)', shrink: 0 }} />
                    <span><strong>Bên mua BH:</strong> {p.insured?.name || 'N/A'} {p.insured?.email ? `(${p.insured.email})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--accent)', shrink: 0 }} />
                    <span><strong>Quy mô:</strong> {p.locations?.length || 0} Địa điểm bảo hiểm kê khai</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--text-muted)', shrink: 0 }} />
                    <span><strong>Thời hạn bảo hiểm:</strong> {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString('vi-VN') : 'N/A'} - {p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng phí bảo hiểm quy đổi</span>
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
                      title="Kích hoạt ngoại tuyến ngay lập tức (Offline Approval)"
                    >
                      <Zap size={14} />
                      <span>Kích Hoạt (Offline)</span>
                    </button>
                  )}

                  {p.status === 'BOUND' && !isAdmin && (
                    <Link
                      to={`/policies/${p.policyNumber}`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', fontWeight: 700, backgroundColor: '#f59e0b', borderColor: '#d97706', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Xem thông tin chuyển khoản & Xác nhận thanh toán"
                    >
                      <CreditCard size={14} />
                      <span>Thanh Toán Phí</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleDownloadExcel(p.policyNumber)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
                    title="Xuất Excel tính phí"
                  >
                    <Download size={14} />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePolicy(p.policyNumber)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', borderColor: '#fca5a5', color: '#dc2626' }}
                      title="Xóa hợp đồng (Admin)"
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
