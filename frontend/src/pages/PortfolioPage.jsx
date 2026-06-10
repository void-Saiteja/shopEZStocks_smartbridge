import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Briefcase, Wallet, ArrowUpRight, ArrowDownRight, Clock, Award } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' or 'options'
  const navigate = useNavigate();

  const fetchPortfolioAndHistory = async () => {
    try {
      const portRes = await API.get('/portfolio');
      setPortfolio(portRes.data);

      const txRes = await API.get('/transactions');
      setTransactions(txRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load investments.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioAndHistory();
  }, []);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error || 'Unable to retrieve portfolio data.'}</div>
      </div>
    );
  }

  const stocksValue = portfolio.stocks ? portfolio.stocks.reduce((acc, curr) => acc + curr.currentValue, 0) : 0;
  const optionsValue = portfolio.options ? portfolio.options.reduce((acc, curr) => acc + curr.currentValue, 0) : 0;

  // Doughnut chart allocations
  const chartLabels = ['Cash Balance'];
  const chartValues = [portfolio.cash];
  const chartColors = ['#2563eb']; // Blue for cash

  if (stocksValue > 0) {
    chartLabels.push('Equities (Stocks)');
    chartValues.push(stocksValue);
    chartColors.push('#00d09c'); // Green for stocks
  }
  if (optionsValue > 0) {
    chartLabels.push('F&O (Options)');
    chartValues.push(optionsValue);
    chartColors.push('#f59e0b'); // Amber for options
  }

  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: chartColors,
        borderColor: '#121822',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f3f4f6',
          font: { family: 'Inter', size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#121822',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const hasGain = portfolio.netGainLoss >= 0;
  const totalHoldingsCount = (portfolio.stocks?.length || 0) + (portfolio.options?.length || 0);

  return (
    <div className="page-container">
      {/* 1. Value Summary Metrics */}
      <div className="row g-4 mb-4">
        {/* Total Net Worth */}
        <div className="col-md-4">
          <div className="glass-card h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="text-secondary small fw-bold">TOTAL NET WORTH</span>
              <h1 className="fw-bold text-white mb-2 mt-1" style={{ fontSize: '1.85rem' }}>
                ₹{portfolio.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h1>
            </div>
            <div className={`d-flex align-items-center gap-1 fw-bold ${hasGain ? 'stock-up' : 'stock-down'}`}>
              {hasGain ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              <span>
                {hasGain ? '+' : ''}₹{portfolio.netGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({portfolio.netGainLossPercent.toFixed(2)}%)
              </span>
              <span className="text-secondary small fw-normal ms-1">all-time returns</span>
            </div>
          </div>
        </div>

        {/* Invested stats */}
        <div className="col-md-4">
          <div className="glass-card h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary small fw-bold">AVAILABLE CASH</span>
                <h3 className="fw-bold text-white mb-0 mt-1" style={{ fontSize: '1.4rem' }}>
                  ₹{portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <Wallet className="text-success" style={{ color: '#00d09c' }} size={20} />
            </div>
            <div className="pt-2 border-top border-color" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <span className="text-secondary small">Invested Value</span>
              <span className="fw-bold text-white d-block">
                ₹{portfolio.totalInvestmentsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Doughnut distribution chart */}
        <div className="col-md-4">
          <div className="glass-card h-100 py-3 d-flex flex-column justify-content-between">
            <span className="text-secondary small fw-bold">ASSET ALLOCATION</span>
            <div className="flex-grow-1 mt-2" style={{ height: '110px', position: 'relative' }}>
              {totalHoldingsCount === 0 ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                  100% Cash balance. Invest to diversify.
                </div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Holdings Tabs grids */}
      <div className="glass-card mb-4">
        {/* Tabs switcher */}
        <div className="d-flex gap-3 border-bottom border-color mb-4" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <button
            className={`pb-2 border-0 bg-transparent fw-bold text-uppercase small ${activeTab === 'stocks' ? 'text-primary-color border-bottom border-primary' : 'text-secondary'}`}
            style={activeTab === 'stocks' ? { borderBottom: '2px solid #00d09c', color: '#00d09c' } : {}}
            onClick={() => setActiveTab('stocks')}
          >
            Stocks ({portfolio.stocks?.length || 0})
          </button>
          <button
            className={`pb-2 border-0 bg-transparent fw-bold text-uppercase small ${activeTab === 'options' ? 'text-primary-color border-bottom border-primary' : 'text-secondary'}`}
            style={activeTab === 'options' ? { borderBottom: '2px solid #00d09c', color: '#00d09c' } : {}}
            onClick={() => setActiveTab('options')}
          >
            F&O Options ({portfolio.options?.length || 0})
          </button>
        </div>

        {/* STOCKS TABLE */}
        {activeTab === 'stocks' ? (
          portfolio.stocks?.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted small mb-3">No stock holdings found.</p>
              <button className="btn btn-primary-custom" onClick={() => navigate('/')}>
                Invest in Stocks
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>SYMBOL</th>
                    <th>COMPANY NAME</th>
                    <th className="text-end">SHARES</th>
                    <th className="text-end">AVG PRICE</th>
                    <th className="text-end">CURRENT PRICE</th>
                    <th className="text-end">CURRENT VALUE</th>
                    <th className="text-end">RETURNS (PNL)</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.stocks?.map((holding) => {
                    const gainUp = holding.gainLoss >= 0;
                    return (
                      <tr 
                        key={holding.symbol}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/stock/${holding.symbol}`)}
                      >
                        <td className="fw-bold text-white">{holding.symbol}</td>
                        <td className="text-secondary">{holding.name}</td>
                        <td className="text-end text-white">{holding.shares}</td>
                        <td className="text-end text-secondary">₹{holding.averageBuyPrice.toFixed(2)}</td>
                        <td className="text-end text-white">₹{holding.currentPrice.toFixed(2)}</td>
                        <td className="text-end text-white fw-bold">₹{holding.currentValue.toLocaleString()}</td>
                        <td className={`text-end fw-bold ${gainUp ? 'stock-up' : 'stock-down'}`}>
                          {gainUp ? '+' : ''}₹{holding.gainLoss.toLocaleString()}
                          <span className="small d-block fw-normal text-muted" style={{ fontSize: '0.75rem' }}>
                            {gainUp ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* OPTIONS (F&O) TABLE */
          portfolio.options?.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted small mb-3">No active F&O options positions found.</p>
              <button className="btn btn-primary-custom" onClick={() => navigate('/')}>
                Trade Options (F&O)
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>CONTRACT</th>
                    <th>STRIKE</th>
                    <th>TYPE</th>
                    <th>EXPIRY</th>
                    <th className="text-end">LOTS (QTY)</th>
                    <th className="text-end">AVG PREMIUM</th>
                    <th className="text-end">CURRENT PREMIUM</th>
                    <th className="text-end">CURRENT VALUE</th>
                    <th className="text-end">RETURNS (PNL)</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.options?.map((opt) => {
                    const gainUp = opt.gainLoss >= 0;
                    return (
                      <tr 
                        key={opt._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/stock/${opt.symbol}`)}
                      >
                        <td className="fw-bold text-white">{opt.symbol}</td>
                        <td className="text-white font-monospace">₹{opt.strikePrice}</td>
                        <td>
                          <span className={`badge ${opt.optionType === 'CALL' ? 'bg-success text-dark' : 'bg-danger'}`} style={opt.optionType === 'CALL' ? { background: '#00d09c' } : {}}>
                            {opt.optionType}
                          </span>
                        </td>
                        <td className="text-secondary small">{opt.expiryDate}</td>
                        <td className="text-end text-white">{opt.shares}</td>
                        <td className="text-end text-secondary">₹{opt.averageBuyPrice.toFixed(2)}</td>
                        <td className="text-end text-white">₹{opt.currentPremium.toFixed(2)}</td>
                        <td className="text-end text-white fw-bold">₹{opt.currentValue.toLocaleString()}</td>
                        <td className={`text-end fw-bold ${gainUp ? 'stock-up' : 'stock-down'}`}>
                          {gainUp ? '+' : ''}₹{opt.gainLoss.toLocaleString()}
                          <span className="small d-block fw-normal text-muted" style={{ fontSize: '0.75rem' }}>
                            {gainUp ? '+' : ''}{opt.gainLossPercent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* 3. Transaction Activity history */}
      <div className="glass-card">
        <h5 className="text-white mb-4 fw-bold d-flex align-items-center gap-2">
          <Clock className="text-secondary" size={18} />
          Transaction Logs
        </h5>

        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No completed transaction logs.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '350px' }}>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>DATE & TIME</th>
                  <th>ACTION</th>
                  <th>ASSET</th>
                  <th>TYPE</th>
                  <th className="text-end">QUANTITY</th>
                  <th className="text-end">TRADE PRICE</th>
                  <th className="text-end">NET VALUE</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const isOpt = tx.assetType === 'OPTION';
                  const dateObj = new Date(tx.timestamp);

                  return (
                    <tr key={tx._id}>
                      <td className="text-secondary small">
                        {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${isBuy ? 'bg-success text-dark' : 'bg-danger'}`} style={isBuy ? { background: '#00d09c' } : {}}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="fw-bold text-white">
                        {tx.symbol}
                        {isOpt && <span className="text-secondary font-monospace ms-1" style={{ fontSize: '0.75rem' }}>₹{tx.strikePrice} {tx.optionType}</span>}
                      </td>
                      <td>
                        <span className="small text-muted">
                          {isOpt ? 'F&O Option' : 'Equity Stock'}
                        </span>
                      </td>
                      <td className="text-end text-white">{tx.quantity} {isOpt ? 'Lots' : 'Shares'}</td>
                      <td className="text-end text-secondary">₹{tx.price.toFixed(2)}</td>
                      <td className="text-end text-white fw-bold">₹{tx.total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
