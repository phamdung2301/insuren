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
      alert('Không đăng nhập được: ' + decodeURIComponent(errorMsg));
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
      alert('Không đăng nhập được: ' + (err.message || 'Lỗi kết nối'));
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
      alert('Đăng nhập nhanh thất bại: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setQuickLoading(false);
    }
  };

  const handleGoogleOAuth2Login = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="v2-login-wrap v2-anim">
        {/* Brand panel */}
        <div className="v2-login-brand">
          <div className="v2-blob" style={{ width: 220, height: 220, background: '#6366f1', top: -40, right: -40 }} />
          <div className="v2-blob" style={{ width: 180, height: 180, background: '#0d9488', bottom: -30, left: '10%', animationDelay: '-6s' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="v2-float" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14, padding: '0.7rem 1rem', marginBottom: '1.1rem', backdropFilter: 'blur(8px)' }}>
              <ShieldCheck size={26} />
              <b>InsurTech Policy</b>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.7rem', lineHeight: 1.3, color: '#fff' }}>
              Bảo hiểm thông minh<br />cho doanh nghiệp hiện đại
            </h2>
            <p style={{ color: '#dbeafe', fontSize: '0.92rem', maxWidth: 360 }}>
              Báo giá tức thì · Ký số OTP · Theo dõi hợp đồng theo thời gian thực — tất cả trong một nền tảng.
            </p>
            <div className="v2-glass" style={{ marginTop: '1.4rem', borderRadius: 14, padding: '0.9rem 1.1rem', display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: 380 }}>
              <div className="user-avatar" style={{ width: 42, height: 42, flexShrink: 0, background: 'var(--secondary)', fontSize: '1.1rem' }}>✓</div>
              <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                <b>12.400+ hợp đồng</b> đang được quản lý<br />
                <span style={{ color: '#dbeafe' }}>Vận hành ổn định 99,98% trong 12 tháng</span>
              </div>
            </div>
          </div>
          <div className="v2-marquee" style={{ position: 'relative', zIndex: 1, marginTop: '2rem' }}>
            <div className="v2-marquee-track" style={{ color: '#bfdbfe', fontSize: '0.82rem', fontWeight: 700 }}>
              <span>✦ BỒI THƯỜNG 24/7</span><span>✦ PHÍ MINH BẠCH</span><span>✦ KÝ SỐ OTP</span><span>✦ DÀNH CHO DOANH NGHIỆP</span>
              <span>✦ BỒI THƯỜNG 24/7</span><span>✦ PHÍ MINH BẠCH</span><span>✦ KÝ SỐ OTP</span><span>✦ DÀNH CHO DOANH NGHIỆP</span>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="glass-card v2-login-form">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="user-avatar" style={{ margin: '0 auto 1rem', width: 64, height: 64, backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <ShieldCheck size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>Đăng nhập</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Nền tảng quản lý hợp đồng bảo hiểm doanh nghiệp
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
            <span>Đăng nhập bằng Google</span>
          </button>

          {/* Quick Role Switchers (demo) */}
          <div style={{
            backgroundColor: 'var(--bg-main)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px dashed var(--border)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <KeyRound size={14} />
              <span>Đăng nhập nhanh (bản dùng thử)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickLogin('admin@insurtech.vn', 'ROLE_ADMIN', 'Quản trị viên')}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', backgroundColor: '#e11d48', borderColor: '#e11d48' }}
              >
                <ShieldCheck size={15} />
                <span>Đăng nhập Admin</span>
              </button>
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickLogin('khachhang@gmail.com', 'ROLE_USER', 'Khách hàng')}
                className="btn btn-outline"
                style={{ fontSize: '0.82rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={15} />
                <span>Đăng nhập User</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
            <span style={{ padding: '0 0.75rem' }}>Hoặc đăng nhập bằng Gmail</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
          </div>

          {/* OTP Email Form */}
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email</label>
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
                * Email thuộc <code>dungphdse@gmail.com</code> hoặc <code>admin@insurtech.vn</code> sẽ được gán quyền quản trị viên.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Đang gửi mã OTP...' : (
                <>
                  <span>Nhận mã OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.85rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
            <Lock size={16} style={{ shrink: 0, marginTop: '2px', color: 'var(--secondary)' }} />
            <span>Bảo mật đa lớp, đăng nhập an toàn bằng OTP.</span>
          </div>
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
