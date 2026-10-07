import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, CheckCircle, ShieldCheck, MapPin, Calculator, FileText,
  ArrowRight, ArrowLeft, User, Download, RefreshCw, Info, AlertTriangle, Bookmark,
  PlusCircle, Trash2, Building2
} from 'lucide-react';
import policyApi from '../api/policyApi';
import axiosClient from '../api/axiosClient';

// Coverage catalog với thông tin đầy đủ nghiệp vụ
const COVERAGE_CATALOG = [
  {
    coverageCode: 'PROPERTY',
    coverageName: 'Bảo hiểm Tài sản & Cháy nổ (Property All Risks)',
    description: 'Bồi thường thiệt hại vật chất do hỏa hoạn, cháy nổ, thiên tai, trộm cắp đối với tài sản/nhà xưởng/kho hàng.',
    baseRate: 0.075,
    suggestedLimit: 2000000,
    suggestedDeductible: 5000,
    icon: '🏭',
  },
  {
    coverageCode: 'GL',
    coverageName: 'Bảo hiểm Trách nhiệm Công cộng (General Liability)',
    description: 'Bảo vệ doanh nghiệp trước các khiếu nại từ bên thứ ba về thương tật thân thể hoặc thiệt hại tài sản.',
    baseRate: 0.120,
    suggestedLimit: 1000000,
    suggestedDeductible: 2000,
    icon: '⚖️',
  },
  {
    coverageCode: 'EL',
    coverageName: 'Bảo hiểm TNSDLĐ (Employer Liability)',
    description: 'Chi trả bồi thường cho người lao động bị tai nạn, bệnh nghề nghiệp trong quá trình làm việc.',
    baseRate: 0.160,
    suggestedLimit: 500000,
    suggestedDeductible: 1000,
    icon: '👷',
  },
  {
    coverageCode: 'BI',
    coverageName: 'Bảo hiểm Gián đoạn Kinh doanh (Business Interruption)',
    description: 'Bồi thường tổn thất doanh thu khi hoạt động kinh doanh bị gián đoạn do sự cố được bảo hiểm.',
    baseRate: 0.145,
    suggestedLimit: 1500000,
    suggestedDeductible: 5000,
    icon: '📊',
  },
  {
    coverageCode: 'MARINE',
    coverageName: 'Bảo hiểm Hàng hải & Vận chuyển (Marine Cargo)',
    description: 'Bảo hiểm hàng hóa trong quá trình vận chuyển đường biển, đường bộ, đường hàng không.',
    baseRate: 0.055,
    suggestedLimit: 500000,
    suggestedDeductible: 2500,
    icon: '🚢',
  },
  {
    coverageCode: 'CYBER',
    coverageName: 'Bảo hiểm An ninh mạng (Cyber Liability)',
    description: 'Bảo vệ trước các tổn thất phát sinh từ tấn công mạng, rò rỉ dữ liệu, ransomware.',
    baseRate: 0.200,
    suggestedLimit: 300000,
    suggestedDeductible: 3000,
    icon: '🔐',
  },
];

const COVERAGE_TYPES = [
  { value: 'STANDARD',      label: 'Standard (×1.0)',      desc: 'Bảo hiểm tiêu chuẩn' },
  { value: 'ENHANCED',      label: 'Enhanced (×1.25)',     desc: 'Mở rộng quyền lợi +25%' },
  { value: 'COMPREHENSIVE', label: 'Comprehensive (×1.5)', desc: 'Toàn diện nhất +50%' },
];

const TERM_OPTIONS = [
  { value: 12, label: '1 năm (×1.0)' },
  { value: 24, label: '2 năm (×1.85) — tiết kiệm 7.5%' },
  { value: 36, label: '3 năm (×2.65) — tiết kiệm 11.7%' },
];

export const BuyInsurance = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Insured Info & Multiple Locations
  const [insuredInfo, setInsuredInfo] = useState({
    insuredId: `INS-${Math.floor(1000 + Math.random() * 9000)}`,
    name: user?.fullName || '',
    type: 'BUSINESS', // BUSINESS or INDIVIDUAL
    email: user?.email || '',
    phone: '',
    address: '',
  });

  // Quản lý danh sách nhiều địa điểm rủi ro
  const [locations, setLocations] = useState([
    {
      locationId: 'LOC-01',
      name: 'Trụ sở chính / Địa điểm 1',
      address: '',
    },
  ]);

  const handleAddLocation = () => {
    const nextIdx = locations.length + 1;
    const nextId = `LOC-${String(nextIdx).padStart(2, '0')}`;
    setLocations([
      ...locations,
      {
        locationId: nextId,
        name: `Chi nhánh / Cơ sở ${nextIdx}`,
        address: '',
      },
    ]);
  };

  const handleRemoveLocation = (indexToRemove) => {
    if (locations.length <= 1) return;
    setLocations(locations.filter((_, idx) => idx !== indexToRemove));
  };

  const handleLocationChange = (index, field, value) => {
    setLocations(
      locations.map((loc, idx) => (idx === index ? { ...loc, [field]: value } : loc))
    );
  };

  const [effectiveDateStr, setEffectiveDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default: tomorrow
    return d.toISOString().split('T')[0];
  });

  // Step 2: Coverage selection
  const [selectedCoverages, setSelectedCoverages] = useState(
    COVERAGE_CATALOG.map((c) => ({
      ...c,
      selected: c.coverageCode === 'PROPERTY' || c.coverageCode === 'GL',
      coverageType: 'STANDARD',
      termMonths: 12,
      limit: c.suggestedLimit,
      deductible: c.suggestedDeductible,
      calculatedPremium: null, // will be filled by API
    }))
  );

  const toggleCoverage = (code) => {
    setSelectedCoverages((prev) =>
      prev.map((c) => (c.coverageCode === code ? { ...c, selected: !c.selected, calculatedPremium: null } : c))
    );
  };

  const updateCovField = (code, field, value) => {
    setSelectedCoverages((prev) =>
      prev.map((c) => (c.coverageCode === code ? { ...c, [field]: value, calculatedPremium: null } : c))
    );
  };

  // Real-time premium calculation via API
  const calculatePremiums = useCallback(async () => {
    const activeCovs = selectedCoverages.filter((c) => c.selected);
    if (activeCovs.length === 0) return;

    setCalculating(true);
    try {
      const payload = activeCovs.map((c) => ({
        coverageCode: c.coverageCode,
        coverageType: c.coverageType,
        limit: Number(c.limit),
        deductible: Number(c.deductible),
        termMonths: Number(c.termMonths),
        baseRate: c.baseRate,
      }));

      const results = await axiosClient.post('/excel/calculate', payload);

      setSelectedCoverages((prev) =>
        prev.map((c) => {
          const result = Array.isArray(results) && results.find((r) => r.coverageCode === c.coverageCode);
          return result ? { ...c, calculatedPremium: result.premium } : c;
        })
      );
    } catch (err) {
      console.error('Premium calculation error:', err);
      // Fallback: estimate locally using base rates
      setSelectedCoverages((prev) =>
        prev.map((c) => {
          if (!c.selected) return c;
          const termFactor = { 12: 1.0, 24: 1.85, 36: 2.65 }[c.termMonths] || 1.0;
          const typeFactor = { STANDARD: 1.0, ENHANCED: 1.25, COMPREHENSIVE: 1.5 }[c.coverageType] || 1.0;
          const est = Math.round(c.limit * (c.baseRate / 100) * termFactor * typeFactor * 100) / 100;
          return { ...c, calculatedPremium: est };
        })
      );
    } finally {
      setCalculating(false);
    }
  }, [selectedCoverages]);

  // Phí tính trên 1 địa điểm
  const getPerLocationPremium = () =>
    selectedCoverages
      .filter((c) => c.selected && c.calculatedPremium != null)
      .reduce((sum, c) => sum + c.calculatedPremium, 0);

  // Tổng phí cho toàn bộ các địa điểm trong hợp đồng
  const getTotalPremium = () =>
    getPerLocationPremium() * (locations.length || 1);

  // Step 1 validation
  const validateStep1 = () => {
    if (!insuredInfo.name.trim()) return 'Vui lòng nhập tên Bên mua bảo hiểm';
    if (!insuredInfo.email.trim() || !insuredInfo.email.includes('@')) return 'Địa chỉ Gmail không hợp lệ';
    if (!insuredInfo.phone.trim()) return 'Vui lòng nhập số điện thoại liên hệ';
    if (locations.length === 0) return 'Vui lòng khai báo ít nhất 01 địa điểm bảo hiểm';
    for (let i = 0; i < locations.length; i++) {
      if (!locations[i].address.trim()) {
        return `Vui lòng nhập địa chỉ cụ thể cho ${locations[i].name || `Địa điểm ${i + 1}`}`;
      }
    }
    const effDate = new Date(effectiveDateStr);
    if (effDate <= new Date()) return 'Ngày hiệu lực phải từ ngày mai trở đi';
    return null;
  };

  const handleNextStep1 = () => {
    const err = validateStep1();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setStep(2);
  };

  const handleNextStep2 = async () => {
    const activeCovs = selectedCoverages.filter((c) => c.selected);
    if (activeCovs.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 01 gói quyền lợi bảo hiểm');
      return;
    }
    setErrorMsg('');
    await calculatePremiums();
    setStep(3);
  };

  const handleSubmitPolicy = async (asDraft = false) => {
    setLoading(true);
    setErrorMsg('');

    const activeCoverages = selectedCoverages
      .filter((c) => c.selected)
      .map((c) => ({
        coverageCode: c.coverageCode,
        coverageName: c.coverageName || c.coverageCode,
        coverageType: c.coverageType || 'STANDARD',
        limit: Number(c.limit) > 0 ? Number(c.limit) : 1000000,
        deductible: Number(c.deductible) >= 0 ? Number(c.deductible) : 0,
        termMonths: Number(c.termMonths) || 12,
        baseRate: c.baseRate || 0.1,
        calculatedPremium: c.calculatedPremium,
      }));

    if (activeCoverages.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một gói quyền lợi bảo hiểm');
      setLoading(false);
      return;
    }

    const policyNum = `POL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const startDate = new Date(effectiveDateStr);
    const termMonths = activeCoverages[0]?.termMonths || 12;
    const endDate = new Date(startDate.getTime() + termMonths * 30.44 * 86400 * 1000);

    const payload = {
      policyNumber: policyNum,
      insured: {
        insuredId: insuredInfo.insuredId?.trim() || `INS-${Math.floor(1000 + Math.random() * 9000)}`,
        name: insuredInfo.name?.trim(),
        type: insuredInfo.type || 'BUSINESS',
        email: insuredInfo.email?.trim(),
        phone: insuredInfo.phone?.trim() || '0901234567',
        address: insuredInfo.address?.trim() || (locations[0]?.address?.trim() || ''),
      },
      locations: locations.map((loc, idx) => ({
        locationId: loc.locationId || `LOC-${String(idx + 1).padStart(2, '0')}`,
        address: loc.address.trim(),
        coverages: activeCoverages.map((cov) => ({
          coverageCode: cov.coverageCode,
          coverageName: cov.coverageName || cov.coverageCode,
          coverageType: cov.coverageType || 'STANDARD',
          limit: Number(cov.limit) > 0 ? Number(cov.limit) : 1000000,
          deductible: Number(cov.deductible) >= 0 ? Number(cov.deductible) : 0,
          termMonths: Number(cov.termMonths) || 12,
          baseRate: cov.baseRate || 0.1,
          premium: cov.calculatedPremium != null ? cov.calculatedPremium : 0,
        })),
      })),
      effectiveDate: startDate.toISOString(),
      expirationDate: endDate.toISOString(),
    };

    try {
      await policyApi.createPolicy(payload);
      if (!asDraft) {
        // Tự động chuyển ngay sang trạng thái QUOTED (Đã Báo Phí)
        try {
          await policyApi.transitionStatus(policyNum, {
            targetStatus: 'QUOTED',
            reason: 'Đã hoàn tất tính phí và tạo bản báo giá chính thức từ bảng quyền lợi',
            actor: insuredInfo.name?.trim() || 'Khách hàng',
          });
        } catch (transErr) {
          console.warn('Could not auto-transition to QUOTED:', transErr);
        }
      }
      navigate(`/policies/${policyNum}?created=true&mode=${asDraft ? 'draft' : 'quoted'}`);
    } catch (err) {
      console.error('Failed to create policy', err);
      setErrorMsg(err.message || 'Không thể tạo đơn bảo hiểm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await axiosClient.get('/excel/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'InsurancePricingMatrix.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      console.error('Excel download failed');
    }
  };

  const stepConfig = [
    { num: 1, label: 'Bên mua & Địa điểm' },
    { num: 2, label: 'Chọn Quyền lợi' },
    { num: 3, label: 'Bảng phí xác nhận' },
    { num: 4, label: 'Nộp Hồ sơ' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
          Yêu Cầu Cấp Đơn Bảo Hiểm Doanh Nghiệp
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Phí bảo hiểm được tính tự động theo bảng định mức nghiệp vụ — Hoàn tất trong 4 bước
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginBottom: '2.5rem' }}>
        {stepConfig.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: step > s.num ? 'var(--secondary)' : step === s.num ? 'var(--primary)' : 'var(--border)',
                color: step >= s.num ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1rem', transition: 'all 0.3s ease',
                boxShadow: step === s.num ? '0 0 0 4px var(--primary-light)' : 'none'
              }}>
                {step > s.num ? <CheckCircle size={22} /> : s.num}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: step >= s.num ? 700 : 500, color: step >= s.num ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {idx < stepConfig.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: step > s.num ? 'var(--secondary)' : 'var(--border)', alignSelf: 'flex-start', marginTop: 21, minWidth: 32, transition: 'all 0.3s' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fca5a5' }}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>

        {/* ─── STEP 1: INSURED INFO ─── */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} />
              <span>Bước 1: Thông Tin Bên Mua Bảo Hiểm & Địa Điểm</span>
            </h3>

            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Loại Đối Tượng Được Bảo Hiểm <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-select"
                  value={insuredInfo.type}
                  onChange={(e) => setInsuredInfo({ ...insuredInfo, type: e.target.value })}
                >
                  <option value="BUSINESS">Doanh Nghiệp / Tổ Chức (BUSINESS)</option>
                  <option value="INDIVIDUAL">Cá Nhân / Hộ Kinh Doanh (INDIVIDUAL)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mã Định Danh Đối Tượng (Insured ID)</label>
                <input
                  type="text"
                  className="form-input"
                  value={insuredInfo.insuredId}
                  onChange={(e) => setInsuredInfo({ ...insuredInfo, insuredId: e.target.value })}
                  placeholder="INS-001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên {insuredInfo.type === 'BUSINESS' ? 'Doanh nghiệp / Tổ chức' : 'Người được bảo hiểm'} <span style={{ color: 'red' }}>*</span></label>
                <input type="text" className="form-input" placeholder={insuredInfo.type === 'BUSINESS' ? 'Công ty TNHH ABC Việt Nam' : 'Nguyễn Văn A'}
                  value={insuredInfo.name} onChange={(e) => setInsuredInfo({ ...insuredInfo, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Gmail nhận Hợp đồng & thông báo <span style={{ color: 'red' }}>*</span></label>
                <input type="email" className="form-input" placeholder="khachhang@gmail.com"
                  value={insuredInfo.email} onChange={(e) => setInsuredInfo({ ...insuredInfo, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại liên hệ <span style={{ color: 'red' }}>*</span></label>
                <input type="tel" className="form-input" placeholder="0901 234 567"
                  value={insuredInfo.phone} onChange={(e) => setInsuredInfo({ ...insuredInfo, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày bắt đầu hiệu lực bảo hiểm <span style={{ color: 'red' }}>*</span></label>
                <input type="date" className="form-input" value={effectiveDateStr}
                  onChange={(e) => setEffectiveDateStr(e.target.value)} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Địa chỉ Trụ sở chính Bên mua bảo hiểm</label>
              <input type="text" className="form-input" placeholder="123 Đường ABC, Phường XYZ, Q.1, TP.HCM"
                value={insuredInfo.address} onChange={(e) => setInsuredInfo({ ...insuredInfo, address: e.target.value })} />
            </div>

            {/* Danh sách nhiều địa điểm bảo hiểm (Multi-Locations) */}
            <div style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Building2 size={20} style={{ color: 'var(--primary)' }} />
                    <span>Danh Sách Địa Điểm Cần Được Bảo Hiểm ({locations.length})</span>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                    Khai báo các nhà xưởng, kho bãi, văn phòng chi nhánh thuộc phạm vi bảo hiểm của hợp đồng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="btn btn-outline"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Thêm Địa Điểm</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {locations.map((loc, idx) => (
                  <div
                    key={loc.locationId || idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {loc.locationId}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          Địa điểm #{idx + 1}
                        </span>
                      </div>
                      {locations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.4rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          title="Xóa địa điểm này"
                        >
                          <Trash2 size={15} />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          Tên Định Danh / Vai Trò
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                          placeholder="Trụ sở chính, Kho số 1..."
                          value={loc.name}
                          onChange={(e) => handleLocationChange(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          Địa Chỉ Rủi Ro Cụ Thể <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                          placeholder="Lô A3, KCN Tân Bình, P.Tây Thạnh, Q.Tân Phú, TP.HCM"
                          value={loc.address}
                          onChange={(e) => handleLocationChange(idx, 'address', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {locations.length > 1 && (
                <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                  >
                    <PlusCircle size={15} />
                    <span>+ Thêm địa điểm rủi ro khác</span>
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleNextStep1} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
              <span>Tiếp Theo: Lựa Chọn Gói Quyền Lợi ({locations.length} Địa Điểm)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ─── STEP 2: COVERAGE SELECTION ─── */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} />
              <span>Bước 2: Lựa Chọn Gói Quyền Lợi & Điều Kiện Bảo Hiểm</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Phí được tính theo công thức: <strong>Hạn mức × Tỷ lệ phí gốc × Hệ số thời hạn × Hệ số loại gói × Chiết khấu miễn trừ</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {selectedCoverages.map((cov) => (
                <div key={cov.coverageCode} style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: cov.selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: cov.selected ? 'var(--primary-light)' : 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => toggleCoverage(cov.coverageCode)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="checkbox" checked={cov.selected} onChange={() => toggleCoverage(cov.coverageCode)}
                        style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} onClick={(e) => e.stopPropagation()} />
                      <span style={{ fontSize: '1.5rem' }}>{cov.icon}</span>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: cov.selected ? 'var(--primary)' : 'var(--text-main)' }}>
                          {cov.coverageName}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{cov.description}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                      Rate: {(cov.baseRate * 100).toFixed(3)}%
                    </span>
                  </div>

                  {cov.selected && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Hạn Mức Bồi Thường Tối Đa ($USD)</label>
                          <input type="number" className="form-input" value={cov.limit} min={10000} step={10000}
                            onChange={(e) => updateCovField(cov.coverageCode, 'limit', Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Mức Miễn Trừ Bảo Hiểm ($USD)</label>
                          <input type="number" className="form-input" value={cov.deductible} min={0} step={500}
                            onChange={(e) => updateCovField(cov.coverageCode, 'deductible', Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Loại Gói Bảo Hiểm</label>
                          <select className="form-select" value={cov.coverageType}
                            onChange={(e) => updateCovField(cov.coverageCode, 'coverageType', e.target.value)}>
                            {COVERAGE_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Thời Hạn Bảo Hiểm</label>
                          <select className="form-select" value={cov.termMonths}
                            onChange={(e) => updateCovField(cov.coverageCode, 'termMonths', Number(e.target.value))}>
                            {TERM_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>
                <ArrowLeft size={18} /><span>Quay lại</span>
              </button>
              <button onClick={handleNextStep2} className="btn btn-primary" style={{ flex: 2 }} disabled={calculating}>
                {calculating ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Đang tính phí...</span></>
                ) : (
                  <><Calculator size={18} /><span>Xác Nhận & Tính Phí Chính Thức</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: PREMIUM SUMMARY ─── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={22} />
              <span>Bước 3: Bảng Tổng Hợp Phí Bảo Hiểm Quy Chuẩn</span>
            </h3>

            {/* Total premium highlight */}
            <div style={{ padding: '1.75rem', background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center', color: 'white' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>Tổng Phí Bảo Hiểm Toàn Bộ Hợp Đồng</span>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0.35rem 0' }}>
                ${getTotalPremium().toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                Bảo vệ cho <strong>{locations.length} địa điểm</strong> (${getPerLocationPremium().toLocaleString('en-US', { minimumFractionDigits: 2 })} USD/địa điểm) — {selectedCoverages.filter((c) => c.selected).length} gói quyền lợi
              </p>
            </div>

            {/* Danh sách địa điểm bảo hiểm thu gọn */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} />
                <span>Phạm Vi {locations.length} Địa Điểm Bảo Hiểm Áp Dụng:</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {locations.map((loc, idx) => (
                  <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 60 }}>{loc.locationId}:</span>
                    <span><strong>{loc.name || `Địa điểm ${idx + 1}`}</strong> — {loc.address}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail table */}
            <div className="table-container" style={{ marginBottom: '1.5rem' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Gói Quyền Lợi</th>
                    <th>Loại Gói</th>
                    <th>Hạn Mức</th>
                    <th>Miễn Trừ</th>
                    <th>Thời Hạn</th>
                    <th>Tỷ Lệ Phí</th>
                    <th style={{ textAlign: 'right' }}>Phí / Địa Điểm ($USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCoverages.filter((c) => c.selected).map((c) => (
                    <tr key={c.coverageCode}>
                      <td>
                        <span style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>{c.icon}</span>
                        <strong>{c.coverageCode}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.coverageName.split('(')[0]}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                          {c.coverageType}
                        </span>
                      </td>
                      <td>${Number(c.limit).toLocaleString()}</td>
                      <td>${Number(c.deductible).toLocaleString()}</td>
                      <td>{c.termMonths} tháng</td>
                      <td>{(c.baseRate * 100).toFixed(3)}%</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'right' }}>
                        ${c.calculatedPremium != null ? c.calculatedPremium.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--primary-light)' }}>
                    <td colSpan={6} style={{ fontWeight: 800, textAlign: 'right' }}>PHÍ BẢO HIỂM MỖI ĐỊA ĐIỂM:</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', textAlign: 'right' }}>
                      ${getPerLocationPremium().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                    <td colSpan={6} style={{ fontWeight: 900, textAlign: 'right', color: 'white' }}>
                      TỔNG PHÍ HỢP ĐỒNG ({locations.length} ĐỊA ĐIỂM):
                    </td>
                    <td style={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', textAlign: 'right' }}>
                      ${getTotalPremium().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <Info size={16} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <span>Phí được tính tự động theo công thức nghiệp vụ cho từng địa điểm rủi ro. Phí chính thức sẽ được phê duyệt tại bước báo phí.</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-outline" style={{ flex: 1 }}>
                <ArrowLeft size={18} /><span>Điều chỉnh</span>
              </button>
              <button onClick={() => setStep(4)} className="btn btn-primary" style={{ flex: 2 }}>
                <span>Xác Nhận Đơn Mua ({locations.length} Địa Điểm)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: FINAL CONFIRMATION ─── */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={22} />
              <span>Bước 4: Xác Nhận & Nộp Đơn Yêu Cầu Cấp Hợp Đồng</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem', padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Bên Mua Bảo Hiểm</h4>
                {[
                  ['Tên Doanh nghiệp', insuredInfo.name],
                  ['Gmail nhận Hợp đồng', insuredInfo.email],
                  ['Số điện thoại', insuredInfo.phone],
                  ['Ngày hiệu lực', new Date(effectiveDateStr).toLocaleDateString('vi-VN')],
                ].map(([label, value]) => (
                  <p key={label} style={{ marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                    <strong>{label}:</strong> {value || '—'}
                  </p>
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Địa Điểm & Quyền Lợi ({locations.length} Cơ Sở)
                </h4>
                <div style={{ maxHeight: 110, overflowY: 'auto', marginBottom: '0.5rem', paddingRight: '0.25rem' }}>
                  {locations.map((loc, idx) => (
                    <p key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      <strong style={{ color: 'var(--primary)' }}>{loc.locationId}:</strong> {loc.name ? `${loc.name} — ` : ''}{loc.address}
                    </p>
                  ))}
                </div>
                <p style={{ marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                  <strong>Quyền lợi bảo hiểm:</strong> {selectedCoverages.filter((c) => c.selected).length} gói / địa điểm
                </p>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <strong>Tổng phí ({locations.length} địa điểm): </strong>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                    ${getTotalPremium().toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => setStep(3)} className="btn btn-outline" style={{ minWidth: 120 }}>
                <ArrowLeft size={18} /><span>Quay lại</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmitPolicy(true)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.9rem', borderColor: 'var(--border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={loading}
              >
                <Bookmark size={18} style={{ color: 'var(--secondary)' }} />
                <span>Lưu Trạng Thái Bản Nháp (DRAFT)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmitPolicy(false)}
                className="btn btn-primary"
                style={{ flex: 1.5, padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Đang xử lý đơn...</span></>
                ) : (
                  <><CheckCircle size={18} /><span>Nộp Đơn & Xuất Báo Giá (QUOTED)</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyInsurance;
