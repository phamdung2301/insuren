import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, KeyRound, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Profile = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Nguyễn Văn A',
    email: user?.email || 'nguyenvana@gmail.com',
    phone: user?.phone || '0901234567',
    address: user?.address || '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateUser({ ...user, ...formData });
    setMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp' });
      return;
    }
    setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
          {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Trang Cá Nhân</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Quản lý thông tin tài khoản và an toàn bảo mật</p>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: message.type === 'success' ? 'var(--status-active-bg)' : 'var(--status-cancelled-bg)',
          color: message.type === 'success' ? 'var(--status-active-text)' : 'var(--status-cancelled-text)'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Profile Info Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} />
            <span>Thông tin Cá nhân</span>
          </h3>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Họ và Tên</label>
              <input
                type="text"
                className="form-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ Gmail</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ thường trú</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={18} />
              <span>Lưu Thông tin</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} />
            <span>Đổi Mật Khẩu</span>
          </h3>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhập lại mật khẩu mới"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-outline" style={{ width: '100%', marginTop: '1.8rem' }}>
              <ShieldCheck size={18} />
              <span>Cập nhật Mật khẩu</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
