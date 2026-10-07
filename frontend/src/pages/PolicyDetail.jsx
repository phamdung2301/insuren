import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, MapPin, Layers, History, Clock, FileDiff,
  Plus, Trash2, Edit, AlertCircle, CheckCircle, RefreshCw, X, Play,
  AlertTriangle, Download, ArrowRight, Check, Info, Lock, CreditCard, FileCheck,
  QrCode, Zap, Building, Copy
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import policyApi from '../api/policyApi';

export const PolicyDetail = ({ user, isAdmin }) => {
  const { policyNumber } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, location_manage, endorsement, history, versions
  const [history, setHistory] = useState([]);
  const [versionSnapshot, setVersionSnapshot] = useState(null);
  const [selectedVersionNum, setSelectedVersionNum] = useState(1);
  const [availableVersions, setAvailableVersions] = useState([1]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal States for Add Location & Add Coverage (DRAFT only)
  const [isAddLocOpen, setIsAddLocOpen] = useState(false);
  const [newLocAddress, setNewLocAddress] = useState('');

  const [isAddCovOpen, setIsAddCovOpen] = useState(false);
  const [targetLocId, setTargetLocId] = useState('');
  const [newCovData, setNewCovData] = useState({
    coverageCode: 'PROPERTY',
    coverageName: 'Bảo hiểm Tài sản & Cháy nổ (Property Insurance)',
    limit: 1000000,
    deductible: 5000,
    premium: 1500,
  });

  // Transition Verification & Binding/Payment Modal States
  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [bindDueDays, setBindDueDays] = useState(7);
  const [customDueDate, setCustomDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [isPayActiveModalOpen, setIsPayActiveModalOpen] = useState(false);
  const [isAdminOfflineConfirmOpen, setIsAdminOfflineConfirmOpen] = useState(false);
  const [isPayingSimulation, setIsPayingSimulation] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [paymentRef, setPaymentRef] = useState(`PAY-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Endorsement Form State (ACTIVE only)
  const [endorseType, setEndorseType] = useState('ADD_COVERAGE'); // ADD_COVERAGE | REMOVE_COVERAGE | GENERAL
  const [endorseLocId, setEndorseLocId] = useState('');
  const [endorseCovCode, setEndorseCovCode] = useState('CYBER');
  const [endorseCovName, setEndorseCovName] = useState('Bảo hiểm An ninh mạng (Cyber Liability)');
  const [endorseLimit, setEndorseLimit] = useState(1000000);
  const [endorseDeductible, setEndorseDeductible] = useState(5000);
  const [endorsePremium, setEndorsePremium] = useState(800);
  const [endorseDescription, setEndorseDescription] = useState('Bổ sung quyền lợi bảo hiểm Cyber Liability theo yêu cầu khách hàng');

  const coveragePresets = [
    { code: 'CYBER', name: 'Bảo hiểm An ninh mạng (Cyber Liability)', limit: 1000000, deductible: 5000, premium: 800 },
    { code: 'PROPERTY', name: 'Bảo hiểm Tài sản & Cháy nổ (Property All Risks)', limit: 1000000, deductible: 5000, premium: 1500 },
    { code: 'GL', name: 'Trách nhiệm Công cộng (General Liability)', limit: 500000, deductible: 2000, premium: 1000 },
    { code: 'EL', name: 'Trách nhiệm Người sử dụng LĐ (Employer Liability)', limit: 300000, deductible: 1000, premium: 750 },
    { code: 'BI', name: 'Bảo hiểm Gián đoạn Kinh doanh (Business Interruption)', limit: 2000000, deductible: 1000, premium: 2500 },
    { code: 'FLOOD', name: 'Bảo hiểm Rủi ro Ngập lụt (Flood Damage Coverage)', limit: 800000, deductible: 4000, premium: 1200 },
  ];

  const fetchPolicyDetail = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await policyApi.getPolicyByNumber(policyNumber);
      setPolicy(data);

      const maxVer = data.version || 1;
      const vers = [];
      for (let i = 1; i <= maxVer; i++) vers.push(i);
      setAvailableVersions(vers);
      setSelectedVersionNum(maxVer);

      if (data.locations && data.locations.length > 0) {
        setEndorseLocId(data.locations[0].locationId);
      }
    } catch (err) {
      console.error('Không thể nạp chi tiết hợp đồng', err);
      setMessage({ type: 'error', text: err.message || 'Không tìm thấy hợp đồng bảo hiểm trên server' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await policyApi.getPolicyHistory(policyNumber);
      setHistory(data || []);
    } catch (err) {
      console.error('Lỗi tải nhật ký giao dịch', err);
      setHistory([]);
    }
  };

  const fetchVersionSnapshot = async (ver) => {
    try {
      const data = await policyApi.getPolicyVersion(policyNumber, ver);
      setVersionSnapshot(data);
    } catch (err) {
      console.error(`Không thể nạp snapshot version ${ver}`, err);
      setVersionSnapshot(null);
    }
  };

  useEffect(() => {
    fetchPolicyDetail();
  }, [policyNumber]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'versions') fetchVersionSnapshot(selectedVersionNum);
  }, [activeTab, selectedVersionNum]);

  // Lifecycle State Machine Transitions (P06)
  const handleStatusTransition = async (targetStatus, defaultReason = '') => {
    const reason = prompt(`Nhập lý do chuyển trạng thái sang ${targetStatus}:`, defaultReason || `Yêu cầu chuyển đổi sang ${targetStatus}`);
    if (reason === null) return;

    try {
      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus,
        reason,
        actor: user?.fullName || user?.email || (isAdmin ? 'Chuyên viên Bảo Hiểm' : 'Khách hàng'),
      });
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã chuyển thành công trạng thái hợp đồng sang ${targetStatus}` });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chuyển trạng thái thất bại' });
    }
  };

  // Dedicated Handler: QUOTED -> BOUND (Proposal Binding & Payment Due Setting)
  const handleConfirmBind = async (asSimulatedAdmin = false) => {
    if (!agreeTerms && !isAdmin && !asSimulatedAdmin) {
      alert('Vui lòng tích chọn xác nhận cam kết điều khoản giao kết bảo hiểm.');
      return;
    }

    let targetDueDate;
    if (customDueDate) {
      targetDueDate = new Date(customDueDate + 'T23:59:59Z').toISOString();
    } else {
      const d = new Date();
      d.setDate(d.getDate() + Number(bindDueDays || 7));
      targetDueDate = d.toISOString();
    }

    try {
      const actorLabel = isAdmin
        ? 'Quản trị viên (Admin)'
        : (asSimulatedAdmin ? 'Quản trị viên (Phê duyệt đề xuất của Khách hàng)' : (user?.fullName || user?.email || 'Khách hàng (User)'));

      const reasonLabel = isAdmin
        ? `Quản trị viên thiết lập hạn chót thanh toán phí đến ngày ${new Date(targetDueDate).toLocaleDateString('vi-VN')} và chuyển sang BOUND.`
        : (asSimulatedAdmin
            ? `Admin đã phê duyệt đề xuất hạn thanh toán của khách hàng (${bindDueDays} ngày - đến ${new Date(targetDueDate).toLocaleDateString('vi-VN')}). Hợp đồng chuyển sang BOUND.`
            : `Khách hàng chấp thuận bảng phí và đề xuất hạn thanh toán đến ngày ${new Date(targetDueDate).toLocaleDateString('vi-VN')}.`);

      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'BOUND',
        paymentDueDate: targetDueDate,
        reason: reasonLabel,
        actor: actorLabel,
      });

      setPolicy(updated);
      setIsBindModalOpen(false);
      setMessage({
        type: 'success',
        text: `✅ Hợp đồng đã chuyển sang trạng thái BOUND! Hạn chót thanh toán: ${new Date(targetDueDate).toLocaleDateString('vi-VN')}.`
      });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chuyển trạng thái thất bại' });
    }
  };

  // Dedicated Handler: Admin Instant Offline Active
  const handleAdminOfflineActive = async () => {
    try {
      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: 'Quản trị viên phê duyệt kích hoạt ngoại tuyến (Offline Payment Confirmed). Đã thu phí trực tiếp/đối ứng.',
        actor: user?.fullName || 'Quản trị viên (Admin)',
      });
      setPolicy(updated);
      setIsAdminOfflineConfirmOpen(false);
      setMessage({ type: 'success', text: '⚡ Admin đã kích hoạt thành công hợp đồng sang trạng thái ACTIVE (Ngoại tuyến)!' });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Kích hoạt ngoại tuyến thất bại' });
    }
  };

  // Dedicated Handler: BOUND -> ACTIVE (Payment Simulation & Inception Activation)
  const handleConfirmActive = async () => {
    setIsPayingSimulation(true);
    try {
      await new Promise((res) => setTimeout(res, 800)); // simulate banking gateway verification
      const actorLabel = isAdmin ? 'Kế toán / Quản trị viên (Admin)' : (user?.fullName || user?.email || 'Khách hàng (User)');
      const methodLabel = paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản Ngân hàng (Vietcombank)' : 'Thẻ Tín dụng Doanh nghiệp';
      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: `Xác nhận thanh toán phí bảo hiểm thành công qua ${methodLabel}. Mã giao dịch: ${paymentRef}. Kích hoạt hiệu lực hợp đồng.`,
        actor: actorLabel,
      });
      setPolicy(updated);
      setIsPayActiveModalOpen(false);
      setMessage({ type: 'success', text: `🎉 Thanh toán thành công $${policy.totalPremium?.toLocaleString()} USD! Hợp đồng ${policyNumber} đã chính thức ACTIVE (Có hiệu lực bảo vệ)!` });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Kích hoạt hợp đồng thất bại' });
    } finally {
      setIsPayingSimulation(false);
    }
  };

  // Location CRUD Handlers (DRAFT only)
  const handleAddLocationSubmit = async (e) => {
    e.preventDefault();
    if (!newLocAddress) return;

    const newLocId = `LOC-${String((policy.locations?.length || 0) + 1).padStart(2, '0')}`;
    try {
      const updated = await policyApi.addLocation(policyNumber, {
        locationId: newLocId,
        address: newLocAddress,
        coverages: [],
      });
      setPolicy(updated);
      setIsAddLocOpen(false);
      setNewLocAddress('');
      setMessage({ type: 'success', text: `Đã bổ sung Địa điểm mới ${newLocId} thành công vào MongoDB` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi thêm địa điểm' });
    }
  };

  const handleRemoveLocation = async (locationId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Địa điểm ${locationId} khỏi Hợp đồng?`)) return;
    try {
      const updated = await policyApi.removeLocation(policyNumber, locationId);
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã xóa Địa điểm ${locationId} thành công` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xóa địa điểm' });
    }
  };

  // Coverage CRUD Handlers (DRAFT only)
  const handleOpenAddCoverage = (locId) => {
    setTargetLocId(locId);
    setIsAddCovOpen(true);
  };

  const handleAddCoverageSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await policyApi.addCoverage(policyNumber, targetLocId, newCovData);
      setPolicy(updated);
      setIsAddCovOpen(false);
      setMessage({ type: 'success', text: `Đã thêm gói quyền lợi ${newCovData.coverageCode} vào Địa điểm ${targetLocId}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi thêm gói bảo hiểm' });
    }
  };

  const handleRemoveCoverage = async (locationId, coverageCode) => {
    if (!window.confirm(`Xóa gói quyền lợi ${coverageCode} khỏi địa điểm ${locationId}?`)) return;
    try {
      const updated = await policyApi.removeCoverage(policyNumber, locationId, coverageCode);
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã loại bỏ gói ${coverageCode} thành công` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xóa gói quyền lợi' });
    }
  };

  // Endorsement Submit Handler (P07 & P08 & P09)
  const handleEndorsementSubmit = async (e) => {
    e.preventDefault();
    if (!endorseDescription.trim()) {
      alert('Vui lòng nhập mô tả chi tiết nội dung đợt Endorsement');
      return;
    }

    try {
      const payload = {
        endorsementType: endorseType,
        changeDescription: endorseDescription.trim(),
        actor: user?.fullName || user?.email || (isAdmin ? 'Chuyên viên Bảo hiểm' : 'Khách hàng'),
        locationId: endorseLocId || policy.locations?.[0]?.locationId,
      };

      if (endorseType === 'ADD_COVERAGE') {
        payload.coverage = {
          coverageCode: endorseCovCode,
          coverageName: endorseCovName,
          coverageType: 'STANDARD',
          limit: Number(endorseLimit),
          deductible: Number(endorseDeductible),
          premium: Number(endorsePremium),
          termMonths: 12,
        };
      } else if (endorseType === 'REMOVE_COVERAGE') {
        payload.coverageCode = endorseCovCode;
      }

      const updated = await policyApi.endorsePolicy(policyNumber, payload);
      setPolicy(updated);
      setMessage({
        type: 'success',
        text: `Thực thi Endorsement thành công! Đã tạo Snapshot V${updated.version - 1}, nâng cấp Hợp đồng lên V${updated.version}, cập nhật Tổng phí mới $${updated.totalPremium?.toLocaleString()} USD`
      });

      // Update available versions
      const vers = [];
      for (let i = 1; i <= updated.version; i++) vers.push(i);
      setAvailableVersions(vers);
      setSelectedVersionNum(updated.version);

      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Thực thi Endorsement thất bại' });
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await policyApi.downloadPolicyExcel(policyNumber);
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PremiumCalc_${policyNumber}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi tải file Excel: ' + (err.message || 'Lỗi server'));
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
      <p>Đang tải chi tiết Đơn bảo hiểm {policyNumber}...</p>
    </div>
  );

  if (!policy) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <AlertTriangle size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
      <h3>Không tìm thấy dữ liệu Đơn bảo hiểm {policyNumber}</h3>
      <Link to="/my-policies" className="btn btn-primary" style={{ marginTop: '1rem' }}>Quay lại danh sách</Link>
    </div>
  );

  const lifecycleStages = [
    { key: 'DRAFT', label: '1. DRAFT', desc: 'Đang tạo, chỉnh sửa' },
    { key: 'QUOTED', label: '2. QUOTED', desc: 'Đã báo phí' },
    { key: 'BOUND', label: '3. BOUND', desc: 'Hai bên cam kết' },
    { key: 'ACTIVE', label: '4. ACTIVE', desc: 'Có hiệu lực' },
    { key: 'CANCELLED', label: '5. CANCELLED / EXPIRED', desc: 'Chấm dứt/Hết hạn' },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'QUOTED': return 1;
      case 'BOUND': return 2;
      case 'ACTIVE': return 3;
      case 'CANCELLED':
      case 'EXPIRED': return 4;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(policy.status);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Back Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/my-policies" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <ArrowLeft size={18} />
          <span>Quay lại Danh sách Đơn bảo hiểm</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleDownloadExcel} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} />
            <span>Xuất Bảng Phí Excel (.xlsx)</span>
          </button>
          <button onClick={fetchPolicyDetail} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Policy Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{policy.policyNumber}</h1>
              <span className="brand-badge" style={{ fontSize: '0.85rem', backgroundColor: 'var(--primary)', color: 'white' }}>
                CURRENT STATE V{policy.version}
              </span>
              <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 700, color: '#475569' }}>
                {policy.insured?.type === 'BUSINESS' ? 'DOANH NGHIỆP (BUSINESS)' : 'CÁ NHÂN (INDIVIDUAL)'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.3rem 0 0' }}>
              Bên mua bảo hiểm: <strong>{policy.insured?.name}</strong> [{policy.insured?.insuredId || 'INS-001'}] — {policy.insured?.email} | ĐT: {policy.insured?.phone || 'N/A'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <StatusBadge status={policy.status} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Premium = SUM(Coverages)
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>
                ${policy.totalPremium ? policy.totalPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USD
              </div>
            </div>
          </div>
        </div>

        {/* Visual Lifecycle State Machine Progress Bar */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            {lifecycleStages.map((st, idx) => {
              const isPast = currentStageIdx > idx;
              const isCurrent = currentStageIdx === idx;
              const isTerminal = idx === 4 && (policy.status === 'CANCELLED' || policy.status === 'EXPIRED');

              return (
                <div key={st.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--primary)' : isPast ? 'var(--secondary)' : isTerminal ? '#ef4444' : '#e2e8f0',
                    color: (isCurrent || isPast || isTerminal) ? 'white' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {isPast ? <Check size={18} /> : (idx + 1)}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary)' : '#64748b', marginTop: '0.35rem' }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notification Toast Message */}
      {message.text && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
          fontWeight: 600
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ flex: 1 }}>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs Navigation Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '1. Vòng Đời & Nghiệp Vụ', icon: ShieldCheck },
          { id: 'location_manage', label: '2. Địa Điểm & Quyền Lợi', icon: MapPin },
          { id: 'endorsement', label: '3. Điều Chỉnh Endorsement', icon: FileDiff },
          { id: 'history', label: '4. Vết Giao Dịch Audit Trail', icon: History },
          { id: 'versions', label: '5. Tra Cứu Snapshot Vers', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.2rem',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW & STATE MACHINE LIFECYCLE ─── */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Insured Profile Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>
              1. Thông Tin Đối Tượng Bảo Hiểm (Insured)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <p><strong>Mã Insured ID:</strong> <span className="brand-badge">{policy.insured?.insuredId || 'INS-001'}</span></p>
              <p><strong>Loại đối tượng:</strong> {policy.insured?.type === 'BUSINESS' ? 'Doanh nghiệp (BUSINESS)' : 'Cá nhân (INDIVIDUAL)'}</p>
              <p><strong>Tên Bên mua:</strong> {policy.insured?.name}</p>
              <p><strong>Gmail nhận hợp đồng:</strong> {policy.insured?.email}</p>
              <p><strong>Số điện thoại:</strong> {policy.insured?.phone || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ trụ sở:</strong> {policy.insured?.address || 'Chưa cập nhật'}</p>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ngày bắt đầu hiệu lực: <strong>{policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('vi-VN') : 'N/A'}</strong><br />
                Ngày kết thúc bảo hiểm: <strong>{policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString('vi-VN') : 'N/A'}</strong>
              </p>
            </div>
          </div>

          {/* State Machine Transition Engine */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary)' }}>
              2. Chuyển Đổi Vòng Đời Hợp Đồng (P06 State Machine)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Trạng thái hiện thời: <StatusBadge status={policy.status} /> (Không được tự do PUT đổi status, phải qua endpoint chuyển đổi có kiểm tra tính hợp lệ).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {policy.status === 'DRAFT' && (
                <div>
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--primary)', marginBottom: '0.65rem' }}>
                    <Info size={15} style={{ display: 'inline', marginRight: 6 }} />
                    <strong>Giai đoạn Soạn thảo (DRAFT):</strong> Hợp đồng đang tạo hoặc lưu nháp. Khách hàng hoặc Chuyên viên có thể bấm nút bên dưới để chốt định phí chính thức.
                  </div>
                  <button onClick={() => handleStatusTransition('QUOTED', 'Tính toán định phí bảo hiểm chính thức cho đơn nháp')} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                    <Play size={16} />
                    <span>Bước 2: Phê Duyệt Báo Phí (DRAFT ➔ QUOTED)</span>
                  </button>
                </div>
              )}

              {policy.status === 'QUOTED' && (
                <div>
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', marginBottom: '0.65rem' }}>
                    <Info size={15} style={{ display: 'inline', marginRight: 6 }} />
                    <strong>Giai đoạn Báo Phí (QUOTED):</strong> Bảng phí đã hoàn tất ($<strong>{policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong>). Thẩm quyền bước này thuộc về <strong>Khách hàng (User)</strong> để chấp thuận bảng phí & cam kết giao kết hợp đồng.
                  </div>
                  <button onClick={() => { setAgreeTerms(false); setIsBindModalOpen(true); }} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                    <FileCheck size={16} />
                    <span>Bước 3: Khách Hàng Đồng Ý & Cam Kết (QUOTED ➔ BOUND)</span>
                  </button>
                </div>
              )}

              {policy.status === 'BOUND' && (() => {
                const isOverdue = policy.paymentDueDate && new Date(policy.paymentDueDate) < new Date();
                const diffMs = policy.paymentDueDate ? (new Date(policy.paymentDueDate) - new Date()) : 0;
                const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                return (
                  <div>
                    <div style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: isOverdue ? '#fef2f2' : '#fef3c7',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isOverdue ? '#fca5a5' : '#fde68a'}`,
                      fontSize: '0.85rem',
                      color: isOverdue ? '#991b1b' : '#92400e',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                        {isOverdue ? <AlertTriangle size={18} style={{ color: '#dc2626' }} /> : <Clock size={18} />}
                        <span>{isOverdue ? '⚠️ CẢNH BÁO: ĐÃ QUÁ HẠN THANH TOÁN PHÍ BẢO HIỂM' : '⏳ CHỜ THANH TOÁN PHÍ BẢO HIỂM (BOUND)'}</span>
                      </div>
                      <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem' }}>
                        Cần hoàn tất nộp phí <strong>${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong> để hợp đồng chính thức kích hoạt quyền lợi bảo hiểm.
                      </p>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, display: 'flex', flexWrap: 'wrap', gap: '1rem', borderTop: '1px dashed currentColor', paddingTop: '0.35rem' }}>
                        <span>Ngày cam kết: <strong>{policy.boundDate ? new Date(policy.boundDate).toLocaleDateString('vi-VN') : 'Mới ghi nhận'}</strong></span>
                        <span>Hạn chót thanh toán: <strong>{policy.paymentDueDate ? new Date(policy.paymentDueDate).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}</strong></span>
                        <span>Tình trạng: <strong style={{ color: isOverdue ? '#dc2626' : '#047857' }}>{isOverdue ? 'HẾT HẠN (Có thể bị hủy)' : `Còn ${daysRemaining} ngày`}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* User Action: Open Payment Gateway & QR Transfer Modal */}
                      <button
                        onClick={() => setIsPayActiveModalOpen(true)}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                      >
                        <CreditCard size={18} />
                        <span>Thanh Toán Phí Bảo Hiểm & Kích Hoạt (Xem Mã Chuyển Khoản)</span>
                      </button>

                      {/* Admin Action: Instant Offline Activation */}
                      {isAdmin && (
                        <button
                          onClick={() => setIsAdminOfflineConfirmOpen(true)}
                          className="btn btn-outline"
                          style={{ width: '100%', padding: '0.75rem', borderColor: '#10b981', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, backgroundColor: '#ecfdf5' }}
                        >
                          <Zap size={18} />
                          <span>Admin Kích Hoạt Ngoại Tuyến Ngay Lập Tức (Offline Approval)</span>
                        </button>
                      )}

                      {/* Overdue or Admin Cancel Option */}
                      {(isOverdue || isAdmin) && (
                        <button
                          onClick={() => handleStatusTransition('CANCELLED', 'Hủy bỏ hợp đồng do quá hạn nộp phí bảo hiểm (Payment Due Expired)')}
                          className="btn btn-danger"
                          style={{ width: '100%', padding: '0.6rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <AlertTriangle size={15} />
                          <span>Hủy Hợp Đồng Do Quá Thời Hạn Nộp Phí (BOUND ➔ CANCELLED)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {policy.status === 'ACTIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534' }}>
                    <CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Hợp đồng đang có hiệu lực (ACTIVE). Muốn thay đổi Quyền lợi/Phí, vui lòng chuyển sang tab <strong>"3. Điều Chỉnh Endorsement"</strong>.
                  </div>
                  <button onClick={() => handleStatusTransition('CANCELLED', 'Khách hàng đề nghị hủy bỏ trước thời hạn')} className="btn btn-danger" style={{ width: '100%' }}>
                    <span>Hủy Đơn Trước Thời Hạn (ACTIVE ➔ CANCELLED)</span>
                  </button>
                  <button onClick={() => handleStatusTransition('EXPIRED', 'Hết thời hạn bảo hiểm')} className="btn btn-outline" style={{ width: '100%' }}>
                    <span>Đánh Dấu Hết Hạn (ACTIVE ➔ EXPIRED)</span>
                  </button>
                </div>
              )}

              {['CANCELLED', 'EXPIRED'].includes(policy.status) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  Hợp đồng đã ở trạng thái kết thúc ({policy.status}). Không thể thực hiện chuyển đổi vòng đời tiếp theo.
                </p>
              )}
            </div>
          </div>

          {/* ─── MODAL 1: BIND CONFIRMATION MODAL (QUOTED -> BOUND) ─── */}
          {isBindModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
              <div className="card" style={{ maxWidth: 620, width: '100%', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '92vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FileCheck size={20} />
                    <span>{isAdmin ? 'Admin Thiết Lập Hạn Chót & Chuyển BOUND' : 'Cam Kết Giao Kết & Đề Xuất Hạn Nộp Phí (BOUND)'}</span>
                  </h4>
                  <button onClick={() => setIsBindModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Bên mua bảo hiểm:</strong> {policy.insured?.name} ({policy.insured?.type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'})</p>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Mã hợp đồng:</strong> {policy.policyNumber}</p>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Tổng số địa điểm:</strong> {policy.locations?.length || 0} địa điểm</p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Tổng Phí Cam Kết:</span>
                    <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
                      ${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </strong>
                  </div>
                </div>

                {/* Due Date Configuration Section */}
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={16} style={{ color: '#166534' }} />
                    <strong style={{ fontSize: '0.9rem', color: '#166534' }}>
                      {isAdmin ? 'Thiết lập Hạn chót thanh toán chính thức (Admin Direct):' : 'Đề xuất Thời hạn thanh toán phí bảo hiểm (Payment Due):'}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.75rem 0' }}>
                    {isAdmin
                      ? 'Là Quản trị viên, bạn có quyền ấn định chính xác ngày hết hạn nộp phí. Nếu quá ngày này, đơn sẽ bị hủy.'
                      : 'Doanh nghiệp có thể đề xuất số ngày cần thiết để trình ký kế toán và chuyển khoản phí.'}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {[3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setBindDueDays(days);
                          const d = new Date();
                          d.setDate(d.getDate() + days);
                          setCustomDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="btn"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: bindDueDays === days ? 'var(--primary)' : 'white',
                          color: bindDueDays === days ? 'white' : 'var(--text-main)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        +{days} Ngày
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Hạn chót chính xác:</label>
                    <input
                      type="date"
                      value={customDueDate}
                      onChange={(e) => {
                        setCustomDueDate(e.target.value);
                        setBindDueDays(0);
                      }}
                      className="form-input"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 170 }}
                    />
                  </div>
                </div>

                {/* Agreement Checkbox */}
                {!isAdmin && (
                  <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
                    <label style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        style={{ marginTop: 3, width: 16, height: 16 }}
                      />
                      <span>
                        <strong>Cam kết của Khách hàng:</strong> Tôi xác nhận thông tin kê khai là chính xác, đồng ý với bảng quyền lợi & mức phí, cam kết thanh toán trước ngày <strong>{new Date(customDueDate).toLocaleDateString('vi-VN')}</strong>.
                      </span>
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => setIsBindModalOpen(false)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                    Hủy bỏ
                  </button>

                  {/* USER: Normal Submit or Simulated Admin Approve */}
                  {!isAdmin ? (
                    <>
                      <button
                        onClick={() => handleConfirmBind(false)}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 1.1rem', fontWeight: 700 }}
                        disabled={!agreeTerms}
                      >
                        <FileCheck size={16} />
                        <span>Gửi Đề Xuất Hạn Nộp Phí (BOUND)</span>
                      </button>

                      <button
                        onClick={() => handleConfirmBind(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontWeight: 700, backgroundColor: '#7c3aed', borderColor: '#6d28d9' }}
                        title="Mô phỏng Admin phê duyệt ngay đề xuất ngày hết hạn để phục vụ kiểm thử"
                      >
                        <Zap size={16} />
                        <span>⚡ Giả Lập Admin Phê Duyệt Ngay (Demo Chuyển BOUND)</span>
                      </button>
                    </>
                  ) : (
                    /* ADMIN: Direct Apply */
                    <button
                      onClick={() => handleConfirmBind(false)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1.25rem', fontWeight: 700, backgroundColor: '#10b981', borderColor: '#059669' }}
                    >
                      <Zap size={16} />
                      <span>⚡ Admin Thiết Lập Hạn Chót & Chuyển BOUND</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── MODAL 2: USER PAYMENT GATEWAY & BANKING INFO (BOUND -> ACTIVE) ─── */}
          {isPayActiveModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
              <div className="card" style={{ maxWidth: 640, width: '100%', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '92vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <CreditCard size={22} />
                    <span>Cổng Thanh Toán Phí Bảo Hiểm Trực Tuyến</span>
                  </h4>
                  <button onClick={() => setIsPayActiveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Amount to pay banner */}
                <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Số tiền phí bảo hiểm cần thanh toán</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
                      ${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quy đổi ước tính (Tỷ giá VCB)</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>
                      ~{((policy.totalPremium || 0) * 25450).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>

                {/* Bank Account Info Card with QR Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={16} /> Thông Tin Chuyển Khoản Doanh Nghiệp
                    </h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ngân Hàng Thụ Hưởng:</span>
                        <strong style={{ color: '#0f172a' }}>VIETCOMBANK (Ngân Hàng Ngoại Thương)</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Số Tài Khoản Nhận Phí:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--primary)', letterSpacing: '0.5px' }}>1903 8888 6666 99</strong>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard?.writeText('19038888666699'); setCopiedBank(true); setTimeout(() => setCopiedBank(false), 2000); }}
                            className="btn btn-outline"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
                          >
                            <Copy size={12} /> {copiedBank ? 'Đã chép!' : 'Sao chép'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Tên Chủ Tài Khoản:</span>
                        <strong style={{ color: '#0f172a' }}>CONG TY CP BAO HIEM DOANH NGHIEP INSURTECH</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Nội Dung Bắt Buộc:</span>
                        <code style={{ padding: '0.2rem 0.5rem', backgroundColor: '#e2e8f0', borderRadius: 4, fontWeight: 700, color: 'var(--primary)' }}>
                          THANH TOAN {policy.policyNumber}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Mock QR Visual */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <div style={{ width: 110, height: 110, backgroundColor: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #94a3b8', marginBottom: '0.5rem' }}>
                      <QrCode size={70} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>VIETQR CHUYỂN NHANH</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Quét bằng ứng dụng Ngân hàng</span>
                  </div>
                </div>

                {/* Simulation Notice */}
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', marginBottom: '1.25rem' }}>
                  <Info size={16} style={{ display: 'inline', marginRight: 6 }} />
                  <strong>Cơ chế kiểm thử / Demo:</strong> Khách hàng có thể bấm nút <strong>"Giả Lập Đã Thanh Toán & Kích Hoạt"</strong> bên dưới. Hệ thống sẽ mô phỏng tín hiệu Webhook xác nhận từ ngân hàng và chuyển hợp đồng sang <strong>ACTIVE</strong> ngay lập tức!
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsPayActiveModalOpen(false)} className="btn btn-outline" style={{ padding: '0.6rem 1.1rem' }} disabled={isPayingSimulation}>
                    Đóng lại
                  </button>
                  <button
                    onClick={handleConfirmActive}
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={isPayingSimulation}
                  >
                    {isPayingSimulation ? (
                      <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Đang xác thực giao dịch...</span></>
                    ) : (
                      <><Zap size={18} /><span>⚡ Giả Lập Đã Thanh Toán & Kích Hoạt ACTIVE</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── MODAL 3: ADMIN INSTANT OFFLINE ACTIVATION MODAL ─── */}
          {isAdminOfflineConfirmOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
              <div className="card" style={{ maxWidth: 520, width: '100%', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <h4 style={{ color: '#047857', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Zap size={20} />
                    <span>Admin Kích Hoạt Ngoại Tuyến (Offline Approval)</span>
                  </h4>
                  <button onClick={() => setIsAdminOfflineConfirmOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#065f46' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Thao tác đặc quyền Quản trị viên:</strong></p>
                  <p style={{ margin: 0 }}>
                    Bạn đang kích hoạt hiệu lực hợp đồng <strong>{policy.policyNumber}</strong> của khách hàng <strong>{policy.insured?.name}</strong> theo hình thức <strong>Thanh toán Ngoại Tuyến</strong> (tiền mặt tại quầy / ủy nhiệm chi giấy / bảo lãnh ngân hàng).
                  </p>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Số Tiền Phí Xác Nhận Đã Thu:</span>
                  <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
                    ${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsAdminOfflineConfirmOpen(false)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                    Hủy bỏ
                  </button>
                  <button onClick={handleAdminOfflineActive} className="btn btn-primary" style={{ padding: '0.5rem 1.3rem', backgroundColor: '#059669', borderColor: '#059669' }}>
                    <CheckCircle size={16} />
                    <span>Xác Nhận Kích Hoạt ACTIVE Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ATOMIC LOCATION & COVERAGE MANAGEMENT ─── */}
      {activeTab === 'location_manage' && (
        <div>
          {policy.status === 'ACTIVE' ? (
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Lock size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem' }}>
                <strong>Quy tắc nghiệp vụ:</strong> Hợp đồng đang ở trạng thái <strong>ACTIVE</strong>. Không cho phép sửa đổi hoặc xóa trực tiếp Địa điểm/Quyền lợi tại đây. Mọi thay đổi bắt buộc phải thực hiện thông qua <strong>Endorsement (Phụ lục hợp đồng)</strong> ở tab <strong>"3. Điều Chỉnh Endorsement"</strong> để bảo toàn lịch sử và tạo Snapshot phiên bản mới.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Kê Khai Địa Điểm & Quyền Lợi (P04, P05)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cập nhật vị trí nhà xưởng/kho hàng và các gói quyền lợi bảo hiểm (Chỉ áp dụng khi Hợp đồng ở trạng thái DRAFT)</p>
              </div>
              <button onClick={() => setIsAddLocOpen(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={16} />
                <span>Thêm Địa Điểm Mới</span>
              </button>
            </div>
          )}

          {/* Modal Add Location (DRAFT) */}
          {isAddLocOpen && policy.status === 'DRAFT' && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-light)', border: '2px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>Kê Khai Địa Điểm Bảo Hiểm Mới</h4>
              <form onSubmit={handleAddLocationSubmit}>
                <div className="form-group">
                  <label className="form-label">Địa chỉ Chi tiết Nhà xưởng / Kho hàng / Văn phòng</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Lô C2, KCN Cát Lái, Q.2, TP. Hồ Chí Minh"
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsAddLocOpen(false)} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>Hủy bỏ</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Lưu Địa Điểm Mới</button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Add Coverage (DRAFT) */}
          {isAddCovOpen && policy.status === 'DRAFT' && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--secondary-light)', border: '2px solid var(--secondary)' }}>
              <h4 style={{ color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.75rem' }}>Bổ Sung Gói Quyền Lợi Bảo Hiểm cho Địa điểm {targetLocId}</h4>
              <form onSubmit={handleAddCoverageSubmit}>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Chọn Gói Bảo Hiểm Mẫu</label>
                    <select
                      className="form-select"
                      onChange={(e) => {
                        const selected = coveragePresets.find(p => p.code === e.target.value);
                        if (selected) {
                          setNewCovData({
                            coverageCode: selected.code,
                            coverageName: selected.name,
                            limit: selected.limit,
                            deductible: selected.deductible,
                            premium: selected.premium,
                          });
                        }
                      }}
                    >
                      {coveragePresets.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Mã Quyền Lợi (Coverage Code)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCovData.coverageCode}
                      onChange={(e) => setNewCovData({ ...newCovData, coverageCode: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Hạn Mức Tối Đa (Limit $ USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCovData.limit}
                      onChange={(e) => setNewCovData({ ...newCovData, limit: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Mức Miễn Trừ (Deductible $ USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCovData.deductible}
                      onChange={(e) => setNewCovData({ ...newCovData, deductible: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Phí Bảo Hiểm (Coverage Premium $ USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCovData.premium}
                      onChange={(e) => setNewCovData({ ...newCovData, premium: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsAddCovOpen(false)} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>Hủy bỏ</button>
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>+ Bổ Sung Quyền Lợi</button>
                </div>
              </form>
            </div>
          )}

          {/* Locations Card List */}
          {policy.locations?.map((loc) => (
            <div key={loc.locationId} className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>MÃ ĐỊA ĐIỂM: {loc.locationId}</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>{loc.address}</h4>
                </div>
                {policy.status === 'DRAFT' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenAddCoverage(loc.locationId)} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      <Plus size={14} />
                      <span>Thêm Gói Bảo Hiểm</span>
                    </button>
                    <button onClick={() => handleRemoveLocation(loc.locationId)} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}>
                      <Trash2 size={14} />
                      <span>Xóa Địa Điểm</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Coverages Table */}
              {(!loc.coverages || loc.coverages.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  Chưa kê khai gói quyền lợi bảo hiểm nào cho địa điểm này.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã Quyền Lợi</th>
                        <th>Tên Quyền Lợi Bảo Hiểm</th>
                        <th>Hạn Mức Bồi Thường (Limit)</th>
                        <th>Mức Miễn Trừ (Deductible)</th>
                        <th style={{ textAlign: 'right' }}>Phí Bảo Hiểm ($USD)</th>
                        {policy.status === 'DRAFT' && <th>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loc.coverages.map((c) => (
                        <tr key={c.coverageCode}>
                          <td><strong style={{ color: 'var(--secondary)' }}>{c.coverageCode}</strong></td>
                          <td>{c.coverageName}</td>
                          <td>${c.limit?.toLocaleString()} USD</td>
                          <td>${c.deductible?.toLocaleString()} USD</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'right' }}>
                            ${c.premium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                          </td>
                          {policy.status === 'DRAFT' && (
                            <td>
                              <button
                                onClick={() => handleRemoveCoverage(loc.locationId, c.coverageCode)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                title="Loại bỏ gói quyền lợi"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 3: ENDORSEMENT ENGINE (P07 & P08 & P09) ─── */}
      {activeTab === 'endorsement' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                Đợt Điều Chỉnh Phụ Lục Hợp Đồng (Endorsement Engine)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                Endorsement áp dụng trên hợp đồng <strong>ACTIVE</strong>: Tự động lưu <strong>Snapshot Version hiện tại (V{policy.version})</strong>, thực hiện sửa đổi, tính lại <strong>Total Premium = SUM(Coverages)</strong>, và nâng cấp hợp đồng lên <strong>Version V{policy.version + 1}</strong>.
              </p>
            </div>
            <span className="brand-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem' }}>
              CURRENT: V{policy.version} ➔ NEXT: V{policy.version + 1}
            </span>
          </div>

          {policy.status !== 'ACTIVE' ? (
            <div style={{ padding: '1.25rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
              <AlertTriangle size={20} style={{ display: 'inline', marginRight: 8 }} />
              <strong>Chưa thể thực hiện Endorsement:</strong> Hợp đồng hiện đang ở trạng thái <strong>{policy.status}</strong>. Endorsement chỉ được phép áp dụng khi hợp đồng đang có hiệu lực (<strong>ACTIVE</strong>).
            </div>
          ) : (
            <form onSubmit={handleEndorsementSubmit}>
              {/* Select Endorsement Operation Type */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>1. Loại Điều Chỉnh Phụ Lục (Endorsement Type)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { id: 'ADD_COVERAGE', title: '+ Thêm Quyền Lợi Mới', desc: 'Bổ sung bảo hiểm mới (VD: Cyber Liability)' },
                    { id: 'REMOVE_COVERAGE', title: '- Loại Bỏ Quyền Lợi', desc: 'Hủy bỏ một gói bảo hiểm hiện có' },
                    { id: 'GENERAL', title: 'Phụ Lục Điều Khoản Chung', desc: 'Ghi nhận điều chỉnh hợp đồng khác' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setEndorseType(t.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: endorseType === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: endorseType === t.id ? 'var(--primary-light)' : 'var(--bg-main)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: endorseType === t.id ? 'var(--primary)' : 'var(--text-main)', margin: '0 0 0.25rem' }}>
                        {t.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endorsement Details based on Type */}
              {endorseType === 'ADD_COVERAGE' && (
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
                    2. Chi Tiết Gói Quyền Lợi Cần Bổ Sung
                  </h4>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Địa Điểm Áp Dụng</label>
                      <select className="form-select" value={endorseLocId} onChange={(e) => setEndorseLocId(e.target.value)}>
                        {policy.locations?.map((l) => (
                          <option key={l.locationId} value={l.locationId}>{l.locationId} - {l.address}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Chọn Gói Quyền Lợi Mẫu</label>
                      <select
                        className="form-select"
                        value={endorseCovCode}
                        onChange={(e) => {
                          const p = coveragePresets.find(pr => pr.code === e.target.value);
                          if (p) {
                            setEndorseCovCode(p.code);
                            setEndorseCovName(p.name);
                            setEndorseLimit(p.limit);
                            setEndorseDeductible(p.deductible);
                            setEndorsePremium(p.premium);
                            setEndorseDescription(`Bổ sung gói bảo hiểm ${p.name} cho ${endorseLocId || 'địa điểm'}`);
                          }
                        }}
                      >
                        {coveragePresets.map(p => (
                          <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hạn Mức Bồi Thường ($USD)</label>
                      <input type="number" className="form-input" value={endorseLimit} onChange={(e) => setEndorseLimit(Number(e.target.value))} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phí Bảo Hiểm Cần Tăng Thêm ($USD)</label>
                      <input type="number" className="form-input" value={endorsePremium} onChange={(e) => setEndorsePremium(Number(e.target.value))} required />
                    </div>
                  </div>
                </div>
              )}

              {endorseType === 'REMOVE_COVERAGE' && (
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
                    2. Chọn Gói Quyền Lợi Cần Loại Bỏ
                  </h4>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Địa Điểm Áp Dụng</label>
                      <select className="form-select" value={endorseLocId} onChange={(e) => setEndorseLocId(e.target.value)}>
                        {policy.locations?.map((l) => (
                          <option key={l.locationId} value={l.locationId}>{l.locationId} - {l.address}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mã Gói Cần Loại Bỏ</label>
                      <select className="form-select" value={endorseCovCode} onChange={(e) => {
                        setEndorseCovCode(e.target.value);
                        setEndorseDescription(`Loại bỏ gói bảo hiểm ${e.target.value} khỏi ${endorseLocId}`);
                      }}>
                        {policy.locations?.find(l => l.locationId === endorseLocId)?.coverages?.map((c) => (
                          <option key={c.coverageCode} value={c.coverageCode}>{c.coverageCode} - {c.coverageName}</option>
                        )) || <option value="">Không có gói nào</option>}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  3. Lý Do / Nội Dung Ghi Nhận Đợt Endorsement <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ví dụ: Bổ sung quyền lợi bảo hiểm Cyber Liability với hạn mức $1,000,000 theo yêu cầu khách hàng."
                  value={endorseDescription}
                  onChange={(e) => setEndorseDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  * Hệ thống sẽ tự động cập nhật Audit Trail và tạo bản lưu Snapshot Version V{policy.version}.
                </span>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
                  <FileDiff size={18} />
                  <span>Thực Thi Endorsement ➔ Nâng Cấp Lên V{policy.version + 1}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 4: AUDIT TRAIL LOGS (P08) ─── */}
      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                Vết Giao Dịch Hợp Đồng (Audit Transaction Log Trail)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lịch sử toàn bộ các sự kiện thay đổi trên Hợp đồng (Immutable Audit Log)
              </p>
            </div>
            <button onClick={fetchHistory} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> Làm mới Log
            </button>
          </div>

          {history.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa ghi nhận giao dịch nào cho hợp đồng này.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Thời gian Giao dịch</th>
                    <th>Loại Giao Dịch (Event Type)</th>
                    <th>Phiên bản</th>
                    <th>Người Thực Hiện (Actor)</th>
                    <th>Chi Tiết Thay Đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {new Date(h.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <span className="brand-badge" style={{
                          backgroundColor: h.transactionType === 'CREATE_POLICY' ? '#0284c7' :
                            h.transactionType === 'STATUS_TRANSITION' ? '#8b5cf6' :
                            h.transactionType === 'ENDORSEMENT' || h.transactionType === 'ADD_COVERAGE' ? '#10b981' :
                            h.transactionType === 'CANCEL_POLICY' ? '#ef4444' : '#64748b',
                          color: 'white',
                          fontWeight: 700
                        }}>
                          {h.transactionType}
                        </span>
                      </td>
                      <td><strong>V{h.version}</strong></td>
                      <td>{h.actor || 'System'}</td>
                      <td>{h.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: VERSION SNAPSHOT INSPECTOR (P08) ─── */}
      {activeTab === 'versions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                Truy Vấn Ảnh Chụp Phiên Bản Lịch Sử Snapshot (P08)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Mỗi khi Endorsement diễn ra, toàn bộ trạng thái Hợp đồng được lưu trữ nguyên vẹn thành Snapshot bất biến trong MongoDB collection <code>policy_versions</code>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, marginRight: '0.5rem' }}>Chọn Snapshot Phiên Bản:</span>
            {availableVersions.map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVersionNum(v)}
                className={`btn ${selectedVersionNum === v ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                Snapshot V{v} {v === policy.version ? '(Hiện Tại)' : ''}
              </button>
            ))}
          </div>

          {versionSnapshot ? (
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                    Ảnh Chụp Snapshot Phiên Bản V{versionSnapshot.version} của {versionSnapshot.policyNumber}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Thời điểm chụp: {new Date(versionSnapshot.createdAt || Date.now()).toLocaleString('vi-VN')} | Người lập: {versionSnapshot.createdBy}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng phí tại Version này</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                    ${versionSnapshot.policySnapshot?.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
              </div>

              {/* Snapshot Details */}
              <div className="grid-2" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <div>
                  <p><strong>Trạng thái lúc chụp:</strong> <StatusBadge status={versionSnapshot.policySnapshot?.status} /></p>
                  <p><strong>Bên mua bảo hiểm:</strong> {versionSnapshot.policySnapshot?.insured?.name}</p>
                </div>
                <div>
                  <p><strong>Số lượng Địa điểm:</strong> {versionSnapshot.policySnapshot?.locations?.length || 0} địa điểm</p>
                  <p><strong>Email:</strong> {versionSnapshot.policySnapshot?.insured?.email}</p>
                </div>
              </div>

              {/* Snapshot Locations & Coverages Table */}
              <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                Chi tiết Địa điểm & Quyền lợi được bảo vệ tại Snapshot V{versionSnapshot.version}:
              </h5>
              {versionSnapshot.policySnapshot?.locations?.map((loc) => (
                <div key={loc.locationId} style={{ marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                    {loc.locationId} — {loc.address}
                  </div>
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Mã Gói</th>
                          <th>Tên Quyền Lợi</th>
                          <th>Hạn Mức</th>
                          <th>Miễn Trừ</th>
                          <th style={{ textAlign: 'right' }}>Phí Bảo Hiểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loc.coverages?.map((c) => (
                          <tr key={c.coverageCode}>
                            <td><strong>{c.coverageCode}</strong></td>
                            <td>{c.coverageName}</td>
                            <td>${c.limit?.toLocaleString()} USD</td>
                            <td>${c.deductible?.toLocaleString()} USD</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                              ${c.premium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang tải snapshot cho Version V{selectedVersionNum}...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PolicyDetail;
