import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Briefcase, ShieldAlert, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = ({ user, balance, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3 sticky-top">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '32px', height: '32px', background: '#00d09c' }}>
            <TrendingUp className="text-dark" size={18} style={{ color: '#0c111a' }} />
          </div>
          <span className="fw-bold tracking-tight" style={{ fontSize: '1.25rem', letterSpacing: '-0.01em', color: '#f3f4f6' }}>
            Shop<span style={{ color: '#00d09c' }}>EZ</span> Stocks
          </span>
        </Link>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent" 
          aria-controls="navbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 ms-lg-4">
            <li className="nav-item">
              <Link 
                className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${location.pathname === '/' ? 'active' : ''}`} 
                to="/"
              >
                <TrendingUp size={16} />
                Explore
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${location.pathname === '/portfolio' ? 'active' : ''}`} 
                to="/portfolio"
              >
                <Briefcase size={16} />
                Investments
              </Link>
            </li>
            {user.role === 'ADMIN' && (
              <li className="nav-item">
                <Link 
                  className={`nav-link nav-link-custom d-flex align-items-center gap-2 text-warning ${location.pathname === '/admin' ? 'active' : ''}`} 
                  to="/admin"
                >
                  <ShieldAlert size={16} />
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-4 flex-wrap mt-3 mt-lg-0">
            {/* Cash Balance Display */}
            <div className="text-end">
              <div className="text-secondary small fw-semibold" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>VIRTUAL BALANCE</div>
              <div className="fw-bold stock-up" style={{ fontSize: '1.1rem', color: '#00d09c' }}>
                ₹{Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Profile badge */}
            <div className="d-flex align-items-center gap-2 py-1 px-3 border border-secondary rounded-pill" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <UserIcon size={14} className="text-muted" />
              <span className="fw-semibold small" style={{ fontSize: '0.8rem' }}>{user.username}</span>
              <span className={user.role === 'ADMIN' ? 'badge-custom-admin' : 'badge-custom-user'}>
                {user.role}
              </span>
            </div>

            {/* Sign Out Button */}
            <button 
              className="btn btn-link text-decoration-none nav-link-custom p-0 d-flex align-items-center gap-1 border-0"
              onClick={handleLogoutClick}
              style={{ color: '#9ca3af' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
