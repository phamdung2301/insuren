import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, MapPin, Layers, History, Clock, FileDiff,
  Plus, Trash2, Edit, AlertCircle, CheckCircle, RefreshCw, X, Play,
  AlertTriangle, Download, ArrowRight, Check, Info, Lock, CreditCard, FileCheck,
  QrCode, Zap, Building, Copy, FileWarning, Repeat
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ClaimCreateModal from '../components/ClaimCreateModal';
import policyApi from '../api/policyApi';

export const PolicyDetail = ({ user, isAdmin }) => {
  const { policyNumber } = useParams();
  const navigate = useNavigate();
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

  // Claim & Renewal (tính năng mới)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Endorsement Form State (ACTIVE only)
  const [endorseType, setEndorseType] = useState('ADD_COVERAGE'); // ADD_COVERAGE | REMOVE_COVERAGE | GENERAL
  const [endorseLocId, setEndorseLocId] = useState('');
  const [endorseCovCode, setEndorseCovCode] = useState('CYBER');
  const [endorseCovName, setEndorseCovName] = useState('Bảo hiểm An ninh mạng (Cyber Liability)');
  const [endorseLimit, setEndorseLimit] = useState(1000000);
  const [endorseDeductible, setEndorseDeductible] = useState(5000);
  const [endorsePremium, setEndorsePremium] = useState(800);
  const [endorseDescription, setEndorseDescription] = useState('Bổ sung gói an ninh mạng theo yêu cầu khách hàng');

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
      console.error('Không tải được chi tiết hợp đồng', err);
      setMessage({ type: 'error', text: err.message || 'Không tìm thấy hợp đồng này' });
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
        actor: user?.fullName || user?.email || (isAdmin ? 'Chuyên viên bảo hiểm' : 'Khách hàng'),
      });
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã chuyển thành công trạng thái hợp đồng sang ${targetStatus}` });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa chuyển được trạng thái, bạn thử lại nhé' });
    }
  };

  // Dedicated Handler: QUOTED -> BOUND (Proposal Binding & Payment Due Setting)
  const handleConfirmBind = async (asSimulatedAdmin = false) => {
    if (!agreeTerms && !isAdmin && !asSimulatedAdmin) {
      alert('Bạn tích chọn để xác nhận đồng ý với điều khoản hợp đồng nhé.');
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
        ? 'Quản trị viên'
        : (asSimulatedAdmin ? 'Quản trị viên (duyệt đề xuất của khách hàng)' : (user?.fullName || user?.email || 'Khách hàng'));

      const reasonLabel = isAdmin
        ? `Quản trị viên ấn định hạn nộp phí đến ngày ${new Date(targetDueDate).toLocaleDateString('vi-VN')}. Hợp đồng chuyển sang trạng thái Đã ký kết.`
        : (asSimulatedAdmin
            ? `Quản trị viên đã duyệt đề xuất hạn nộp phí của khách hàng (${bindDueDays} ngày - đến ${new Date(targetDueDate).toLocaleDateString('vi-VN')}). Hợp đồng chuyển sang Đã ký kết.`
            : `Khách hàng đồng ý bảng phí và đề xuất hạn nộp phí đến ngày ${new Date(targetDueDate).toLocaleDateString('vi-VN')}.`);

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
        text: `✅ Hợp đồng đã chuyển sang trạng thái Đã ký kết! Hạn nộp phí: ${new Date(targetDueDate).toLocaleDateString('vi-VN')}.`
      });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa chuyển được trạng thái, bạn thử lại nhé' });
    }
  };

  // Dedicated Handler: Admin Instant Offline Active
  const handleAdminOfflineActive = async () => {
    try {
      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: 'Quản trị viên xác nhận đã thu phí trực tiếp và kích hoạt hợp đồng.',
        actor: user?.fullName || 'Quản trị viên',
      });
      setPolicy(updated);
      setIsAdminOfflineConfirmOpen(false);
      setMessage({ type: 'success', text: '⚡ Đã kích hoạt thành công hợp đồng (ngoại tuyến)!' });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa kích hoạt được, bạn thử lại nhé' });
    }
  };

  // Dedicated Handler: BOUND -> ACTIVE (Payment Simulation & Inception Activation)
  const handleConfirmActive = async () => {
    setIsPayingSimulation(true);
    try {
      await new Promise((res) => setTimeout(res, 800)); // simulate banking gateway verification
      const actorLabel = isAdmin ? 'Kế toán / Quản trị viên' : (user?.fullName || user?.email || 'Khách hàng');
      const methodLabel = paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : 'Thẻ tín dụng';
      const updated = await policyApi.transitionStatus(policyNumber, {
        targetStatus: 'ACTIVE',
        reason: `Xác nhận thanh toán phí bảo hiểm thành công qua ${methodLabel}. Mã giao dịch: ${paymentRef}. Kích hoạt hiệu lực hợp đồng.`,
        actor: actorLabel,
      });
      setPolicy(updated);
      setIsPayActiveModalOpen(false);
      setMessage({ type: 'success', text: `🎉 Thanh toán thành công $${policy.totalPremium?.toLocaleString()} USD! Hợp đồng ${policyNumber} đã chính thức có hiệu lực!` });
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa kích hoạt được, bạn thử lại nhé' });
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
      setMessage({ type: 'success', text: `Đã thêm địa điểm ${newLocId}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa thêm được địa điểm, bạn thử lại nhé' });
    }
  };

  const handleRemoveLocation = async (locationId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa địa điểm ${locationId} khỏi hợp đồng?`)) return;
    try {
      const updated = await policyApi.removeLocation(policyNumber, locationId);
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã xóa địa điểm ${locationId}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa xóa được địa điểm, bạn thử lại nhé' });
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
      setMessage({ type: 'success', text: `Đã thêm gói ${newCovData.coverageCode} vào địa điểm ${targetLocId}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa thêm được gói bảo hiểm, bạn thử lại nhé' });
    }
  };

  const handleRemoveCoverage = async (locationId, coverageCode) => {
    if (!window.confirm(`Xóa gói quyền lợi ${coverageCode} khỏi địa điểm ${locationId}?`)) return;
    try {
      const updated = await policyApi.removeCoverage(policyNumber, locationId, coverageCode);
      setPolicy(updated);
      setMessage({ type: 'success', text: `Đã bỏ gói ${coverageCode}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa xóa được gói quyền lợi, bạn thử lại nhé' });
    }
  };

  // Endorsement Submit Handler (P07 & P08 & P09)
  const handleEndorsementSubmit = async (e) => {
    e.preventDefault();
    if (!endorseDescription.trim()) {
      alert('Bạn mô tả ngắn gọn nội dung đợt điều chỉnh nhé');
      return;
    }

    try {
      const payload = {
        endorsementType: endorseType,
        changeDescription: endorseDescription.trim(),
        actor: user?.fullName || user?.email || (isAdmin ? 'Chuyên viên bảo hiểm' : 'Khách hàng'),
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
        text: `Đã lưu đợt điều chỉnh! Hợp đồng lên V${updated.version}, tổng phí mới $${updated.totalPremium?.toLocaleString()} USD`
      });

      // Update available versions
      const vers = [];
      for (let i = 1; i <= updated.version; i++) vers.push(i);
      setAvailableVersions(vers);
      setSelectedVersionNum(updated.version);

      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Chưa lưu được đợt điều chỉnh, bạn thử lại nhé' });
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
      alert('Không tải được file Excel: ' + (err.message || 'Lỗi hệ thống, bạn thử lại sau nhé'));
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
      <p>Đang tải chi tiết hợp đồng {policyNumber}...</p>
    </div>
  );

  if (!policy) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <AlertTriangle size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
      <h3>Không tìm thấy hợp đồng {policyNumber}</h3>
      <Link to="/my-policies" className="btn btn-primary" style={{ marginTop: '1rem' }}>Về danh sách hợp đồng</Link>
    </div>
  );

  const lifecycleStages = [
    { key: 'DRAFT', label: '1. Nháp', desc: 'Đang tạo, chỉnh sửa' },
    { key: 'QUOTED', label: '2. Đã báo giá', desc: 'Đã báo giá' },
    { key: 'BOUND', label: '3. Đã ký kết', desc: 'Hai bên cam kết' },
    { key: 'ACTIVE', label: '4. Đang hiệu lực', desc: 'Đang hiệu lực' },
    { key: 'CANCELLED', label: '5. Kết thúc', desc: 'Đã hủy / Hết hạn' },
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

  // ─── Claim & Renewal helpers (tính năng mới) ───
  const daysToExpiry = policy?.expirationDate
    ? Math.ceil((new Date(policy.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = policy?.status === 'ACTIVE' && daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;
  const canRenew = policy && (policy.status === 'EXPIRED' || (policy.status === 'ACTIVE' && daysToExpiry !== null && daysToExpiry <= 30));

  const handleRenew = async () => {
    if (!window.confirm('Tái tục hợp đồng này? Hệ thống sẽ tạo một hợp đồng nháp mới kế thừa toàn bộ địa điểm và quyền lợi.')) return;
    setRenewing(true);
    try {
      const res = await policyApi.renewPolicy(policyNumber);
      const newNumber = res?.policyNumber || res?.data?.policyNumber;
      if (newNumber) {
        setMessage({ type: 'success', text: `Đã tạo hợp đồng tái tục ${newNumber}. Đang chuyển sang hợp đồng mới...` });
        setTimeout(() => navigate(`/policies/${newNumber}`), 800);
      } else {
        fetchPolicyDetail();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Chưa tái tục được, bạn thử lại nhé.' });
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Back Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/my-policies" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <ArrowLeft size={18} />
          <span>← Về danh sách hợp đồng</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleDownloadExcel} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} />
            <span>Tải bảng phí (Excel)</span>
          </button>
          <button onClick={fetchPolicyDetail} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Main Policy Header Banner */}
      <div className="card v2-anim v2-d1" style={{ marginBottom: '1.5rem', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{policy.policyNumber}</h1>
              <span className="brand-badge" style={{ fontSize: '0.85rem', backgroundColor: 'var(--primary)', color: 'white' }}>
                Phiên bản hiện tại V{policy.version}
              </span>
              <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 700, color: '#475569' }}>
                {policy.insured?.type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.3rem 0 0' }}>
              Bên mua bảo hiểm: <strong>{policy.insured?.name}</strong> [{policy.insured?.insuredId || 'INS-001'}] — {policy.insured?.email} | ĐT: {policy.insured?.phone || 'N/A'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <StatusBadge status={policy.status} />
              {isExpiringSoon && (
                <span className="status-badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <Clock size={12} />
                  <span>Sắp hết hạn · còn {daysToExpiry} ngày</span>
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Tổng phí
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
                  <div className={isCurrent ? 'v2-step-dot-active' : ''} style={{
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
          { id: 'overview', label: '1. Tổng quan', icon: ShieldCheck },
          { id: 'location_manage', label: '2. Địa Điểm & Quyền Lợi', icon: MapPin },
          { id: 'endorsement', label: '3. Điều chỉnh phụ lục', icon: FileDiff },
          { id: 'history', label: '4. Nhật ký thay đổi', icon: History },
          { id: 'versions', label: '5. Các phiên bản đã lưu', icon: Layers },
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
              1. Thông tin bên mua bảo hiểm
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <p><strong>Mã định danh:</strong> <span className="brand-badge">{policy.insured?.insuredId || 'INS-001'}</span></p>
              <p><strong>Đối tượng:</strong> {policy.insured?.type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'}</p>
              <p><strong>Bên mua:</strong> {policy.insured?.name}</p>
              <p><strong>Email nhận hợp đồng:</strong> {policy.insured?.email}</p>
              <p><strong>Số điện thoại:</strong> {policy.insured?.phone || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ:</strong> {policy.insured?.address || 'Chưa cập nhật'}</p>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ngày hiệu lực: <strong>{policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('vi-VN') : 'N/A'}</strong><br />
                Ngày hết hạn: <strong>{policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString('vi-VN') : 'N/A'}</strong>
              </p>
            </div>
          </div>

          {/* State Machine Transition Engine */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary)' }}>
              2. Chuyển trạng thái hợp đồng
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Trạng thái hiện tại: <StatusBadge status={policy.status} />
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {policy.status === 'DRAFT' && (
                <div>
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--primary)', marginBottom: '0.65rem' }}>
                    <Info size={15} style={{ display: 'inline', marginRight: 6 }} />
                    <strong>Soạn thảo:</strong> Hợp đồng đang ở dạng nháp. Bạn bấm nút bên dưới để chốt phí chính thức.
                  </div>
                  <button onClick={() => handleStatusTransition('QUOTED', 'Tính phí chính thức cho bản nháp')} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                    <Play size={16} />
                    <span>Bước 2: Duyệt báo giá</span>
                  </button>
                </div>
              )}

              {policy.status === 'QUOTED' && (
                <div>
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', marginBottom: '0.65rem' }}>
                    <Info size={15} style={{ display: 'inline', marginRight: 6 }} />
                    <strong>Báo giá:</strong> Bảng phí đã chốt ($<strong>{policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong>). Bạn kiểm tra kỹ rồi bấm nút bên dưới để đồng ý bảng phí và ký kết hợp đồng.
                  </div>
                  <button onClick={() => { setAgreeTerms(false); setIsBindModalOpen(true); }} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                    <FileCheck size={16} />
                    <span>Bước 3: Đồng ý & ký kết</span>
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
                        <span>{isOverdue ? '⚠️ Đã quá hạn thanh toán phí' : '⏳ Chờ thanh toán phí'}</span>
                      </div>
                      <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem' }}>
                        Cần hoàn tất nộp phí <strong>${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong> để hợp đồng chính thức có hiệu lực.
                      </p>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, display: 'flex', flexWrap: 'wrap', gap: '1rem', borderTop: '1px dashed currentColor', paddingTop: '0.35rem' }}>
                        <span>Ngày ký kết: <strong>{policy.boundDate ? new Date(policy.boundDate).toLocaleDateString('vi-VN') : 'Mới ghi nhận'}</strong></span>
                        <span>Hạn nộp phí: <strong>{policy.paymentDueDate ? new Date(policy.paymentDueDate).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}</strong></span>
                        <span>Trạng thái: <strong style={{ color: isOverdue ? '#dc2626' : '#047857' }}>{isOverdue ? 'Đã hết hạn (có thể hủy)' : `Còn ${daysRemaining} ngày`}</strong></span>
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
                        <span>Thanh toán phí & kích hoạt (xem mã chuyển khoản)</span>
                      </button>

                      {/* Admin Action: Instant Offline Activation */}
                      {isAdmin && (
                        <button
                          onClick={() => setIsAdminOfflineConfirmOpen(true)}
                          className="btn btn-outline"
                          style={{ width: '100%', padding: '0.75rem', borderColor: '#10b981', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, backgroundColor: '#ecfdf5' }}
                        >
                          <Zap size={18} />
                          <span>Kích hoạt ngoại tuyến</span>
                        </button>
                      )}

                      {/* Overdue or Admin Cancel Option */}
                      {(isOverdue || isAdmin) && (
                        <button
                          onClick={() => handleStatusTransition('CANCELLED', 'Hủy hợp đồng do quá hạn nộp phí')}
                          className="btn btn-danger"
                          style={{ width: '100%', padding: '0.6rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <AlertTriangle size={15} />
                          <span>Hủy do quá hạn nộp phí</span>
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
                    Hợp đồng đang hiệu lực. Muốn đổi quyền lợi/phí, bạn sang tab <strong>"3. Điều chỉnh phụ lục"</strong>.
                  </div>
                  <button onClick={() => handleStatusTransition('CANCELLED', 'Khách hàng đề nghị hủy trước hạn')} className="btn btn-danger" style={{ width: '100%' }}>
                    <span>Hủy hợp đồng trước hạn</span>
                  </button>
                  <button onClick={() => handleStatusTransition('EXPIRED', 'Hết thời hạn bảo hiểm')} className="btn btn-outline" style={{ width: '100%' }}>
                    <span>Đánh dấu hết hạn</span>
                  </button>
                </div>
              )}

              {['CANCELLED', 'EXPIRED'].includes(policy.status) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  Hợp đồng đã kết thúc. Không thể chuyển trạng thái tiếp.
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
                    <span>{isAdmin ? 'Ấn định hạn nộp phí & chuyển sang Đã ký kết' : 'Ký kết & đề xuất hạn nộp phí'}</span>
                  </h4>
                  <button onClick={() => setIsBindModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Bên mua bảo hiểm:</strong> {policy.insured?.name} ({policy.insured?.type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'})</p>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Số hợp đồng:</strong> {policy.policyNumber}</p>
                  <p style={{ marginBottom: '0.35rem' }}><strong>Số địa điểm:</strong> {policy.locations?.length || 0} địa điểm</p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Tổng phí cam kết:</span>
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
                      {isAdmin ? 'Ấn định hạn nộp phí:' : 'Đề xuất hạn nộp phí:'}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.75rem 0' }}>
                    {isAdmin
                      ? 'Quản trị viên được ấn định hạn nộp phí. Quá hạn này, hợp đồng sẽ tự hủy.'
                      : 'Doanh nghiệp có thể đề xuất thêm ngày để kịp trình ký và chuyển khoản.'}
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
                        +{days} ngày
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Hạn nộp phí:</label>
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
                        <strong>Cam kết của khách hàng:</strong> Tôi xác nhận thông tin khai báo là chính xác, đồng ý với quyền lợi và mức phí, cam kết thanh toán trước ngày <strong>{new Date(customDueDate).toLocaleDateString('vi-VN')}</strong>.
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
                        <span>Gửi đề xuất hạn nộp phí</span>
                      </button>

                      <button
                        onClick={() => handleConfirmBind(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontWeight: 700, backgroundColor: '#7c3aed', borderColor: '#6d28d9' }}
                        title="Mô phỏng quản trị viên duyệt ngay (dùng khi demo)"
                      >
                        <Zap size={16} />
                        <span>⚡ Duyệt ngay (demo)</span>
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
                      <span>⚡ Ấn định hạn nộp phí & chuyển sang Đã ký kết</span>
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
                    <span>Thanh toán trực tuyến</span>
                  </h4>
                  <button onClick={() => setIsPayActiveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Amount to pay banner */}
                <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Số tiền cần thanh toán</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
                      ${policy.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quy đổi ước tính (tỷ giá Vietcombank)</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>
                      ~{((policy.totalPremium || 0) * 25450).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>

                {/* Bank Account Info Card with QR Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={16} /> Thông tin chuyển khoản
                    </h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ngân hàng nhận:</span>
                        <strong style={{ color: '#0f172a' }}>VIETCOMBANK (Ngân Hàng Ngoại Thương)</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Số tài khoản:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--primary)', letterSpacing: '0.5px' }}>1903 8888 6666 99</strong>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard?.writeText('19038888666699'); setCopiedBank(true); setTimeout(() => setCopiedBank(false), 2000); }}
                            className="btn btn-outline"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
                          >
                            <Copy size={12} /> {copiedBank ? 'Đã sao chép!' : 'Sao chép'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Chủ tài khoản:</span>
                        <strong style={{ color: '#0f172a' }}>CONG TY CP BAO HIEM DOANH NGHIEP INSURTECH</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Nội dung chuyển khoản:</span>
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
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Quét bằng app ngân hàng</span>
                  </div>
                </div>

                {/* Simulation Notice */}
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', marginBottom: '1.25rem' }}>
                  <Info size={16} style={{ display: 'inline', marginRight: 6 }} />
                  <strong>Chế độ demo:</strong> Bạn có thể bấm nút <strong>"Giả lập đã thanh toán & kích hoạt"</strong> bên dưới. Hệ thống sẽ giả lập xác nhận từ ngân hàng rồi kích hoạt hợp đồng <strong>có hiệu lực</strong> ngay!
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsPayActiveModalOpen(false)} className="btn btn-outline" style={{ padding: '0.6rem 1.1rem' }} disabled={isPayingSimulation}>
                    Đóng
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
                      <><Zap size={18} /><span>⚡ Giả lập đã thanh toán & kích hoạt</span></>
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
                    <span>Kích hoạt ngoại tuyến</span>
                  </h4>
                  <button onClick={() => setIsAdminOfflineConfirmOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#065f46' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Thao tác dành riêng cho quản trị viên:</strong></p>
                  <p style={{ margin: 0 }}>
                    Bạn sắp kích hoạt hiệu lực cho hợp đồng <strong>{policy.policyNumber}</strong> của khách hàng <strong>{policy.insured?.name}</strong> theo hình thức <strong>thanh toán trực tiếp</strong> (tiền mặt, ủy nhiệm chi hoặc bảo lãnh ngân hàng).
                  </p>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Số tiền đã thu:</span>
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
                    <span>Xác nhận kích hoạt ngay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── BỒI THƯỜNG & TÁI TỤC (tính năng mới) ─── */}
      {activeTab === 'overview' && (
        <div className="card v2-anim v2-d3" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--primary)' }}>
            Bồi thường & tái tục
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {policy.status === 'ACTIVE'
              ? 'Gửi yêu cầu bồi thường khi xảy ra sự cố, hoặc tái tục khi hợp đồng sắp hết hạn.'
              : policy.status === 'EXPIRED'
                ? 'Hợp đồng đã hết hạn — bạn có thể tái tục để tạo hợp đồng mới kế thừa toàn bộ quyền lợi.'
                : 'Các thao tác này khả dụng khi hợp đồng đang hiệu lực hoặc đã hết hạn.'}
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {policy.status === 'ACTIVE' && (
              <button onClick={() => setIsClaimModalOpen(true)} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileWarning size={16} />
                <span>Gửi yêu cầu bồi thường</span>
              </button>
            )}
            {canRenew && (
              <button onClick={handleRenew} disabled={renewing} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Repeat size={16} />
                <span>{renewing ? 'Đang tạo...' : 'Tái tục hợp đồng'}</span>
              </button>
            )}
            <Link to="/claims" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span>Xem yêu cầu bồi thường</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ATOMIC LOCATION & COVERAGE MANAGEMENT ─── */}
      {activeTab === 'location_manage' && (
        <div>
          {policy.status === 'ACTIVE' ? (
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Lock size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem' }}>
                <strong>Lưu ý:</strong> Hợp đồng đang hiệu lực. Không sửa/xóa trực tiếp địa điểm và quyền lợi ở đây — mọi thay đổi thực hiện qua <strong>phụ lục hợp đồng</strong> ở tab <strong>"3. Điều chỉnh phụ lục"</strong> để lưu lại lịch sử và tạo phiên bản mới.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Địa điểm & quyền lợi</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chỉ chỉnh sửa được khi hợp đồng đang ở trạng thái nháp</p>
              </div>
              <button onClick={() => setIsAddLocOpen(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={16} />
                <span>Thêm địa điểm mới</span>
              </button>
            </div>
          )}

          {/* Modal Add Location (DRAFT) */}
          {isAddLocOpen && policy.status === 'DRAFT' && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-light)', border: '2px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>Khai báo địa điểm mới</h4>
              <form onSubmit={handleAddLocationSubmit}>
                <div className="form-group">
                  <label className="form-label">Địa chỉ nhà xưởng / kho hàng / văn phòng</label>
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
                  <button type="button" onClick={() => setIsAddLocOpen(false)} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>Hủy</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Lưu địa điểm</button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Add Coverage (DRAFT) */}
          {isAddCovOpen && policy.status === 'DRAFT' && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--secondary-light)', border: '2px solid var(--secondary)' }}>
              <h4 style={{ color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.75rem' }}>Thêm gói quyền lợi cho địa điểm {targetLocId}</h4>
              <form onSubmit={handleAddCoverageSubmit}>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Chọn gói mẫu</label>
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
                    <label className="form-label">Mã gói</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCovData.coverageCode}
                      onChange={(e) => setNewCovData({ ...newCovData, coverageCode: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Hạn mức tối đa (USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCovData.limit}
                      onChange={(e) => setNewCovData({ ...newCovData, limit: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Mức miễn thường (USD)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCovData.deductible}
                      onChange={(e) => setNewCovData({ ...newCovData, deductible: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Phí bảo hiểm (USD)</label>
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
                  <button type="button" onClick={() => setIsAddCovOpen(false)} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>Hủy</button>
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>+ Thêm quyền lợi</button>
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
                      <span>Thêm gói bảo hiểm</span>
                    </button>
                    <button onClick={() => handleRemoveLocation(loc.locationId)} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}>
                      <Trash2 size={14} />
                      <span>Xóa địa điểm</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Coverages Table */}
              {(!loc.coverages || loc.coverages.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  Địa điểm này chưa có gói quyền lợi nào.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã gói</th>
                        <th>Tên gói</th>
                        <th>Hạn mức bồi thường</th>
                        <th>Miễn thường</th>
                        <th style={{ textAlign: 'right' }}>Phí bảo hiểm (USD)</th>
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
                                title="Bỏ gói quyền lợi"
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
                Đợt điều chỉnh phụ lục
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                Điều chỉnh áp dụng cho hợp đồng đang hiệu lực: hệ thống tự lưu lại phiên bản hiện tại (<strong>V{policy.version}</strong>), tính lại tổng phí và nâng hợp đồng lên <strong>V{policy.version + 1}</strong>.
              </p>
            </div>
            <span className="brand-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem' }}>
              Hiện tại: V{policy.version} → tiếp theo: V{policy.version + 1}
            </span>
          </div>

          {policy.status !== 'ACTIVE' ? (
            <div style={{ padding: '1.25rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
              <AlertTriangle size={20} style={{ display: 'inline', marginRight: 8 }} />
              <strong>Chưa điều chỉnh được:</strong> Hợp đồng đang ở trạng thái <strong>{policy.status}</strong>. Chỉ điều chỉnh được khi hợp đồng đang hiệu lực.
            </div>
          ) : (
            <form onSubmit={handleEndorsementSubmit}>
              {/* Select Endorsement Operation Type */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>1. Loại điều chỉnh</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { id: 'ADD_COVERAGE', title: '+ Thêm quyền lợi', desc: 'Bổ sung gói mới (ví dụ: an ninh mạng)' },
                    { id: 'REMOVE_COVERAGE', title: '− Bỏ quyền lợi', desc: 'Bỏ một gói đang có' },
                    { id: 'GENERAL', title: 'Phụ lục điều khoản chung', desc: 'Ghi nhận điều chỉnh khác' },
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
                    2. Quyền lợi cần bổ sung
                  </h4>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Địa điểm áp dụng</label>
                      <select className="form-select" value={endorseLocId} onChange={(e) => setEndorseLocId(e.target.value)}>
                        {policy.locations?.map((l) => (
                          <option key={l.locationId} value={l.locationId}>{l.locationId} - {l.address}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Chọn gói mẫu</label>
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
                      <label className="form-label">Hạn mức bồi thường (USD)</label>
                      <input type="number" className="form-input" value={endorseLimit} onChange={(e) => setEndorseLimit(Number(e.target.value))} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phí cần tăng thêm (USD)</label>
                      <input type="number" className="form-input" value={endorsePremium} onChange={(e) => setEndorsePremium(Number(e.target.value))} required />
                    </div>
                  </div>
                </div>
              )}

              {endorseType === 'REMOVE_COVERAGE' && (
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
                    2. Quyền lợi cần loại bỏ
                  </h4>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Địa điểm áp dụng</label>
                      <select className="form-select" value={endorseLocId} onChange={(e) => setEndorseLocId(e.target.value)}>
                        {policy.locations?.map((l) => (
                          <option key={l.locationId} value={l.locationId}>{l.locationId} - {l.address}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Gói cần loại bỏ</label>
                      <select className="form-select" value={endorseCovCode} onChange={(e) => {
                        setEndorseCovCode(e.target.value);
                        setEndorseDescription(`Loại bỏ gói bảo hiểm ${e.target.value} khỏi ${endorseLocId}`);
                      }}>
                        {policy.locations?.find(l => l.locationId === endorseLocId)?.coverages?.map((c) => (
                          <option key={c.coverageCode} value={c.coverageCode}>{c.coverageCode} - {c.coverageName}</option>
                        )) || <option value="">Chưa có gói nào</option>}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  3. Lý do điều chỉnh <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ví dụ: bổ sung gói an ninh mạng theo yêu cầu khách hàng"
                  value={endorseDescription}
                  onChange={(e) => setEndorseDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  * Hệ thống sẽ tự ghi nhật ký và lưu lại phiên bản V{policy.version}.
                </span>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
                  <FileDiff size={18} />
                  <span>Lưu điều chỉnh → lên V{policy.version + 1}</span>
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
                Nhật ký giao dịch hợp đồng
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Toàn bộ thay đổi trên hợp đồng, mới nhất lên trước
              </p>
            </div>
            <button onClick={fetchHistory} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> Tải lại
            </button>
          </div>

          {history.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có thay đổi nào được ghi nhận.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại thay đổi</th>
                    <th>Phiên bản</th>
                    <th>Người thực hiện</th>
                    <th>Chi tiết thay đổi</th>
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
                Các phiên bản đã lưu
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Mỗi lần điều chỉnh, hệ thống tự lưu lại toàn bộ hợp đồng để tra cứu về sau.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, marginRight: '0.5rem' }}>Chọn phiên bản:</span>
            {availableVersions.map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVersionNum(v)}
                className={`btn ${selectedVersionNum === v ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                Phiên bản V{v} {v === policy.version ? '(hiện tại)' : ''}
              </button>
            ))}
          </div>

          {versionSnapshot ? (
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                    Phiên bản V{versionSnapshot.version} của {versionSnapshot.policyNumber}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Lưu lúc: {new Date(versionSnapshot.createdAt || Date.now()).toLocaleString('vi-VN')} | Người lập: {versionSnapshot.createdBy}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng phí phiên bản này</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                    ${versionSnapshot.policySnapshot?.totalPremium?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
              </div>

              {/* Snapshot Details */}
              <div className="grid-2" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <div>
                  <p><strong>Trạng thái khi lưu:</strong> <StatusBadge status={versionSnapshot.policySnapshot?.status} /></p>
                  <p><strong>Bên mua bảo hiểm:</strong> {versionSnapshot.policySnapshot?.insured?.name}</p>
                </div>
                <div>
                  <p><strong>Số địa điểm:</strong> {versionSnapshot.policySnapshot?.locations?.length || 0} địa điểm</p>
                  <p><strong>Email:</strong> {versionSnapshot.policySnapshot?.insured?.email}</p>
                </div>
              </div>

              {/* Snapshot Locations & Coverages Table */}
              <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                Địa điểm & quyền lợi tại V{versionSnapshot.version}:
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
                          <th>Mã gói</th>
                          <th>Tên gói</th>
                          <th>Hạn mức</th>
                          <th>Miễn thường</th>
                          <th style={{ textAlign: 'right' }}>Phí bảo hiểm</th>
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
              Đang tải phiên bản V{selectedVersionNum}...
            </p>
          )}
        </div>
      )}

      {/* Modal gửi yêu cầu bồi thường */}
      <ClaimCreateModal
        open={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        presetPolicyNumber={policy?.policyNumber || ''}
        user={user}
        onCreated={(claimNumber) => { if (claimNumber) navigate(`/claims/${claimNumber}`); }}
      />
    </div>
  );
};

export default PolicyDetail;
