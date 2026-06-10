import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Search, Star, TrendingUp, TrendingDown, RefreshCw, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'watchlist'
  const [marketStats, setMarketStats] = useState({ nifty: 22320.50, sensex: 73510.40 });
  const [prevPrices, setPrevPrices] = useState({});
  const [priceFlash, setPriceFlash] = useState({}); // { [symbol]: 'up' | 'down' }
  const navigate = useNavigate();
  const pollTimer = useRef(null);
  const searchContainerRef = useRef(null);

  const fetchStocksAndWatchlist = async (isInitial = false) => {
    try {
      // 1. Fetch live stocks
      const res = await API.get('/stocks');
      const data = res.data;

      // 2. Fetch latest user details (for watchlist sync)
      const userRes = await API.get('/auth/me');
      setWatchlist(userRes.data.watchlist || []);
      
      // Update local storage user profile with latest watchlist
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.watchlist = userRes.data.watchlist || [];
      localStorage.setItem('user', JSON.stringify(localUser));

      if (!isInitial) {
        // Compare prices for flashing tickers
        const newFlash = {};
        data.forEach(stock => {
          const oldPrice = prevPrices[stock.symbol];
          if (oldPrice !== undefined) {
            if (stock.price > oldPrice) {
              newFlash[stock.symbol] = 'up';
            } else if (stock.price < oldPrice) {
              newFlash[stock.symbol] = 'down';
            }
          }
        });

        if (Object.keys(newFlash).length > 0) {
          setPriceFlash(newFlash);
          setTimeout(() => setPriceFlash({}), 1200);
        }
      }

      const priceMap = {};
      data.forEach(s => {
        priceMap[s.symbol] = s.price;
      });
      
      setPrevPrices(priceMap);
      setStocks(data);

      // Simulate Nifty & Sensex ticks
      setMarketStats(prev => ({
        nifty: Number((prev.nifty + (Math.random() - 0.5) * 8).toFixed(2)),
        sensex: Number((prev.sensex + (Math.random() - 0.5) * 25).toFixed(2))
      }));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksAndWatchlist(true);

    pollTimer.current = setInterval(() => {
      fetchStocksAndWatchlist(false);
    }, 5000);

    // Click outside handler for search autocomplete dropdown
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [prevPrices]);

  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`);
  };

  const toggleWatchlist = async (e, symbol) => {
    e.stopPropagation(); // Avoid row navigation trigger
    try {
      const res = await API.post('/auth/watchlist', { symbol });
      setWatchlist(res.data.watchlist);
      
      // Update local storage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.watchlist = res.data.watchlist;
      localStorage.setItem('user', JSON.stringify(localUser));
    } catch (err) {
      console.error('Watchlist Update Error:', err);
    }
  };

  // Autocomplete matching stocks list
  const searchResults = search.trim() === '' ? [] : stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
    stock.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filters catalog stocks based on active tab
  const displayedStocks = stocks.filter(stock => {
    // Watchlist tab filter
    if (activeTab === 'watchlist' && !watchlist.includes(stock.symbol)) {
      return false;
    }
    
    // Search input filter
    if (search.trim() !== '') {
      return stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
             stock.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const gainers = [...stocks]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);

  const losers = [...stocks]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);

  const niftyChangeUp = true; // Groww aesthetic default Nifty indexes
  const sensexChangeUp = true;

  return (
    <div className="page-container">
      {/* 1. Indian Indices Panel */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="glass-card d-flex justify-content-between align-items-center py-3 px-4">
            <div>
              <span className="text-secondary small fw-bold">NIFTY 50</span>
              <h4 className="mb-0 text-white fw-bold mt-1">
                {marketStats.nifty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="text-end stock-up d-flex align-items-center gap-1 fw-bold">
              <TrendingUp size={16} />
              <span>+0.54%</span>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass-card d-flex justify-content-between align-items-center py-3 px-4">
            <div>
              <span className="text-secondary small fw-bold">SENSEX</span>
              <h4 className="mb-0 text-white fw-bold mt-1">
                {marketStats.sensex.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="text-end stock-up d-flex align-items-center gap-1 fw-bold">
              <TrendingUp size={16} />
              <span>+0.48%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Movers Grid */}
      <div className="row g-4 mb-4">
        {/* Top Gainers */}
        <div className="col-lg-6">
          <div className="glass-card">
            <h5 className="text-white mb-3 d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '0.95rem' }}>
              <TrendingUp className="text-success" size={18} />
              Top Gainers
            </h5>
            <div className="row g-2">
              {loading ? (
                <div className="text-center py-3 text-muted small">Loading...</div>
              ) : (
                gainers.map(stock => (
                  <div key={stock.symbol} className="col-4">
                    <div 
                      className="glass-card bg-stock-up p-3 text-center cursor-pointer glass-card-hover border-0" 
                      onClick={() => handleStockClick(stock.symbol)}
                    >
                      <span className="fw-bold text-white d-block" style={{ fontSize: '0.9rem' }}>{stock.symbol}</span>
                      <span className="text-secondary d-block mt-0.5" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</span>
                      <span className="fw-bold text-white mt-1.5 d-block" style={{ fontSize: '0.85rem' }}>₹{stock.price.toFixed(2)}</span>
                      <span className="badge mt-2 fw-bold" style={{ color: '#00d09c', background: 'rgba(0, 208, 156, 0.1)', fontSize: '0.7rem' }}>
                        +{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Losers */}
        <div className="col-lg-6">
          <div className="glass-card">
            <h5 className="text-white mb-3 d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '0.95rem' }}>
              <TrendingDown className="text-danger" size={18} />
              Top Losers
            </h5>
            <div className="row g-2">
              {loading ? (
                <div className="text-center py-3 text-muted small">Loading...</div>
              ) : (
                losers.map(stock => (
                  <div key={stock.symbol} className="col-4">
                    <div 
                      className="glass-card bg-stock-down p-3 text-center cursor-pointer glass-card-hover border-0"
                      onClick={() => handleStockClick(stock.symbol)}
                    >
                      <span className="fw-bold text-white d-block" style={{ fontSize: '0.9rem' }}>{stock.symbol}</span>
                      <span className="text-secondary d-block mt-0.5" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</span>
                      <span className="fw-bold text-white mt-1.5 d-block" style={{ fontSize: '0.85rem' }}>₹{stock.price.toFixed(2)}</span>
                      <span className="badge mt-2 fw-bold" style={{ color: '#ff5353', background: 'rgba(255, 83, 83, 0.1)', fontSize: '0.7rem' }}>
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Market Catalog Section */}
      <div className="glass-card">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          {/* Tab switches */}
          <div className="d-flex gap-3 border-bottom border-color" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button
              className={`pb-2 border-0 bg-transparent fw-bold text-uppercase small ${activeTab === 'all' ? 'text-primary-color border-bottom border-primary' : 'text-secondary'}`}
              style={activeTab === 'all' ? { borderBottom: '2px solid #00d09c', color: '#00d09c' } : {}}
              onClick={() => setActiveTab('all')}
            >
              All Stocks
            </button>
            <button
              className={`pb-2 border-0 bg-transparent fw-bold text-uppercase small d-flex align-items-center gap-1.5 ${activeTab === 'watchlist' ? 'text-primary-color border-bottom border-primary' : 'text-secondary'}`}
              style={activeTab === 'watchlist' ? { borderBottom: '2px solid #00d09c', color: '#00d09c' } : {}}
              onClick={() => setActiveTab('watchlist')}
            >
              <Star size={12} className={activeTab === 'watchlist' ? 'text-warning' : ''} />
              My Watchlist
            </button>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            {/* Search Input Container with Dropdown Autocomplete */}
            <div className="search-container" ref={searchContainerRef} style={{ width: '280px' }}>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  <Search size={14} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control form-input-custom border-start-0 py-2" 
                  placeholder="Search Stocks..." 
                  value={search}
                  onFocus={() => setShowSearchDropdown(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                />
              </div>

              {/* Instant Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map((stock) => {
                    const isUp = stock.changePercent >= 0;
                    return (
                      <div 
                        key={stock.symbol}
                        className="search-result-item"
                        onClick={() => {
                          handleStockClick(stock.symbol);
                          setShowSearchDropdown(false);
                        }}
                      >
                        <div>
                          <span className="fw-bold text-white d-block" style={{ fontSize: '0.85rem' }}>{stock.symbol}</span>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{stock.name}</span>
                        </div>
                        <div className="text-end">
                          <span className="fw-bold text-white d-block" style={{ fontSize: '0.85rem' }}>₹{stock.price.toFixed(2)}</span>
                          <span className={`small fw-semibold ${isUp ? 'stock-up' : 'stock-down'}`}>
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary-custom py-2 px-3 d-flex align-items-center gap-1.5"
              onClick={() => fetchStocksAndWatchlist(false)}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading && stocks.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3 small">Loading market stats...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>SYMBOL</th>
                  <th>COMPANY NAME</th>
                  <th className="text-end">MARKET PRICE</th>
                  <th className="text-end">DAILY CHANGE</th>
                  <th className="text-end d-none d-md-table-cell">DAILY HIGH</th>
                  <th className="text-end d-none d-md-table-cell">DAILY LOW</th>
                  <th className="text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {displayedStocks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted small">
                      {activeTab === 'watchlist' 
                        ? 'Your watchlist is empty. Click the star next to any stock to track it!'
                        : `No stocks match "${search}"`
                      }
                    </td>
                  </tr>
                ) : (
                  displayedStocks.map((stock) => {
                    const flash = priceFlash[stock.symbol];
                    const changeUp = stock.changePercent >= 0;
                    const isWatchlisted = watchlist.includes(stock.symbol);

                    return (
                      <tr 
                        key={stock.symbol} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleStockClick(stock.symbol)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <button 
                            className={`watchlist-btn ${isWatchlisted ? 'active' : ''}`}
                            onClick={(e) => toggleWatchlist(e, stock.symbol)}
                          >
                            <Star size={16} fill={isWatchlisted ? '#ff9f0a' : 'transparent'} />
                          </button>
                        </td>
                        <td className="fw-bold text-white">{stock.symbol}</td>
                        <td className="text-secondary">{stock.name}</td>
                        <td 
                          className={`text-end fw-bold text-white transition-all ${
                            flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                          }`}
                        >
                          ₹{stock.price.toFixed(2)}
                        </td>
                        <td className={`text-end fw-bold ${changeUp ? 'stock-up' : 'stock-down'}`}>
                          {changeUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </td>
                        <td className="text-end text-secondary d-none d-md-table-cell">₹{stock.high.toFixed(2)}</td>
                        <td className="text-end text-secondary d-none d-md-table-cell">₹{stock.low.toFixed(2)}</td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn btn-primary-custom py-1 px-3"
                            style={{ fontSize: '0.8rem' }}
                            onClick={() => handleStockClick(stock.symbol)}
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
