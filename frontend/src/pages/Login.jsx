import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await API.post('/auth/login', { email, password });
      
      // Store auth session
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      onLoginSuccess(res.data.user);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick logging in
  const quickFill = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-extrabold text-white">Welcome to Shop<span style={{ color: '#5e5ce6' }}>EZ</span> Stocks</h2>
          <p className="text-muted">Effortless stock trading & portfolio simulation</p>
        </div>

        <div className="glass-card">
          <h3 className="h4 text-white mb-4 fw-bold d-flex align-items-center gap-2">
            <LogIn size={22} className="text-primary-color" style={{ color: '#5e5ce6' }} />
            Sign In
          </h3>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 bg-stock-down text-danger border-0 p-3 mb-4" role="alert">
              <AlertCircle size={20} />
              <div className="small fw-semibold">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">EMAIL ADDRESS</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Mail size={18} className="text-muted" />
                </span>
                <input 
                  type="email" 
                  className="form-control form-input-custom border-start-0" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required 
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">PASSWORD</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Lock size={18} className="text-muted" />
                </span>
                <input 
                  type="password" 
                  className="form-control form-input-custom border-start-0" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-4 pt-4 border-top border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="text-muted small fw-semibold mb-3 text-center">DEMO ACCOUNTS (QUICK-FILL)</div>
            <div className="d-grid gap-2">
              <button 
                type="button" 
                className="btn btn-secondary-custom py-2 text-start d-flex justify-content-between align-items-center"
                onClick={() => quickFill('trader@shopez.com', 'traderpassword')}
                disabled={loading}
              >
                <span>Trader Account</span>
                <span className="badge-custom-user">USER</span>
              </button>
              <button 
                type="button" 
                className="btn btn-secondary-custom py-2 text-start d-flex justify-content-between align-items-center"
                onClick={() => quickFill('admin@shopez.com', 'adminpassword')}
                disabled={loading}
              >
                <span>Admin Panel</span>
                <span className="badge-custom-admin">ADMIN</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/register" className="small fw-semibold text-primary-color text-decoration-none" style={{ color: '#5e5ce6' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
