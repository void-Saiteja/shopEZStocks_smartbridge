const express = require('express');
const router = express.Router();
const { User, Stock, Transaction, Portfolio } = require('../models');
const { verifyToken, adminOnly } = require('../middleware/auth');

// Option premium calculation helper (Black-Scholes-like approximation)
const calculateOptionPremium = (stockPrice, strikePrice, optionType) => {
  const diff = stockPrice - strikePrice;
  // Extrinsic value (time value) is modeled as 3% of the stock price
  const baseExtrinsic = stockPrice * 0.03;
  
  if (optionType === 'CALL') {
    if (diff > 0) {
      // In-the-money Call: Intrinsic value + Extrinsic value
      return Number((diff + baseExtrinsic).toFixed(2));
    } else {
      // Out-of-the-money Call: Exponential decay based on distance from strike
      const distance = Math.abs(diff) / stockPrice;
      return Number(Math.max(0.05, baseExtrinsic * Math.exp(-distance * 12)).toFixed(2));
    }
  } else {
    // PUT Option
    if (diff < 0) {
      // In-the-money Put: Intrinsic value + Extrinsic value
      return Number((Math.abs(diff) + baseExtrinsic).toFixed(2));
    } else {
      // Out-of-the-money Put: Exponential decay based on distance from strike
      const distance = Math.abs(diff) / stockPrice;
      return Number(Math.max(0.05, baseExtrinsic * Math.exp(-distance * 12)).toFixed(2));
    }
  }
};

// @route   POST api/transactions/buy
// @desc    Buy shares of stock or option contracts
router.post('/buy', verifyToken, async (req, res) => {
  try {
    const { symbol, quantity, assetType, optionType, strikePrice, expiryDate } = req.body;
    const qty = Number(quantity);

    if (!symbol || !qty || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ message: 'Please specify a valid positive integer quantity.' });
    }

    const isOption = assetType === 'OPTION';
    const sym = symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol: sym });
    if (!stock) {
      return res.status(404).json({ message: `Stock ${sym} not found.` });
    }

    let tradePrice = stock.price;
    let totalCost = 0;

    if (isOption) {
      if (!optionType || !['CALL', 'PUT'].includes(optionType) || !strikePrice || !expiryDate) {
        return res.status(400).json({ message: 'Options trade requires optionType (CALL/PUT), strikePrice, and expiryDate.' });
      }
      
      const strike = Number(strikePrice);
      // Calculate Option premium
      tradePrice = calculateOptionPremium(stock.price, strike, optionType);
      
      // Options total cost: premium * lots * 100 (standard lot multiplier)
      totalCost = Number((tradePrice * qty * 100).toFixed(2));
    } else {
      // Stock total cost: price * shares
      totalCost = Number((tradePrice * qty).toFixed(2));
    }

    // Refetch user to check balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.balance < totalCost) {
      return res.status(400).json({ 
        message: `Insufficient balance. This order costs $${totalCost.toLocaleString()}, but you only have $${user.balance.toLocaleString()}.` 
      });
    }

    // Process Transaction: Deduct Cash Balance
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { balance: -totalCost } },
      { new: true }
    );

    // Record Transaction
    const transaction = await Transaction.create({
      userId: user._id,
      symbol: sym,
      assetType: isOption ? 'OPTION' : 'STOCK',
      optionType: isOption ? optionType : null,
      strikePrice: isOption ? Number(strikePrice) : null,
      expiryDate: isOption ? expiryDate : null,
      type: 'BUY',
      quantity: qty,
      price: tradePrice,
      total: totalCost
    });

    // Update Portfolio holding
    const filter = {
      userId: user._id,
      symbol: sym,
      assetType: isOption ? 'OPTION' : 'STOCK',
      optionType: isOption ? optionType : null,
      strikePrice: isOption ? Number(strikePrice) : null,
      expiryDate: isOption ? expiryDate : null
    };

    let holding = await Portfolio.findOne(filter);

    if (holding) {
      const oldShares = holding.shares;
      const oldAvgPrice = holding.averageBuyPrice;
      const newShares = oldShares + qty;
      const newAvgPrice = Number(((oldShares * oldAvgPrice + qty * tradePrice) / newShares).toFixed(2));

      holding = await Portfolio.findOneAndUpdate(
        filter,
        { $set: { shares: newShares, averageBuyPrice: newAvgPrice } },
        { new: true }
      );
    } else {
      holding = await Portfolio.findOneAndUpdate(
        filter,
        { $set: { shares: qty, averageBuyPrice: tradePrice } },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      message: isOption 
        ? `Successfully purchased ${qty} contract(s) of ${sym} ${expiryDate} $${strikePrice} ${optionType} at premium $${tradePrice}.`
        : `Successfully purchased ${qty} share(s) of ${sym} at $${tradePrice}.`,
      transaction,
      balance: updatedUser.balance,
      holding
    });
  } catch (error) {
    console.error('Buy Order Error:', error.message);
    res.status(500).json({ message: 'Server error processing buy order.' });
  }
});

// @route   POST api/transactions/sell
// @desc    Sell shares of stock or option contracts
router.post('/sell', verifyToken, async (req, res) => {
  try {
    const { symbol, quantity, assetType, optionType, strikePrice, expiryDate } = req.body;
    const qty = Number(quantity);

    if (!symbol || !qty || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ message: 'Please specify a valid positive integer quantity.' });
    }

    const isOption = assetType === 'OPTION';
    const sym = symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol: sym });
    if (!stock) {
      return res.status(404).json({ message: `Stock ${sym} not found.` });
    }

    let tradePrice = stock.price;
    let totalRevenue = 0;

    if (isOption) {
      if (!optionType || !['CALL', 'PUT'].includes(optionType) || !strikePrice || !expiryDate) {
        return res.status(400).json({ message: 'Options trade requires optionType (CALL/PUT), strikePrice, and expiryDate.' });
      }
      const strike = Number(strikePrice);
      tradePrice = calculateOptionPremium(stock.price, strike, optionType);
      totalRevenue = Number((tradePrice * qty * 100).toFixed(2));
    } else {
      totalRevenue = Number((tradePrice * qty).toFixed(2));
    }

    // Verify holding exists and contains enough balance/shares
    const filter = {
      userId: req.user.id,
      symbol: sym,
      assetType: isOption ? 'OPTION' : 'STOCK',
      optionType: isOption ? optionType : null,
      strikePrice: isOption ? Number(strikePrice) : null,
      expiryDate: isOption ? expiryDate : null
    };

    const holding = await Portfolio.findOne(filter);
    if (!holding || holding.shares < qty) {
      const ownedQty = holding ? holding.shares : 0;
      return res.status(400).json({ 
        message: `Insufficient holdings. You attempted to sell ${qty} units, but you only own ${ownedQty} units.` 
      });
    }

    // Process Transaction: Add Cash Balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: totalRevenue } },
      { new: true }
    );

    // Record Transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      symbol: sym,
      assetType: isOption ? 'OPTION' : 'STOCK',
      optionType: isOption ? optionType : null,
      strikePrice: isOption ? Number(strikePrice) : null,
      expiryDate: isOption ? expiryDate : null,
      type: 'SELL',
      quantity: qty,
      price: tradePrice,
      total: totalRevenue
    });

    // Update or Remove Portfolio holding
    let updatedHolding = null;
    const remainingQty = holding.shares - qty;
    if (remainingQty === 0) {
      await Portfolio.deleteOne(filter);
    } else {
      updatedHolding = await Portfolio.findOneAndUpdate(
        filter,
        { $set: { shares: remainingQty } },
        { new: true }
      );
    }

    res.status(200).json({
      message: isOption
        ? `Successfully sold ${qty} contract(s) of ${sym} ${expiryDate} $${strikePrice} ${optionType} at premium $${tradePrice}.`
        : `Successfully sold ${qty} share(s) of ${sym} at $${tradePrice}.`,
      transaction,
      balance: updatedUser.balance,
      holding: updatedHolding
    });
  } catch (error) {
    console.error('Sell Order Error:', error.message);
    res.status(500).json({ message: 'Server error processing sell order.' });
  }
});

// @route   GET api/transactions
// @desc    Get user transaction history
router.get('/', verifyToken, async (req, res) => {
  try {
    const history = await Transaction.find({ userId: req.user.id });
    res.json(history);
  } catch (error) {
    console.error('Fetch Transaction History Error:', error.message);
    res.status(500).json({ message: 'Server error fetching transactions.' });
  }
});

// @route   GET api/transactions/admin/all
// @desc    Get all transactions system-wide (Admin only)
router.get('/admin/all', verifyToken, adminOnly, async (req, res) => {
  try {
    const allTransactions = await Transaction.find();
    res.json(allTransactions);
  } catch (error) {
    console.error('Fetch Global Transactions Error:', error.message);
    res.status(500).json({ message: 'Server error fetching global transaction list.' });
  }
});

// @route   POST api/transactions/admin/rollback/:id
// @desc    Rollback/Void a transaction (Admin only)
router.post('/admin/rollback/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const txId = req.params.id;
    const tx = await Transaction.findById(txId);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found.' });
    }

    const user = await User.findById(tx.userId);
    if (!user) {
      return res.status(404).json({ message: 'Trader account not found.' });
    }

    const isOption = tx.assetType === 'OPTION';
    const isBuy = tx.type === 'BUY';
    const qty = Number(tx.quantity);
    const sym = tx.symbol.toUpperCase();

    // 1. Calculate balance adjust value
    // BUY rollback refunds user (adds cash back).
    // SELL rollback deduces from user (takes cash back).
    const balanceAdjustment = isBuy ? tx.total : -tx.total;

    // Check user balance to cover rollback deduction (if rolling back a SELL)
    if (!isBuy && user.balance < tx.total) {
      return res.status(400).json({ 
        message: `Rollback rejected. Reversing this SELL order requires deducting ₹${tx.total.toLocaleString()} from the user's cash, but they only have ₹${user.balance.toLocaleString()} available.`
      });
    }

    // 2. Adjust Portfolio holding
    const filter = {
      userId: tx.userId,
      symbol: sym,
      assetType: tx.assetType,
      optionType: tx.optionType,
      strikePrice: tx.strikePrice,
      expiryDate: tx.expiryDate
    };

    const holding = await Portfolio.findOne(filter);

    if (isBuy) {
      // Reversing a BUY trade: deduct shares from portfolio
      if (!holding || holding.shares < qty) {
        return res.status(400).json({
          message: `Rollback rejected. User does not own enough shares/lots of ${sym} to complete the rollback (requires ${qty}, user owns ${holding ? holding.shares : 0}).`
        });
      }
      
      const remainingQty = holding.shares - qty;
      if (remainingQty === 0) {
        await Portfolio.deleteOne(filter);
      } else {
        await Portfolio.findOneAndUpdate(
          filter,
          { $set: { shares: remainingQty } }
        );
      }
    } else {
      // Reversing a SELL trade: add shares back to portfolio
      if (holding) {
        const oldShares = holding.shares;
        const oldAvgPrice = holding.averageBuyPrice;
        const newShares = oldShares + qty;
        const newAvgPrice = Number(((oldShares * oldAvgPrice + qty * tx.price) / newShares).toFixed(2));
        
        await Portfolio.findOneAndUpdate(
          filter,
          { $set: { shares: newShares, averageBuyPrice: newAvgPrice } }
        );
      } else {
        await Portfolio.findOneAndUpdate(
          filter,
          { $set: { shares: qty, averageBuyPrice: tx.price } },
          { upsert: true }
        );
      }
    }

    // 3. Apply cash balance adjustment
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { balance: balanceAdjustment } }
    );

    // 4. Delete transaction record
    await Transaction.findByIdAndDelete(txId);

    res.json({
      message: `Successfully rolled back ${tx.type} trade of ${qty} ${isOption ? 'lot(s)' : 'share(s)'} of ${sym}. Balance adjusted by ₹${balanceAdjustment.toLocaleString()}.`
    });
  } catch (error) {
    console.error('Rollback Order Error:', error.message);
    res.status(500).json({ message: 'Server error processing transaction rollback.' });
  }
});

module.exports = router;

