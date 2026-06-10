import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './api';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import PortfolioPage from './pages/PortfolioPage';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync token-based session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data);
          setBalance(res.data.balance);
        } catch (err) {
          console.error('Session validation failed:', err.message);
          // Token is invalid/expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  // Sync state on successful login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setBalance(userData.balance);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBalance(0);
  };

  // Helper to sync balance from server after executing trades
  const refreshUserSession = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data);
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Error syncing balance:', err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#080c14' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Connecting to ShopEZ Stocks...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100" style={{ background: '#080c14' }}>
        {user && (
          <Navbar 
            user={user} 
            balance={balance} 
            onLogout={handleLogout} 
          />
        )}
        
        <div className="flex-grow-1">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? <Navigate to="/" replace /> : <Register onLoginSuccess={handleLoginSuccess} />
              } 
            />

            {/* Protected Investor Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/stock/:symbol" 
              element={
                <ProtectedRoute>
                  <StockDetail 
                    user={user} 
                    balance={balance} 
                    refreshUserSession={refreshUserSession} 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                <ProtectedRoute>
                  <PortfolioPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected System Administrator Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
