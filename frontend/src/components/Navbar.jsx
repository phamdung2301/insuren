import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, ShoppingBag, User, BarChart2, Cpu, LogOut, ChevronDown, Settings, FileWarning } from 'lucide-react';

export const Navbar = ({ user, onLogout, isAdmin }) => {
  const location = useLocation();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <ShieldCheck size={28} />
          <span>InsurTech Policy</span>
          <span className="brand-badge">{isAdmin ? 'Admin' : 'Enterprise'}</span>
        </Link>

        <ul className="nav-links">
          {/* User nav - always visible when logged in */}
          {user && (
            <>
              <li>
                <Link to="/my-policies" className={`nav-item ${isActive('/my-policies')}`}>
                  <FileText size={18} />
                  <span>{isAdmin ? 'Quản lý hợp đồng' : 'Hợp đồng của tôi'}</span>
                </Link>
              </li>
              <li>
                <Link to="/buy" className={`nav-item ${isActive('/buy')}`}>
                  <ShoppingBag size={18} />
                  <span>Mua bảo hiểm</span>
                </Link>
              </li>
              <li>
                <Link to="/claims" className={`nav-item ${isActive('/claims')}`}>
                  <FileWarning size={18} />
                  <span>Bồi thường</span>
                </Link>
              </li>
            </>
          )}

          {/* Admin-only nav */}
          {isAdmin && (
            <li style={{ position: 'relative' }}>
              <button
                className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Settings size={18} />
                <span>Quản trị</span>
                <ChevronDown size={14} style={{ transform: adminMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
              </button>

              {adminMenuOpen && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  minWidth: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  listStyle: 'none'
                }}>
                  <li>
                    <Link
                      to="/admin/reports"
                      className={`nav-item ${isActive('/admin/reports')}`}
                      style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', width: '100%' }}
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      <BarChart2 size={16} />
                      <span>Báo cáo</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/benchmark"
                      className={`nav-item ${isActive('/admin/benchmark')}`}
                      style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', width: '100%' }}
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      <Cpu size={16} />
                      <span>Kiểm tra hiệu năng</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}
        </ul>

        {/* User section */}
        <div className="user-menu">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/profile" className="nav-item" style={{ padding: 0 }}>
                <div
                  className="user-avatar"
                  title={`${user.email} (${isAdmin ? 'Admin' : 'User'})`}
                  style={{ position: 'relative' }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  {isAdmin && (
                    <span style={{
                      position: 'absolute',
                      bottom: -3,
                      right: -3,
                      width: 12,
                      height: 12,
                      backgroundColor: 'var(--secondary)',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} title="Admin" />
                  )}
                </div>
              </Link>
              <div style={{ fontSize: '0.82rem', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.fullName?.split(' ').slice(-1)[0] || user.email?.split('@')[0]}
                </div>
                <div style={{ color: isAdmin ? 'var(--secondary)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {isAdmin ? '★ ADMIN' : 'Khách hàng'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <User size={18} />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
