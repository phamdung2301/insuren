import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const OtpModal = ({ email, isOpen, onClose, onVerify }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
    setError('');

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Bạn nhập đủ 6 số của mã OTP nhé');
      return;
    }
    if (timeLeft === 0) {
      setError('Mã OTP đã hết hạn, bạn bấm gửi lại mã mới nhé');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onVerify(otp);
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="user-avatar" style={{ margin: '0 auto 1rem', width: 56, height: 56, backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Mail size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Xác thực OTP</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Mã gồm 6 số đã được gửi đến <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mã OTP (6 chữ số)</span>
              <span style={{ color: timeLeft < 60 ? 'var(--status-cancelled-text)' : 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} />
                {formatTime(timeLeft)}
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
