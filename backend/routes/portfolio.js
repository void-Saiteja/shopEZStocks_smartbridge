const express = require('express');
const router = express.Router();
const { Portfolio, Stock, User } = require('../models');
const { verifyToken } = require('../middleware/auth');

// Option premium calculation helper (replicated from transactions route)
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

// @route   GET api/portfolio
// @desc    Get user portfolio, separating stocks and F&O options
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const holdings = await Portfolio.find({ userId: user._id });

    const stocksList = [];
    const optionsList = [];
    
    let totalInvestmentsValue = 0;
    let totalInvestmentsCost = 0;

    for (const holding of holdings) {
      const stock = await Stock.findOne({ symbol: holding.symbol });
      const currentStockPrice = stock ? stock.price : (holding.assetType === 'STOCK' ? holding.averageBuyPrice : 0);
      const name = stock ? stock.name : holding.symbol;

      if (holding.assetType === 'OPTION') {
        // Option Valuation
        // 1. Calculate live premium price
        const currentPremium = calculateOptionPremium(currentStockPrice, holding.strikePrice, holding.optionType);
        
        // 2. Options total pricing includes the lot size multiplier of 100
        const totalCost = Number((holding.shares * holding.averageBuyPrice * 100).toFixed(2));
        const currentValue = Number((holding.shares * currentPremium * 100).toFixed(2));
        const gainLoss = Number((currentValue - totalCost).toFixed(2));
        const gainLossPercent = totalCost > 0 ? Number(((gainLoss / totalCost) * 100).toFixed(2)) : 0;

        totalInvestmentsValue += currentValue;
        totalInvestmentsCost += totalCost;

        optionsList.push({
          _id: holding._id,
          symbol: holding.symbol,
          name,
          assetType: 'OPTION',
          optionType: holding.optionType,
          strikePrice: holding.strikePrice,
          expiryDate: holding.expiryDate,
          shares: holding.shares, // lots
          averageBuyPrice: holding.averageBuyPrice, // average premium paid
          currentPremium,
          underlyingPrice: currentStockPrice,
          totalCost,
          currentValue,
          gainLoss,
          gainLossPercent
        });
      } else {
        // Stock Valuation
        const totalCost = Number((holding.shares * holding.averageBuyPrice).toFixed(2));
        const currentValue = Number((holding.shares * currentStockPrice).toFixed(2));
        const gainLoss = Number((currentValue - totalCost).toFixed(2));
        const gainLossPercent = totalCost > 0 ? Number(((gainLoss / totalCost) * 100).toFixed(2)) : 0;

        totalInvestmentsValue += currentValue;
        totalInvestmentsCost += totalCost;

        stocksList.push({
          _id: holding._id,
          symbol: holding.symbol,
          name,
          assetType: 'STOCK',
          shares: holding.shares,
          averageBuyPrice: holding.averageBuyPrice,
          currentPrice: currentStockPrice,
          changePercent: stock ? stock.changePercent : 0,
          totalCost,
          currentValue,
          gainLoss,
          gainLossPercent
        });
      }
    }

    const netGainLoss = Number((totalInvestmentsValue - totalInvestmentsCost).toFixed(2));
    const netGainLossPercent = totalInvestmentsCost > 0 ? Number(((netGainLoss / totalInvestmentsCost) * 100).toFixed(2)) : 0;
    const totalPortfolioValue = Number((user.balance + totalInvestmentsValue).toFixed(2));

    res.json({
      cash: user.balance,
      totalInvestmentsValue: Number(totalInvestmentsValue.toFixed(2)),
      totalPortfolioValue,
      netGainLoss,
      netGainLossPercent,
      holdings: stocksList,  // Backwards compatibility for Stock Detail and stocks lists
      stocks: stocksList,
      options: optionsList
    });
  } catch (error) {
    console.error('Fetch Portfolio Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving portfolio.' });
  }
});

module.exports = router;
