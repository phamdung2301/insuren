import React, { useState, useEffect } from 'react';
import { X, FileWarning, AlertCircle } from 'lucide-react';
import claimApi from '../api/claimApi';
import policyApi from '../api/policyApi';

/**
 * ClaimCreateModal — form gửi yêu cầu bồi thường.
 * Props: open, onClose, onCreated(claimNumber), presetPolicyNumber, user
 */
export const ClaimCreateModal = ({ open, onClose, onCreated, presetPolicyNumber, user }) => {
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [form, setForm] = useState({
    policyNumber: presetPolicyNumber || '',
    incidentDate: '',
    description: '',
    claimAmount: '',
    claimantName: user?.fullName || '',
    claimantPhone: '',
    claimantEmail: user?.email || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      policyNumber: presetPolicyNumber || '',
      incidentDate: '',
      description: '',
      claimAmount: '',
      claimantName: user?.fullName || '',
      claimantPhone: '',
      claimantEmail: user?.email || '',
    });
    setError('');
    const fetchActive = async () => {
      setLoadingPolicies(true);
      try {
        const res = await policyApi.getPolicies({ status: 'ACTIVE', size: 100, sortBy: 'updatedAt', sortDirection: 'DESC' });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setPolicies(list);
      } catch {
        setPolicies([]);
      } finally {
        setLoadingPolicies(false);
      }
    };
    fetchActive();
  }, [open, presetPolicyNumber, user]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.policyNumber) return setError('Bạn chọn hợp đồng cần bồi thường nhé.');
    if (!form.incidentDate) return setError('Bạn chọn ngày xảy ra sự cố nhé.');
    if (new Date(form.incidentDate) > new Date()) return setError('Ngày xảy ra sự cố không thể là ngày trong tương lai.');
    if (!form.description.trim()) return setError('Bạn mô tả ngắn gọn sự cố nhé.');
    if (!form.claimAmount || Number(form.claimAmount) <= 0) return setError('Số tiền yêu cầu phải lớn hơn 0.');
    if (!form.claimantName.trim()) return setError('Bạn nhập tên người yêu cầu nhé.');

    setSubmitting(true);
    try {
      const payload = {
        policyNumber: form.policyNumber,
        incidentDate: new Date(form.incidentDate).toISOString(),
        description: form.description.trim(),
        claimAmount: Number(form.claimAmount),
        claimantName: form.claimantName.trim(),
        claimantPhone: form.claimantPhone.trim() || null,
        claimantEmail: form.claimantEmail.trim() || null,
      };
      const res = await claimApi.createClaim(payload);
      const claimNumber = res?.claimNumber || res?.data?.claimNumber;
      onClose();
      if (onCreated) onCreated(claimNumber);
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa gửi được yêu cầu, bạn thử lại nhé.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' };
  const labelStyle = { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'block' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileWarning size={20} />
            <span>Gửi yêu cầu bồi thường</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.9rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={labelStyle}>Hợp đồng cần bồi thường *</label>
            <select value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} style={inputStyle} disabled={loadingPolicies}>
              <option value="">{loadingPolicies ? 'Đang tải...' : '— Chọn hợp đồng đang hiệu lực —'}</option>
              {policies.map((p) => (
                <option key={p.policyNumber} value={p.policyNumber}>
                  {p.policyNumber} — {p.insured?.name || ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>Ngày xảy ra sự cố *</label>
              <input type="date" value={form.incidentDate} onChange={(e) => set('incidentDate', e.target.value)} style={inputStyle} max={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label style={labelStyle}>Số tiền yêu cầu (USD) *</label>
              <input type="number" min="0" step="0.01" value={form.claimAmount} onChange={(e) => set('claimAmount', e.target.value)} placeholder="VD: 5000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Mô tả sự cố *</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Mô tả ngắn gọn sự cố: thời gian, địa điểm, thiệt hại..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>Người yêu cầu *</label>
              <input value={form.claimantName} onChange={(e) => set('claimantName', e.target.value)} placeholder="Họ và tên" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Số điện thoại</label>
              <input value={form.claimantPhone} onChange={(e) => set('claimantPhone', e.target.value)} placeholder="VD: 0901 234 567" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email liên hệ</label>
            <input type="email" value={form.claimantEmail} onChange={(e) => set('claimantEmail', e.target.value)} placeholder="email@vidu.com" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimCreateModal;
