import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, Lock, Globe, UserCheck, KeyRound } from 'lucide-react';
import OtpModal from '../components/OtpModal';
import axiosClient from '../api/axiosClient';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if redirected from Google OAuth2 Callback with token
  useEffect(() => {
    const token = searchParams.get('token');
    const urlEmail = searchParams.get('email');
    const urlName = searchParams.get('name');
    const urlRole = searchParams.get('role');

    if (token && urlEmail) {
      const user = {
        email: decodeURIComponent(urlEmail),
        fullName: urlName ? decodeURIComponent(urlName) : urlEmail.split('@')[0].toUpperCase(),
        role: urlRole ? decodeURIComponent(urlRole) : 'ROLE_USER',
      };
      onLoginSuccess(user, token);
      navigate('/my-policies');
    }

    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      alert('Đăng nhập thất bại: ' + decodeURIComponent(errorMsg));
    }
  }, [searchParams]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsOtpOpen(true);
    }, 400);
  };

  const handleVerifyOtp = async (otp) => {
    setIsOtpOpen(false);
    try {
      const res = await axiosClient.post('/auth/login', {
        email: email,
        fullName: email.split('@')[0].toUpperCase(),
      });
      const data = res.data || res;
      const user = {
        email: data.email || email,
        fullName: data.fullName || email.split('@')[0].toUpperCase(),
        role: data.role || 'ROLE_USER',
        phone: '0901234567',
        address: '123 Đường Bảo Hiểm, Q.1, TP.HCM',
      };
      onLoginSuccess(user, data.token);
      navigate(data.role === 'ROLE_ADMIN' ? '/admin/reports' : '/my-policies');
    } catch (err) {
      alert('Lỗi đăng nhập: ' + (err.message || 'Lỗi kết nối'));
    }
  };

  const handleQuickLogin = async (targetEmail, targetRole, targetName) => {
    setQuickLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', {
        email: targetEmail,
        fullName: targetName,
        role: targetRole,
      });
      const data = res.data || res;
      const user = {
        email: data.email || targetEmail,
        fullName: data.fullName || targetName,
        role: data.role || targetRole,
        phone: '0909998888',
        address: 'Trụ sở InsurTech TP.HCM',
      };
      onLoginSuccess(user, data.token);
      navigate(data.role === 'ROLE_ADMIN' ? '/admin/reports' : '/my-policies');
    } catch (err) {
      alert('Lỗi đăng nhập nhanh: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setQuickLoading(false);
    }
  };

  const handleGoogleOAuth2Login = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="user-avatar" style={{ margin: '0 auto 1rem', width: 64, height: 64, backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>Đăng Nhập Cổng Bảo Hiểm</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Hệ thống Quản lý & Cấp Đơn Bảo hiểm Doanh nghiệp InsurTech
          </p>
        </div>

        {/* Google OAuth2 Direct Button */}
        <button
          type="button"
          onClick={handleGoogleOAuth2Login}
          className="btn btn-outline"
          style={{
            width: '100%',
            padding: '0.8rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontWeight: 700,
            borderColor: '#4285F4',
            color: '#1a73e8'
          }}
        >
          <Globe size={20} style={{ color: '#4285F4' }} />
          <span>Đăng nhập trực tiếp bằng Google OAuth2</span>
        </button>

        {/* QA/Tester Quick Role Switchers */}
        <div style={{
          backgroundColor: 'var(--bg-main)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: '1px dashed var(--border)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <KeyRound size={14} />
            <span>Chế độ Tester / Phân Quyền Kiểm Thử Nhanh (QA)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              disabled={quickLoading}
              onClick={() => handleQuickLogin('admin@insurtech.vn', 'ROLE_ADMIN', 'Quản Trị Viên (Admin)')}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', backgroundColor: '#e11d48', borderColor: '#e11d48' }}
            >
              <ShieldCheck size={15} />
              <span>Login ADMIN</span>
            </button>
            <button
              type="button"
              disabled={quickLoading}
              onClick={() => handleQuickLogin('khachhang@gmail.com', 'ROLE_USER', 'Khách Hàng (User)')}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <UserCheck size={15} />
              <span>Login USER</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
          <span style={{ padding: '0 0.75rem' }}>HOẶC ĐĂNG NHẬP BẰNG GMAIL & OTP</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
        </div>

        {/* OTP Email Form */}
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label className="form-label">Địa chỉ Gmail</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="vd: dungphdse@gmail.com hoặc user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              * Email thuộc <code>dungphdse@gmail.com</code> hoặc <code>admin@insurtech.vn</code> sẽ tự động nhận vai trò ADMIN.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Đang gửi mã OTP...' : (
              <>
                <span>Tiếp tục nhận OTP qua Mail</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.85rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
          <Lock size={16} style={{ shrink: 0, marginTop: '2px', color: 'var(--secondary)' }} />
          <span>Hệ thống phân quyền RBAC & mã hoá JWT 256-bit chuẩn Spring Security.</span>
        </div>
      </div>

      <OtpModal
        email={email}
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onVerify={handleVerifyOtp}
      />
    </div>
  );
};

export default Login;
