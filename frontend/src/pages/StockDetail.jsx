import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ArrowLeft, Star, Plus, Minus, Info, TrendingUp, TrendingDown, ShieldAlert, Award } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Option premium calculation helper (Black-Scholes-like approximation)
const calculateOptionPremium = (stockPrice, strikePrice, optionType) => {
  const diff = stockPrice - strikePrice;
  const baseExtrinsic = stockPrice * 0.03;
  if (optionType === 'CALL') {
    if (diff > 0) {
      return Number((diff + baseExtrinsic).toFixed(2));
    } else {
      const distance = Math.abs(diff) / stockPrice;
      return Number(Math.max(0.05, baseExtrinsic * Math.exp(-distance * 12)).toFixed(2));
    }
  } else {
    if (diff < 0) {
      return Number((Math.abs(diff) + baseExtrinsic).toFixed(2));
    } else {
      const distance = Math.abs(diff) / stockPrice;
      return Number(Math.max(0.05, baseExtrinsic * Math.exp(-distance * 12)).toFixed(2));
    }
  }
};

const StockDetail = ({ user, balance, refreshUserSession }) => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [holding, setHolding] = useState(null); // Stock holding
  const [optionHoldings, setOptionHoldings] = useState([]); // List of option holdings for this symbol
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state: 'STOCK' or 'F&O'
  const [tradingTab, setTradingTab] = useState('STOCK');

  // Chart Timeframe State: '1D' | '1W' | '1M' | '1Y'
  const [timeframe, setTimeframe] = useState('1D');

  // Stock Trading States
  const [stockTradeType, setStockTradeType] = useState('BUY');
  const [stockQty, setStockQty] = useState(1);

  // Options Trading (F&O) States
  const [selectedOption, setSelectedOption] = useState(null); // { type: 'CALL'|'PUT', strike: Number, premium: Number }
  const [optionTradeType, setOptionTradeType] = useState('BUY');
  const [optionQty, setOptionQty] = useState(1); // Contracts (lots of 100)
  const [selectedExpiry, setSelectedExpiry] = useState('25-Jun-26');

  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);
  
  const pollTimer = useRef(null);

  const fetchStockData = async (isInitial = false) => {
    try {
      const stockRes = await API.get(`/stocks/${symbol}`);
      setStock(stockRes.data);

      const userRes = await API.get('/auth/me');
      setWatchlist(userRes.data.watchlist || []);

      // Fetch user's current holdings
      const portRes = await API.get('/portfolio');
      
      const stockHolding = portRes.data.stocks.find(h => h.symbol === symbol.toUpperCase());
      setHolding(stockHolding || null);

      const symbolOptions = portRes.data.options.filter(o => o.symbol === symbol.toUpperCase());
      setOptionHoldings(symbolOptions);

      if (isInitial) setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stock statistics.');
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(true);

    pollTimer.current = setInterval(() => {
      fetchStockData(false);
    }, 5000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [symbol]);

  const toggleWatchlist = async () => {
    try {
      const res = await API.post('/auth/watchlist', { symbol });
      setWatchlist(res.data.watchlist);
      
      // Update local storage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.watchlist = res.data.watchlist;
      localStorage.setItem('user', JSON.stringify(localUser));
    } catch (err) {
      console.error('Watchlist Error:', err);
    }
  };

  const handleStockTrade = async (e) => {
    e.preventDefault();
    if (stockQty <= 0 || !Number.isInteger(Number(stockQty))) {
      setTradeMessage({ type: 'danger', text: 'Please enter a valid positive integer quantity.' });
      return;
    }

    try {
      setTradeLoading(true);
      setTradeMessage(null);

      const endpoint = stockTradeType === 'BUY' ? '/transactions/buy' : '/transactions/sell';
      const res = await API.post(endpoint, {
        symbol,
        quantity: Number(stockQty),
        assetType: 'STOCK'
      });

      setTradeMessage({ type: 'success', text: res.data.message });
      setStockQty(1);
      
      await fetchStockData(false);
      refreshUserSession();
    } catch (err) {
      console.error(err);
      setTradeMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Transaction failed.'
      });
    } finally {
      setTradeLoading(false);
    }
  };

  const handleOptionTrade = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      setTradeMessage({ type: 'danger', text: 'Please select an option contract from the Option Chain first.' });
      return;
    }
    if (optionQty <= 0 || !Number.isInteger(Number(optionQty))) {
      setTradeMessage({ type: 'danger', text: 'Please enter a valid positive integer contract quantity.' });
      return;
    }

    try {
      setTradeLoading(true);
      setTradeMessage(null);

      const endpoint = optionTradeType === 'BUY' ? '/transactions/buy' : '/transactions/sell';
      const res = await API.post(endpoint, {
        symbol,
        quantity: Number(optionQty),
        assetType: 'OPTION',
        optionType: selectedOption.type,
        strikePrice: selectedOption.strike,
        expiryDate: selectedExpiry
      });

      setTradeMessage({ type: 'success', text: res.data.message });
      setOptionQty(1);
      
      await fetchStockData(false);
      refreshUserSession();
    } catch (err) {
      console.error(err);
      setTradeMessage({
        type: 'danger',
        text: err.response?.data?.message || 'F&O Order execution failed.'
      });
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error || 'Stock not found'}</div>
        <Link to="/" className="btn btn-secondary-custom mt-3">
          <ArrowLeft size={14} className="me-2" /> Back to Explore
        </Link>
      </div>
    );
  }

  const isWatchlisted = watchlist.includes(symbol.toUpperCase());
  const isGain = stock.changePercent >= 0;

  // Generate simulated chart history points based on timeframe selected
  let displayedHistory = [];
  if (stock.history) {
    const raw = [...stock.history];
    if (timeframe === '1D') {
      displayedHistory = raw.slice(-12); // Last 12 intervals
    } else if (timeframe === '1W') {
      displayedHistory = raw.slice(-20);
    } else if (timeframe === '1M') {
      displayedHistory = raw;
    } else { // 1Y
      displayedHistory = raw.slice(0, 15);
    }
  }

  const chartLabels = displayedHistory.map((pt, index) => {
    const dateObj = new Date(pt.date);
    if (timeframe === '1D') {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });

  const chartValues = displayedHistory.map(pt => pt.price);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        fill: true,
        borderColor: isGain ? '#00d09c' : '#ff5353',
        backgroundColor: isGain ? 'rgba(0, 208, 156, 0.02)' : 'rgba(255, 83, 83, 0.02)',
        tension: 0.15,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#121822',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { family: 'Inter', size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#6b7280', font: { family: 'Inter', size: 9 } }
      }
    }
  };

  // Generate Option Chain Strikes centered around stock price
  // e.g. Stock price is 1520 -> strikes: 1500, 1510, 1520, 1530, 1540
  const basePrice = Math.round(stock.price / 10) * 10;
  const strikesList = [basePrice - 20, basePrice - 10, basePrice, basePrice + 10, basePrice + 20];

  return (
    <div className="page-container">
      {/* Back to Explore link */}
      <Link to="/" className="btn btn-secondary-custom py-2 px-3 mb-4 d-inline-flex align-items-center gap-1.5">
        <ArrowLeft size={14} />
        Back to Explore
      </Link>

      <div className="row g-4">
        {/* Left Side: Stock metrics & interactive charts */}
        <div className="col-lg-8">
          <div className="glass-card mb-4">
            {/* Header with Watchlist toggle button */}
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.75rem', background: '#1a2232' }}>{stock.symbol}</span>
                    <button 
                      className={`watchlist-btn ${isWatchlisted ? 'active' : ''}`}
                      onClick={toggleWatchlist}
                    >
                      <Star size={20} fill={isWatchlisted ? '#ff9f0a' : 'transparent'} />
                    </button>
                  </div>
                  <h2 className="text-white fw-bold mb-1">{stock.name}</h2>
                </div>
              </div>

              <div className="text-end">
                <h1 className="fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  ₹{stock.price.toFixed(2)}
                </h1>
                <div className={`fw-bold d-flex align-items-center justify-content-end gap-1 mt-1 ${isGain ? 'stock-up' : 'stock-down'}`}>
                  {isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{isGain ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Timeframe Selectors */}
            <div className="d-flex justify-content-end gap-1 mb-3">
              {['1D', '1W', '1M', '1Y'].map(tf => (
                <button
                  key={tf}
                  className={`btn py-1 px-2.5 small fw-bold border-0 ${timeframe === tf ? 'btn-success text-dark' : 'btn-dark bg-transparent text-secondary'}`}
                  style={timeframe === tf ? { background: '#00d09c', fontSize: '0.75rem' } : { fontSize: '0.75rem' }}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Area */}
            <div style={{ height: '320px', position: 'relative' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Option Chain section (F&O tab) */}
          {tradingTab === 'F&O' && (
            <div className="glass-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-white fw-bold mb-0">Option Chain (Contracts)</h5>
                
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary small">Expiry:</span>
                  <select 
                    className="form-select form-input-custom py-1" 
                    style={{ width: '130px', fontSize: '0.8rem' }}
                    value={selectedExpiry}
                    onChange={(e) => setSelectedExpiry(e.target.value)}
                  >
                    <option value="25-Jun-26">25-Jun-26 (End)</option>
                    <option value="30-Jul-26">30-Jul-26 (Next)</option>
                  </select>
                </div>
              </div>

              <p className="text-muted small mb-3">Click on a premium cell to select CALL (Left) or PUT (Right) contract</p>

              <div className="option-chain-grid">
                {/* Grid header */}
                <div className="option-chain-header">CALL PREMIUM (BUY/SELL)</div>
                <div className="option-chain-header border-start border-end" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>STRIKE</div>
                <div className="option-chain-header">PUT PREMIUM (BUY/SELL)</div>

                {strikesList.map((strike) => {
                  const callPremium = calculateOptionPremium(stock.price, strike, 'CALL');
                  const putPremium = calculateOptionPremium(stock.price, strike, 'PUT');
                  
                  const isCallSelected = selectedOption && selectedOption.type === 'CALL' && selectedOption.strike === strike;
                  const isPutSelected = selectedOption && selectedOption.type === 'PUT' && selectedOption.strike === strike;

                  return (
                    <React.Fragment key={strike}>
                      {/* Call Premium Cell */}
                      <div 
                        className={`option-chain-cell option-itm ${isCallSelected ? 'option-selected-cell' : ''}`}
                        onClick={() => setSelectedOption({ type: 'CALL', strike, premium: callPremium })}
                      >
                        <span className="text-secondary small">Call</span>
                        <span className="fw-bold text-white">₹{callPremium.toFixed(2)}</span>
                      </div>
                      
                      {/* Strike price index */}
                      <div className="option-chain-strike-col py-2 border-start border-end" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-muted small font-monospace">₹{strike}</span>
                      </div>
                      
                      {/* Put Premium Cell */}
                      <div 
                        className={`option-chain-cell ${isPutSelected ? 'option-selected-cell' : ''}`}
                        onClick={() => setSelectedOption({ type: 'PUT', strike, premium: putPremium })}
                      >
                        <span className="fw-bold text-white">₹{putPremium.toFixed(2)}</span>
                        <span className="text-secondary small">Put</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats overview cards */}
          <div className="row g-3">
            {[
              { label: "TODAY'S HIGH", value: `₹${stock.high.toFixed(2)}` },
              { label: "TODAY'S LOW", value: `₹${stock.low.toFixed(2)}` },
              { label: "SHARES OWNED", value: holding ? `${holding.shares} shares` : '0 shares' },
              { label: "AVERAGE COST", value: holding ? `₹${holding.averageBuyPrice.toFixed(2)}` : 'N/A' }
            ].map((stat, idx) => (
              <div key={idx} className="col-sm-6 col-md-3">
                <div className="glass-card text-center p-3">
                  <span className="text-secondary small fw-bold d-block mb-1">{stat.label}</span>
                  <span className="text-white fw-bold mb-0" style={{ fontSize: '1rem' }}>{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Render Option Positions for this stock if any exist */}
          {optionHoldings.length > 0 && (
            <div className="glass-card mt-4">
              <h5 className="text-white fw-bold mb-3">Your Options Positions ({symbol})</h5>
              <div className="table-responsive">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>EXPIRY</th>
                      <th>STRIKE</th>
                      <th>TYPE</th>
                      <th className="text-end">LOTS</th>
                      <th className="text-end">BUY PREMIUM</th>
                      <th className="text-end">CURRENT PREMIUM</th>
                      <th className="text-end">PNL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionHoldings.map((opt) => {
                      const gainUp = opt.gainLoss >= 0;
                      return (
                        <tr 
                          key={opt._id}
                          className="cursor-pointer"
                          onClick={() => {
                            setTradingTab('F&O');
                            setSelectedOption({ type: opt.optionType, strike: opt.strikePrice, premium: opt.currentPremium });
                            setSelectedExpiry(opt.expiryDate);
                          }}
                        >
                          <td className="text-white small">{opt.expiryDate}</td>
                          <td className="text-white font-monospace">₹{opt.strikePrice}</td>
                          <td>
                            <span className={`badge ${opt.optionType === 'CALL' ? 'bg-success' : 'bg-danger'}`}>
                              {opt.optionType}
                            </span>
                          </td>
                          <td className="text-end text-white">{opt.shares}</td>
                          <td className="text-end text-secondary">₹{opt.averageBuyPrice.toFixed(2)}</td>
                          <td className="text-end text-white fw-bold">₹{opt.currentPremium.toFixed(2)}</td>
                          <td className={`text-end fw-bold ${gainUp ? 'stock-up' : 'stock-down'}`}>
                            {gainUp ? '+' : ''}₹{opt.gainLoss.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Options vs Stock Trading widgets */}
        <div className="col-lg-4">
          <div className="glass-card">
            {/* Tab selection */}
            <div className="options-tabs-container mb-4">
              <button
                className={`options-tab-btn ${tradingTab === 'STOCK' ? 'active' : ''}`}
                onClick={() => {
                  setTradingTab('STOCK');
                  setTradeMessage(null);
                }}
              >
                STOCK
              </button>
              <button
                className={`options-tab-btn ${tradingTab === 'F&O' ? 'active' : ''}`}
                onClick={() => {
                  setTradingTab('F&O');
                  setTradeMessage(null);
                }}
              >
                F&O (OPTIONS)
              </button>
            </div>

            {/* Alert banner */}
            {tradeMessage && (
              <div className={`alert alert-${tradeMessage.type} border-0 small fw-bold mb-4`} role="alert">
                {tradeMessage.text}
              </div>
            )}

            {/* STOCK TRADING WIDGET */}
            {tradingTab === 'STOCK' ? (
              <form onSubmit={handleStockTrade}>
                <div className="d-flex gap-2 p-1 bg-dark rounded-3 mb-4" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold ${stockTradeType === 'BUY' ? 'btn-success' : 'btn-dark bg-transparent text-secondary'}`}
                    onClick={() => { setStockTradeType('BUY'); setTradeMessage(null); }}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold ${stockTradeType === 'SELL' ? 'btn-danger' : 'btn-dark bg-transparent text-secondary'}`}
                    onClick={() => { setStockTradeType('SELL'); setTradeMessage(null); }}
                  >
                    SELL
                  </button>
                </div>

                <div className="d-flex justify-content-between mb-3 pb-2 border-bottom border-color" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-secondary">Stock Price</span>
                  <span className="text-white fw-bold">₹{stock.price.toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary">{stockTradeType === 'BUY' ? 'Available Balance' : 'Available Shares'}</span>
                  <span className="text-white fw-semibold">
                    {stockTradeType === 'BUY' 
                      ? `₹${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${holding ? holding.shares : 0} shares`
                    }
                  </span>
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-bold">QUANTITY (SHARES)</label>
                  <div className="input-group">
                    <button 
                      type="button" 
                      className="btn btn-secondary-custom py-2"
                      onClick={() => setStockQty(prev => Math.max(1, prev - 1))}
                      disabled={stockQty <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" 
                      className="form-control form-input-custom text-center py-2" 
                      value={stockQty}
                      onChange={(e) => setStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary-custom py-2"
                      onClick={() => setStockQty(prev => prev + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: '#161e2b', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span className="text-secondary small fw-bold">ESTIMATED TOTAL</span>
                  <span className="text-white fw-bold h4 mb-0">
                    ₹{(stock.price * stockQty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  type="submit" 
                  className={`btn w-100 py-3 fw-bold text-white ${stockTradeType === 'BUY' ? 'btn-success' : 'btn-danger'}`}
                  disabled={tradeLoading}
                >
                  {tradeLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : stockTradeType === 'BUY' ? 'Buy Shares' : 'Sell Shares'}
                </button>
              </form>
            ) : (
              /* OPTIONS (F&O) TRADING WIDGET */
              <form onSubmit={handleOptionTrade}>
                <div className="d-flex gap-2 p-1 bg-dark rounded-3 mb-4" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold ${optionTradeType === 'BUY' ? 'btn-success' : 'btn-dark bg-transparent text-secondary'}`}
                    onClick={() => { setOptionTradeType('BUY'); setTradeMessage(null); }}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold ${optionTradeType === 'SELL' ? 'btn-danger' : 'btn-dark bg-transparent text-secondary'}`}
                    onClick={() => { setOptionTradeType('SELL'); setTradeMessage(null); }}
                  >
                    SELL
                  </button>
                </div>

                {selectedOption ? (
                  <div className="mb-3 p-3 rounded" style={{ background: '#161e2b', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary small fw-bold">CONTRACT</span>
                      <span className="text-white fw-bold small">{selectedOption.strike} {selectedOption.type}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary small">Premium Value</span>
                      <span className="text-white fw-semibold">₹{selectedOption.premium.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary small">Lot Size</span>
                      <span className="text-secondary fw-semibold">100 shares</span>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-secondary border-0 p-3 small text-center mb-4">
                    Please select a CALL or PUT contract in the Option Chain table.
                  </div>
                )}

                <div className="d-flex justify-content-between mb-3 pb-2 border-bottom border-color" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-secondary">Selected Expiry</span>
                  <span className="text-white fw-semibold">{selectedExpiry}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary">{optionTradeType === 'BUY' ? 'Available Balance' : 'Owned Lots'}</span>
                  <span className="text-white fw-semibold">
                    {optionTradeType === 'BUY' 
                      ? `₹${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${
                          optionHoldings.find(
                            o => o.strikePrice === selectedOption?.strike && o.optionType === selectedOption?.type && o.expiryDate === selectedExpiry
                          )?.shares || 0
                        } lots`
                    }
                  </span>
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-bold">QUANTITY (LOTS - MULTIPLES OF 100)</label>
                  <div className="input-group">
                    <button 
                      type="button" 
                      className="btn btn-secondary-custom py-2"
                      onClick={() => setOptionQty(prev => Math.max(1, prev - 1))}
                      disabled={optionQty <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" 
                      className="form-control form-input-custom text-center py-2" 
                      value={optionQty}
                      onChange={(e) => setOptionQty(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary-custom py-2"
                      onClick={() => setOptionQty(prev => prev + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: '#161e2b', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span className="text-secondary small fw-bold">ESTIMATED TOTAL</span>
                  <span className="text-white fw-bold h4 mb-0">
                    ₹{selectedOption 
                      ? (selectedOption.premium * optionQty * 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : '0.00'
                    }
                  </span>
                </div>

                <button 
                  type="submit" 
                  className={`btn w-100 py-3 fw-bold text-white ${optionTradeType === 'BUY' ? 'btn-success' : 'btn-danger'}`}
                  disabled={tradeLoading || !selectedOption}
                >
                  {tradeLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : optionTradeType === 'BUY' ? 'Buy Contracts' : 'Sell Contracts'}
                </button>
              </form>
            )}

            <div className="mt-4 p-3 rounded d-flex gap-2" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
              <p className="text-muted small mb-0 lh-base" style={{ fontSize: '0.75rem' }}>
                F&O positions calculate risk automatically. 1 lot represents an option contract for 100 shares of the underlying equity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
