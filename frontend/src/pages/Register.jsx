import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';

const Register = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await API.post('/auth/register', { username, email, password });
      
      // Store session
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      onLoginSuccess(res.data.user);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-extrabold text-white">Create Account</h2>
          <p className="text-muted">Register to receive ₹50,000 in virtual trading cash</p>
        </div>

        <div className="glass-card">
          <h3 className="h4 text-white mb-4 fw-bold d-flex align-items-center gap-2">
            <UserPlus size={22} className="text-primary-color" style={{ color: '#5e5ce6' }} />
            Sign Up
          </h3>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 bg-stock-down text-danger border-0 p-3 mb-4" role="alert">
              <AlertCircle size={20} />
              <div className="small fw-semibold">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">USERNAME</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <User size={18} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control form-input-custom border-start-0" 
                  placeholder="johndoe" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required 
                />
              </div>
            </div>

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
              ) : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="small fw-semibold text-primary-color text-decoration-none" style={{ color: '#5e5ce6' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
