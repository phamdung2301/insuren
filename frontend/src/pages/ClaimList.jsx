import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import ClaimCreateModal from '../components/ClaimCreateModal';
import claimApi, { claimStatusLabels } from '../api/claimApi';

export const ClaimList = ({ user, isAdmin }) => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await claimApi.listClaims(params);
      const content = res?.content || (Array.isArray(res) ? res : []);
      setClaims(content);
      setPageInfo({ totalPages: res?.totalPages || 0, totalElements: res?.totalElements || content.length });
    } catch (err) {
      console.error('Không tải được danh sách bồi thường:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const applyFilter = () => { setPage(0); fetchClaims(); };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader
        title="Yêu cầu bồi thường"
        subtitle={isAdmin ? 'Tiếp nhận và xử lý yêu cầu bồi thường của khách hàng' : 'Gửi và theo dõi yêu cầu bồi thường của bạn'}
        actions={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />
            <span>Gửi yêu cầu bồi thường</span>
          </button>
        }
      />

      <div className="card v2-anim v2-d1" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tìm kiếm</label>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                placeholder="Số yêu cầu, tên người yêu cầu..."
                style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Trạng thái</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} style={{ marginTop: '0.25rem', padding: '0.6rem 0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(claimStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-outline" onClick={() => fetchClaims()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      <div className="card v2-anim v2-d2" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</p>
        ) : claims.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Chưa có yêu cầu bồi thường nào</p>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.2rem' }}>Bạn bấm nút bên dưới để gửi yêu cầu đầu tiên.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> <span>Gửi yêu cầu bồi thường</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Số yêu cầu</th>
                  <th>Số hợp đồng</th>
                  <th>Người yêu cầu</th>
                  <th style={{ textAlign: 'right' }}>Số tiền (USD)</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.claimNumber} onClick={() => navigate(`/claims/${c.claimNumber}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.claimNumber}</td>
                    <td>{c.policyNumber}</td>
                    <td>{c.claimantName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ${c.claimAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td><ClaimStatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageInfo.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Trang {page + 1} / {pageInfo.totalPages} · {pageInfo.totalElements} yêu cầu
          </span>
          <button className="btn btn-outline" disabled={page >= pageInfo.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ClaimCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        presetPolicyNumber=""
        user={user}
        onCreated={(claimNumber) => { if (claimNumber) navigate(`/claims/${claimNumber}`); else fetchClaims(); }}
      />
    </div>
  );
};

export default ClaimList;
