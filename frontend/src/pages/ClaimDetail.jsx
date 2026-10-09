import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Plus, X, AlertCircle, CheckCircle, Clock, FileText, User, Calendar, DollarSign } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import claimApi, { claimStatusLabels } from '../api/claimApi';

const NEXT_ACTIONS = {
  SUBMITTED: [{ target: 'UNDER_REVIEW', label: 'Tiếp nhận thẩm định', admin: true }],
  UNDER_REVIEW: [
    { target: 'APPROVED', label: 'Duyệt yêu cầu', admin: true },
    { target: 'REJECTED', label: 'Từ chối', admin: true },
  ],
  APPROVED: [{ target: 'PAID', label: 'Xác nhận đã chi trả', admin: true }],
};

export const ClaimDetail = ({ user, isAdmin }) => {
  const { claimNumber } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [docForm, setDocForm] = useState({ fileName: '', fileUrl: '' });
  const [busy, setBusy] = useState(false);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await claimApi.getClaim(claimNumber);
      setClaim(res);
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setMessage({ type: 'error', text: 'Không tải được chi tiết yêu cầu.' });
    } finally {
      setLoading(false);
    }
  }, [claimNumber]);

  useEffect(() => { fetchClaim(); }, [fetchClaim]);

  const handleTransition = async (target) => {
    if (!window.confirm(`Bạn chắc chắn muốn chuyển yêu cầu sang "${claimStatusLabels[target]}"?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await claimApi.transitionStatus(claimNumber, { targetStatus: target, reviewerNote: reviewerNote.trim() || null });
      setClaim(res);
      setReviewerNote('');
      setMessage({ type: 'success', text: `Đã chuyển sang "${claimStatusLabels[target]}".` });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Chưa chuyển được trạng thái, bạn thử lại nhé.' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docForm.fileName.trim()) {
      setMessage({ type: 'error', text: 'Bạn nhập tên file chứng từ nhé.' });
      return;
    }
    setBusy(true);
    try {
      const res = await claimApi.addDocument(claimNumber, docForm.fileName.trim(), docForm.fileUrl.trim() || null);
      setClaim(res);
      setDocForm({ fileName: '', fileUrl: '' });
      setMessage({ type: 'success', text: 'Đã thêm chứng từ.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Chưa thêm được chứng từ, bạn thử lại nhé.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Đang tải chi tiết yêu cầu {claimNumber}...</p>;
  if (notFound) {
    return (
      <div style={{ maxWidth: 700, margin: '3rem auto', textAlign: 'center' }}>
        <h3>Không tìm thấy yêu cầu {claimNumber}</h3>
        <Link to="/claims" className="btn btn-outline" style={{ marginTop: '1rem' }}>← Về danh sách bồi thường</Link>
      </div>
    );
  }
  if (!claim) return null;

  const isOwner = !isAdmin;
  const canCancel = claim.status === 'SUBMITTED' && isOwner;
  const canAddDoc = !['PAID', 'REJECTED', 'CANCELLED'].includes(claim.status);
  const adminActions = isAdmin ? (NEXT_ACTIONS[claim.status] || []) : [];

  const kv = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px dashed var(--border)', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/claims" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1.25rem' }}>
        <ArrowLeft size={18} />
        <span>← Về danh sách bồi thường</span>
      </Link>

      <PageHeader
        title={claim.claimNumber}
        subtitle={`Hợp đồng ${claim.policyNumber} · Gửi ngày ${claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('vi-VN') : 'N/A'}`}
        actions={<ClaimStatusBadge status={claim.status} />}
      />

      {message && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.88rem', marginBottom: '1.25rem',
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={15} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card v2-anim v2-d1">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} style={{ color: 'var(--secondary)' }} /> <span>Người yêu cầu</span>
          </h3>
          {kv('Họ và tên', claim.claimantName)}
          {kv('Số điện thoại', claim.claimantPhone || '—')}
          {kv('Email', claim.claimantEmail || '—')}
        </div>
        <div className="card v2-anim v2-d2">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} /> <span>Sự cố & số tiền</span>
          </h3>
          {kv('Ngày xảy ra', claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString('vi-VN') : 'N/A')}
          {kv('Số tiền yêu cầu', `$${claim.claimAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`)}
          <div style={{ paddingTop: '0.55rem', fontSize: '0.9rem' }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Mô tả</div>
            <div>{claim.description}</div>
          </div>
        </div>
      </div>

      {claim.reviewerNote && (
        <div className="card v2-anim v2-d2" style={{ marginBottom: '1.25rem', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.4rem' }}>Ghi chú của bộ phận thẩm định</h4>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>{claim.reviewerNote}</p>
        </div>
      )}

      <div className="card v2-anim v2-d3" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Paperclip size={18} style={{ color: 'var(--primary)' }} /> <span>Chứng từ đính kèm ({claim.documents?.length || 0})</span>
        </h3>
        {(claim.documents?.length || 0) === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Chưa có chứng từ nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: canAddDoc ? '1rem' : 0 }}>
            {claim.documents.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 600 }}>📎 {d.fileName}</span>
                <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {d.uploadedAt && <span><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />{new Date(d.uploadedAt).toLocaleDateString('vi-VN')}</span>}
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>Mở file</a>}
                </span>
              </div>
            ))}
          </div>
        )}
        {canAddDoc && (
          <form onSubmit={handleAddDocument} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '0.5rem' }}>
            <div style={{ flex: '2 1 180px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tên file *</label>
              <input value={docForm.fileName} onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })} placeholder="VD: bien-ban-giam-dinh.pdf" style={{ width: '100%', marginTop: '0.25rem', padding: '0.55rem 0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }} />
            </div>
            <div style={{ flex: '3 1 220px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Đường dẫn file (URL)</label>
              <input value={docForm.fileUrl} onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} placeholder="https://..." style={{ width: '100%', marginTop: '0.25rem', padding: '0.55rem 0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }} />
            </div>
            <button type="submit" className="btn btn-outline" disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Plus size={15} /> <span>Thêm</span>
            </button>
          </form>
        )}
      </div>

      <div className="card v2-anim v2-d4">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.8rem' }}>Xử lý yêu cầu</h3>
        {adminActions.length === 0 && !canCancel && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {isAdmin
              ? 'Yêu cầu đang ở trạng thái cuối, không còn thao tác nào.'
              : 'Yêu cầu đang được xử lý. Bạn sẽ nhận thông báo khi có cập nhật mới.'}
          </p>
        )}
        {isAdmin && adminActions.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Ghi chú thẩm định (hiển thị cho khách hàng)</label>
            <textarea value={reviewerNote} onChange={(e) => setReviewerNote(e.target.value)} rows={2} placeholder="VD: Đã kiểm tra chứng từ, đủ điều kiện bồi thường..." style={{ width: '100%', marginTop: '0.3rem', padding: '0.6rem 0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', resize: 'vertical' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {adminActions.map((a) => (
            <button
              key={a.target}
              onClick={() => handleTransition(a.target)}
              disabled={busy}
              className={a.target === 'REJECTED' ? 'btn btn-outline' : a.target === 'PAID' ? 'btn btn-primary' : 'btn btn-outline'}
              style={a.target === 'REJECTED' ? { color: '#b91c1c', borderColor: '#fca5a5' } : a.target === 'PAID' ? { backgroundColor: '#059669', borderColor: '#059669' } : {}}
            >
              {a.label}
            </button>
          ))}
          {canCancel && (
            <button onClick={() => handleTransition('CANCELLED')} disabled={busy} className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#fca5a5' }}>
              Hủy yêu cầu này
            </button>
          )}
        </div>
        {canCancel && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem', marginBottom: 0 }}>
            <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
            Bạn có thể hủy yêu cầu khi nó còn ở trạng thái "Đã gửi".
          </p>
        )}
      </div>
    </div>
  );
};

export default ClaimDetail;
