const mongoose = require('mongoose');
const { isConnected } = require('../config/db');

// ==========================================
// 1. Mongoose Schemas & Models
// ==========================================

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  balance: { type: Number, default: 50000 },
  watchlist: [{ type: String }], // Array of stock symbols
  createdAt: { type: Date, default: Date.now }
});

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  changePercent: { type: Number, default: 0 },
  history: [{
    date: { type: Date, default: Date.now },
    price: { type: Number, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  assetType: { type: String, enum: ['STOCK', 'OPTION'], default: 'STOCK' },
  optionType: { type: String, enum: ['CALL', 'PUT'], default: null },
  strikePrice: { type: Number, default: null },
  expiryDate: { type: String, default: null },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true }, // For options, quantity is number of lots (1 lot = 100 shares)
  price: { type: Number, required: true },    // Stock price or Option premium price
  total: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  assetType: { type: String, enum: ['STOCK', 'OPTION'], default: 'STOCK' },
  optionType: { type: String, enum: ['CALL', 'PUT'], default: null },
  strikePrice: { type: Number, default: null },
  expiryDate: { type: String, default: null },
  shares: { type: Number, required: true }, // shares for stocks, contracts for options
  averageBuyPrice: { type: Number, required: true } // buy price for stocks, premium for options
});

const MongoUser = mongoose.model('User', UserSchema);
const MongoStock = mongoose.model('Stock', StockSchema);
const MongoTransaction = mongoose.model('Transaction', TransactionSchema);
const MongoPortfolio = mongoose.model('Portfolio', PortfolioSchema);


// ==========================================
// 2. In-Memory Store & Fallback Implementations
// ==========================================

const memStore = {
  users: [],
  stocks: [],
  transactions: [],
  portfolios: []
};

// Seed default stocks matching Groww / Indian and Global platforms
const defaultStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2450.00, high: 2470.00, low: 2435.00, changePercent: 0.65 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3850.00, high: 3880.00, low: 3810.00, changePercent: -1.15 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1520.00, high: 1535.00, low: 1510.00, changePercent: 0.45 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 145.20, high: 147.00, low: 143.50, changePercent: 2.10 },
  { symbol: 'INFY', name: 'Infosys Ltd.', price: 1420.00, high: 1435.00, low: 1410.00, changePercent: -0.30 },
  { symbol: 'AAPL', name: 'Apple Inc. (US)', price: 180.50, high: 182.00, low: 179.00, changePercent: 0.80 },
  { symbol: 'TSLA', name: 'Tesla Inc. (US)', price: 170.30, high: 174.00, low: 168.50, changePercent: 2.40 },
  { symbol: 'NVDA', name: 'NVIDIA Corp. (US)', price: 900.00, high: 910.00, low: 885.00, changePercent: 4.10 }
].map(s => {
  const history = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const randomFluctuation = (Math.random() - 0.5) * (s.price * 0.02);
    history.push({ date: time, price: Math.max(1, Number((s.price + randomFluctuation).toFixed(2))) });
  }
  return {
    _id: `mem_stock_${s.symbol}`,
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    high: s.high,
    low: s.low,
    changePercent: s.changePercent,
    history,
    lastUpdated: now
  };
});

memStore.stocks = [...defaultStocks];

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


// ==========================================
// 3. Unified API Handlers
// ==========================================

const User = {
  find: async (query = {}) => {
    if (isConnected()) return MongoUser.find(query);
    return memStore.users.filter(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: async (query = {}) => {
    if (isConnected()) return MongoUser.findOne(query);
    return memStore.users.find(u => {
      for (let key in query) {
        if (u[key] === query[key]) return true;
      }
      return false;
    }) || null;
  },

  findById: async (id) => {
    if (isConnected()) return MongoUser.findById(id);
    return memStore.users.find(u => u._id === id.toString()) || null;
  },

  create: async (userData) => {
    if (isConnected()) return MongoUser.create(userData);
    const newUser = {
      _id: generateId(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'USER',
      balance: userData.balance !== undefined ? userData.balance : 50000,
      watchlist: [],
      createdAt: new Date()
    };
    memStore.users.push(newUser);
    return newUser;
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    const idStr = id.toString();
    if (isConnected()) return MongoUser.findByIdAndUpdate(idStr, update, { new: true, ...options });
    const userIndex = memStore.users.findIndex(u => u._id === idStr);
    if (userIndex === -1) return null;
    
    let user = memStore.users[userIndex];

    if (update.$inc && update.$inc.balance !== undefined) {
      user.balance = Number((user.balance + update.$inc.balance).toFixed(2));
    }
    
    if (update.$push && update.$push.watchlist !== undefined) {
      if (!user.watchlist.includes(update.$push.watchlist)) {
        user.watchlist.push(update.$push.watchlist);
      }
    }

    if (update.$pull && update.$pull.watchlist !== undefined) {
      user.watchlist = user.watchlist.filter(sym => sym !== update.$pull.watchlist);
    }

    const fieldsToUpdate = update.$set || {};
    memStore.users[userIndex] = { ...user, ...fieldsToUpdate };
    return memStore.users[userIndex];
  },

  findByIdAndDelete: async (id) => {
    const idStr = id.toString();
    if (isConnected()) return MongoUser.findByIdAndDelete(idStr);
    const index = memStore.users.findIndex(u => u._id === idStr);
    if (index === -1) return null;
    const deletedUser = memStore.users[index];
    memStore.users.splice(index, 1);
    return deletedUser;
  }
};

const Stock = {
  find: async (query = {}) => {
    if (isConnected()) return MongoStock.find(query);
    let results = [...memStore.stocks];
    if (query.symbol) {
      const sym = typeof query.symbol === 'object' && query.symbol.$in 
        ? query.symbol.$in.map(s => s.toUpperCase()) 
        : [query.symbol.toString().toUpperCase()];
      results = results.filter(s => sym.includes(s.symbol));
    }
    return results;
  },

  findOne: async (query = {}) => {
    if (isConnected()) return MongoStock.findOne(query);
    if (query.symbol) {
      const sym = query.symbol.toUpperCase();
      return memStore.stocks.find(s => s.symbol === sym) || null;
    }
    return memStore.stocks.find(s => {
      for (let key in query) {
        if (s[key] === query[key]) return true;
      }
      return false;
    }) || null;
  },

  create: async (stockData) => {
    if (isConnected()) return MongoStock.create(stockData);
    const sym = stockData.symbol.toUpperCase();
    const existing = memStore.stocks.find(s => s.symbol === sym);
    if (existing) throw new Error('Stock symbol already exists');

    const history = stockData.history || [{ date: new Date(), price: stockData.price }];
    const newStock = {
      _id: generateId(),
      symbol: sym,
      name: stockData.name,
      price: Number(stockData.price),
      high: Number(stockData.high || stockData.price),
      low: Number(stockData.low || stockData.price),
      changePercent: Number(stockData.changePercent || 0),
      history,
      lastUpdated: new Date()
    };
    memStore.stocks.push(newStock);
    return newStock;
  },

  findOneAndUpdate: async (filter, update, options = {}) => {
    if (isConnected()) return MongoStock.findOneAndUpdate(filter, update, { new: true, ...options });
    const sym = filter.symbol.toUpperCase();
    let stockIndex = memStore.stocks.findIndex(s => s.symbol === sym);
    
    if (stockIndex === -1) {
      if (options.upsert) {
        const fields = update.$set || update;
        const newStock = await Stock.create({ symbol: sym, ...fields });
        return newStock;
      }
      return null;
    }

    const fieldsToUpdate = update.$set || update;
    let stock = memStore.stocks[stockIndex];
    
    let updatedHistory = stock.history ? [...stock.history] : [];
    if (fieldsToUpdate.price !== undefined && fieldsToUpdate.price !== stock.price) {
      updatedHistory.push({ date: new Date(), price: Number(fieldsToUpdate.price) });
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }
    }

    memStore.stocks[stockIndex] = {
      ...stock,
      ...fieldsToUpdate,
      history: updatedHistory,
      lastUpdated: new Date()
    };

    return memStore.stocks[stockIndex];
  },

  deleteOne: async (filter) => {
    if (isConnected()) return MongoStock.deleteOne(filter);
    const sym = filter.symbol.toUpperCase();
    const stockIndex = memStore.stocks.findIndex(s => s.symbol === sym);
    if (stockIndex === -1) return { deletedCount: 0 };
    memStore.stocks.splice(stockIndex, 1);
    return { deletedCount: 1 };
  }
};

const Transaction = {
  create: async (txData) => {
    if (isConnected()) return MongoTransaction.create(txData);
    const newTx = {
      _id: generateId(),
      userId: txData.userId.toString(),
      symbol: txData.symbol.toUpperCase(),
      assetType: txData.assetType || 'STOCK',
      optionType: txData.optionType || null,
      strikePrice: txData.strikePrice !== undefined ? Number(txData.strikePrice) : null,
      expiryDate: txData.expiryDate || null,
      type: txData.type,
      quantity: Number(txData.quantity),
      price: Number(txData.price),
      total: Number(txData.total),
      timestamp: new Date()
    };
    memStore.transactions.push(newTx);
    return newTx;
  },

  find: async (query = {}) => {
    if (isConnected()) return MongoTransaction.find(query).sort({ timestamp: -1 });
    let results = [...memStore.transactions];
    results = results.filter(t => {
      for (let key in query) {
        if (t[key] !== query[key]) return false;
      }
      return true;
    });
    return results.sort((a, b) => b.timestamp - a.timestamp);
  },

  findById: async (id) => {
    const idStr = id.toString();
    if (isConnected()) return MongoTransaction.findById(idStr);
    return memStore.transactions.find(t => t._id === idStr) || null;
  },

  findByIdAndDelete: async (id) => {
    const idStr = id.toString();
    if (isConnected()) return MongoTransaction.findByIdAndDelete(idStr);
    const index = memStore.transactions.findIndex(t => t._id === idStr);
    if (index === -1) return null;
    const deletedTx = memStore.transactions[index];
    memStore.transactions.splice(index, 1);
    return deletedTx;
  }
};

const Portfolio = {
  find: async (query = {}) => {
    if (isConnected()) return MongoPortfolio.find(query);
    let results = [...memStore.portfolios];
    if (query.userId) {
      const uIdStr = query.userId.toString();
      results = results.filter(p => p.userId === uIdStr);
    }
    return results;
  },

  findOne: async (query = {}) => {
    if (isConnected()) return MongoPortfolio.findOne(query);
    const uIdStr = query.userId.toString();
    const sym = query.symbol.toUpperCase();
    return memStore.portfolios.find(p => {
      if (p.userId !== uIdStr || p.symbol !== sym) return false;
      if (query.assetType && p.assetType !== query.assetType) return false;
      if (query.optionType && p.optionType !== query.optionType) return false;
      if (query.strikePrice && p.strikePrice !== query.strikePrice) return false;
      return true;
    }) || null;
  },

  findOneAndUpdate: async (filter, update, options = {}) => {
    if (isConnected()) return MongoPortfolio.findOneAndUpdate(filter, update, { new: true, ...options });
    const uIdStr = filter.userId.toString();
    const sym = filter.symbol.toUpperCase();
    
    let index = memStore.portfolios.findIndex(p => {
      if (p.userId !== uIdStr || p.symbol !== sym) return false;
      if (filter.assetType && p.assetType !== filter.assetType) return false;
      if (filter.optionType && p.optionType !== filter.optionType) return false;
      if (filter.strikePrice && p.strikePrice !== filter.strikePrice) return false;
      return true;
    });

    if (index === -1) {
      if (options.upsert) {
        const fields = update.$set || update;
        const newHolding = {
          _id: generateId(),
          userId: uIdStr,
          symbol: sym,
          assetType: filter.assetType || 'STOCK',
          optionType: filter.optionType || null,
          strikePrice: filter.strikePrice !== undefined ? Number(filter.strikePrice) : null,
          expiryDate: filter.expiryDate || null,
          shares: Number(fields.shares || 0),
          averageBuyPrice: Number(fields.averageBuyPrice || 0)
        };
        memStore.portfolios.push(newHolding);
        return newHolding;
      }
      return null;
    }

    const fieldsToUpdate = update.$set || update;
    memStore.portfolios[index] = {
      ...memStore.portfolios[index],
      ...fieldsToUpdate
    };
    return memStore.portfolios[index];
  },

  deleteOne: async (filter) => {
    if (isConnected()) return MongoPortfolio.deleteOne(filter);
    const uIdStr = filter.userId.toString();
    const sym = filter.symbol.toUpperCase();
    const index = memStore.portfolios.findIndex(p => {
      if (p.userId !== uIdStr || p.symbol !== sym) return false;
      if (filter.assetType && p.assetType !== filter.assetType) return false;
      if (filter.optionType && p.optionType !== filter.optionType) return false;
      if (filter.strikePrice && p.strikePrice !== filter.strikePrice) return false;
      return true;
    });
    if (index === -1) return { deletedCount: 0 };
    memStore.portfolios.splice(index, 1);
    return { deletedCount: 1 };
  }
};

module.exports = {
  User,
  Stock,
  Transaction,
  Portfolio,
  memStore
};
