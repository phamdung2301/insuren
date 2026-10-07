import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CustomerPortal from './pages/CustomerPortal';
import BuyInsurance from './pages/BuyInsurance';
import PolicyDetail from './pages/PolicyDetail';
import AdminDashboard from './pages/AdminDashboard';
import BenchmarkView from './pages/BenchmarkView';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null; // null = not logged in (no default user)
  });

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isLoggedIn = !!user;

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Protected route: requires login
  const ProtectedRoute = ({ element, requireAdmin = false }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (requireAdmin && !isAdmin) return <Navigate to="/my-policies" replace />;
    return element;
  };

  return (
    <Router>
      <div className="app-layout">
        <Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} />
        <main className="main-content">
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to={isLoggedIn ? '/my-policies' : '/login'} replace />} />

            {/* Public: Login page */}
            <Route path="/login" element={
              isLoggedIn ? <Navigate to="/my-policies" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
            } />

            {/* Protected: User pages */}
            <Route path="/profile" element={<ProtectedRoute element={<Profile user={user} />} />} />
            <Route path="/my-policies" element={<ProtectedRoute element={<CustomerPortal user={user} isAdmin={isAdmin} />} />} />
            <Route path="/buy" element={<ProtectedRoute element={<BuyInsurance user={user} />} />} />
            <Route path="/policies/:policyNumber" element={<ProtectedRoute element={<PolicyDetail user={user} isAdmin={isAdmin} />} />} />

            {/* Protected: Admin-only pages */}
            <Route path="/admin/reports" element={<ProtectedRoute element={<AdminDashboard />} requireAdmin />} />
            <Route path="/admin/benchmark" element={<ProtectedRoute element={<BenchmarkView />} requireAdmin />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={isLoggedIn ? '/my-policies' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
