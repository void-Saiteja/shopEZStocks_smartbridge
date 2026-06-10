import React, { useState, useEffect } from 'react';
import API from '../api';
import { Shield, Plus, Edit, Trash2, Check, X, ClipboardList, Database, AlertCircle, Users, RotateCcw, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks', 'audit', or 'users'
  const [stocks, setStocks] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [users, setUsers] = useState([]);
  
  // New Stock Form
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Inline Editing State
  const [editingSymbol, setEditingSymbol] = useState(null); // Symbol of stock being edited
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // User Editing State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserBalance, setEditUserBalance] = useState('');

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stocks
      const stocksRes = await API.get('/stocks');
      setStocks(stocksRes.data);

      // Fetch global system transactions (Admin Only)
      const auditRes = await API.get('/transactions/admin/all');
      setAuditLog(auditRes.data);

      // Fetch all system users (Admin Only)
      const usersRes = await API.get('/auth/admin/users');
      setUsers(usersRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // User Directory Handlers
  // ==========================================
  const handleStartEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserRole(user.role);
    setEditUserBalance(user.balance.toString());
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
  };

  const handleSaveEditUser = async (userId) => {
    try {
      await API.put(`/auth/admin/users/${userId}`, {
        role: editUserRole,
        balance: Number(editUserBalance)
      });
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating user profile.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete/ban user ${username}? All transaction history for this user will remain in system logs but credentials will be deactivated.`)) {
      return;
    }

    try {
      await API.delete(`/auth/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting user.');
    }
  };

  // ==========================================
  // Transaction Rollback Handler
  // ==========================================
  const handleRollbackTrade = async (txId, symbol, type) => {
    if (!window.confirm(`Are you sure you want to cancel and ROLLBACK this trade? Reversing this transaction will restore cash balances and revert portfolio holdings.`)) {
      return;
    }

    try {
      const res = await API.post(`/transactions/admin/rollback/${txId}`);
      alert(res.data.message);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error rolling back transaction.');
    }
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newSymbol || !newName || !newPrice) {
      setFormError('Please enter all stock fields.');
      return;
    }

    try {
      const res = await API.post('/stocks', {
        symbol: newSymbol.toUpperCase(),
        name: newName,
        price: Number(newPrice)
      });
      
      setFormSuccess(res.data.message);
      setNewSymbol('');
      setNewName('');
      setNewPrice('');
      
      // Refresh list
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.message || 'Failed to add stock. Symbol might be taken.'
      );
    }
  };

  const handleStartEdit = (stock) => {
    setEditingSymbol(stock.symbol);
    setEditName(stock.name);
    setEditPrice(stock.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingSymbol(null);
  };

  const handleSaveEdit = async (symbol) => {
    try {
      await API.put(`/stocks/${symbol}`, {
        name: editName,
        price: Number(editPrice)
      });
      setEditingSymbol(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating stock listing.');
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (!window.confirm(`Are you sure you want to delete the stock listing for ${symbol}? This action cannot be undone.`)) {
      return;
    }

    try {
      await API.delete(`/stocks/${symbol}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting stock listing.');
    }
  };

  return (
    <div className="page-container">
      {/* Title Banner */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Shield size={36} className="text-warning" />
        <div>
          <h2 className="text-white fw-bold mb-0">System Control Center</h2>
          <span className="text-muted small">Role-restricted Administrator Control Room</span>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4" style={{ borderColor: 'rgba(255,255,255,0.08) !important' }}>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 bg-transparent py-3 px-4 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'stocks' ? 'active text-primary-color border-bottom border-primary' : 'text-secondary'}`}
            style={activeTab === 'stocks' ? { borderBottom: '2px solid #5e5ce6 !important', color: '#5e5ce6' } : {}}
            onClick={() => setActiveTab('stocks')}
          >
            <Database size={18} />
            Stock Listings Management
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 bg-transparent py-3 px-4 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'audit' ? 'active text-primary-color border-bottom border-primary' : 'text-secondary'}`}
            style={activeTab === 'audit' ? { borderBottom: '2px solid #5e5ce6 !important', color: '#5e5ce6' } : {}}
            onClick={() => setActiveTab('audit')}
          >
            <ClipboardList size={18} />
            Global Trade Audits
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 bg-transparent py-3 px-4 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'users' ? 'active text-primary-color border-bottom border-primary' : 'text-secondary'}`}
            style={activeTab === 'users' ? { borderBottom: '2px solid #5e5ce6 !important', color: '#5e5ce6' } : {}}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            User Directory
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : activeTab === 'stocks' ? (
        <div className="row g-4">
          {/* Add Stock Listing Form */}
          <div className="col-lg-4">
            <div className="glass-card">
              <h4 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                <Plus size={20} className="text-primary-color" style={{ color: '#5e5ce6' }} />
                New Listing
              </h4>

              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 bg-stock-down text-danger border-0 p-3 mb-3" role="alert">
                  <AlertCircle size={18} />
                  <span className="small fw-semibold">{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 bg-stock-up text-success border-0 p-3 mb-3" role="alert">
                  <Check size={18} />
                  <span className="small fw-semibold">{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddStockSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">TICKER SYMBOL</label>
                  <input 
                    type="text" 
                    className="form-control form-input-custom text-uppercase" 
                    placeholder="e.g. BTC" 
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">COMPANY NAME</label>
                  <input 
                    type="text" 
                    className="form-control form-input-custom" 
                    placeholder="e.g. Bitcoin Trust" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required 
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">INITIAL STOCK PRICE (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control form-input-custom" 
                    placeholder="100.00" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    min="0.01"
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary-custom w-100 py-3">
                  Launch Asset Listing
                </button>
              </form>
            </div>
          </div>

          {/* Current Stock Listings Table */}
          <div className="col-lg-8">
            <div className="glass-card">
              <h4 className="text-white fw-bold mb-4">Stock Listings Catalog</h4>
              
              <div className="table-responsive">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>SYMBOL</th>
                      <th>NAME</th>
                      <th className="text-end">MARKET PRICE</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const isEditing = editingSymbol === stock.symbol;

                      return (
                        <tr key={stock.symbol}>
                          <td className="fw-bold text-white">{stock.symbol}</td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="text" 
                                className="form-control form-input-custom py-1 px-2"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            ) : (
                              <span className="text-secondary">{stock.name}</span>
                            )}
                          </td>
                          <td className="text-end text-white fw-bold">
                            {isEditing ? (
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-control form-input-custom py-1 px-2 text-end d-inline-block"
                                style={{ maxWidth: '120px' }}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                              />
                            ) : (
                              `₹${stock.price.toFixed(2)}`
                            )}
                          </td>
                          <td className="text-center">
                            {isEditing ? (
                              <div className="d-flex justify-content-center gap-2">
                                <button 
                                  className="btn btn-success py-1 px-2 d-flex align-items-center"
                                  onClick={() => handleSaveEdit(stock.symbol)}
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  className="btn btn-danger py-1 px-2 d-flex align-items-center"
                                  onClick={handleCancelEdit}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-center gap-2">
                                <button 
                                  className="btn btn-secondary-custom py-1 px-2 d-flex align-items-center"
                                  onClick={() => handleStartEdit(stock)}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn btn-danger py-1 px-2 d-flex align-items-center"
                                  onClick={() => handleDeleteStock(stock.symbol)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'audit' ? (
        /* System Audit Logs Tab */
        <div className="glass-card">
          <h4 className="text-white fw-bold mb-4">Global Trade Transaction Registry</h4>
          
          {auditLog.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No transactions have been logged in the system.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>DATE & TIME</th>
                    <th>TRADER ID</th>
                    <th>ACTION</th>
                    <th>SYMBOL</th>
                    <th className="text-end">QUANTITY</th>
                    <th className="text-end">PRICE</th>
                    <th className="text-end">TOTAL VALUE</th>
                    <th className="text-center">MODERATION</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    const dateObj = new Date(tx.timestamp);

                    return (
                      <tr key={tx._id}>
                        <td className="text-secondary small">
                          {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                        </td>
                        <td className="text-secondary small font-monospace">{tx.userId}</td>
                        <td>
                          <span className={`badge ${isBuy ? 'bg-success' : 'bg-danger'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="fw-bold text-white">{tx.symbol}</td>
                        <td className="text-end text-white">{tx.quantity}</td>
                        <td className="text-end text-secondary">₹{tx.price.toFixed(2)}</td>
                        <td className="text-end text-white fw-bold">₹{tx.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-center">
                          <button 
                            className="btn btn-danger py-1 px-2.5 d-flex align-items-center gap-1.5 mx-auto"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleRollbackTrade(tx._id, tx.symbol, tx.type)}
                          >
                            <RotateCcw size={12} />
                            Rollback
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* System Users Directory Tab */
        <div className="glass-card">
          <h4 className="text-white fw-bold mb-4">Trader Directory</h4>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>EMAIL ADDRESS</th>
                  <th>ROLE</th>
                  <th className="text-end">VIRTUAL CASH</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted small">
                      No system users registered.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isEditing = editingUserId === user.id;

                    return (
                      <tr key={user.id}>
                        <td className="fw-bold text-white">{user.username}</td>
                        <td className="text-secondary">{user.email}</td>
                        <td>
                          {isEditing ? (
                            <select 
                              className="form-select form-input-custom py-1"
                              style={{ maxWidth: '120px', fontSize: '0.85rem' }}
                              value={editUserRole}
                              onChange={(e) => setEditUserRole(e.target.value)}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className={`badge ${user.role === 'ADMIN' ? 'bg-warning text-dark' : 'bg-primary text-white'}`} style={user.role === 'ADMIN' ? { background: 'rgba(255, 159, 10, 0.1)', color: '#ff9f0a' } : { background: 'rgba(94, 92, 230, 0.1)', color: '#5e5ce6' }}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="text-end text-white fw-bold">
                          {isEditing ? (
                            <input 
                              type="number" 
                              step="0.01" 
                              className="form-control form-input-custom py-1 px-2 text-end d-inline-block"
                              style={{ maxWidth: '140px' }}
                              value={editUserBalance}
                              onChange={(e) => setEditUserBalance(e.target.value)}
                              min="0"
                            />
                          ) : (
                            `₹${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td className="text-center">
                          {isEditing ? (
                            <div className="d-flex justify-content-center gap-2">
                              <button 
                                className="btn btn-success py-1 px-2 d-flex align-items-center"
                                onClick={() => handleSaveEditUser(user.id)}
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                className="btn btn-danger py-1 px-2 d-flex align-items-center"
                                onClick={handleCancelEditUser}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex justify-content-center gap-2">
                              <button 
                                className="btn btn-secondary-custom py-1 px-2 d-flex align-items-center"
                                onClick={() => handleStartEditUser(user)}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="btn btn-danger py-1 px-2 d-flex align-items-center"
                                onClick={() => handleDeleteUser(user.id, user.username)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
