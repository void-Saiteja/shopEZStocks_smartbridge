const express = require('express');
const router = express.Router();
const { Stock } = require('../models');
const { verifyToken, adminOnly } = require('../middleware/auth');

// @route   GET api/stocks
// @desc    Get all stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    console.error('Fetch Stocks Error:', error.message);
    res.status(500).json({ message: 'Server error fetching stocks.' });
  }
});

// @route   GET api/stocks/:symbol
// @desc    Get stock by symbol
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      return res.status(404).json({ message: `Stock ${symbol} not found.` });
    }
    
    res.json(stock);
  } catch (error) {
    console.error('Fetch Stock Detail Error:', error.message);
    res.status(500).json({ message: 'Server error fetching stock detail.' });
  }
});

// ==========================================
// Admin Protected Routes (CRUD Operations)
// ==========================================

// @route   POST api/stocks
// @desc    Add a new stock listing
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { symbol, name, price } = req.body;

    if (!symbol || !name || price === undefined) {
      return res.status(400).json({ message: 'Please provide symbol, name, and starting price.' });
    }

    const sym = symbol.toUpperCase();
    const existingStock = await Stock.findOne({ symbol: sym });
    if (existingStock) {
      return res.status(400).json({ message: `Stock with symbol ${sym} already exists.` });
    }

    const newStock = await Stock.create({
      symbol: sym,
      name,
      price: Number(price),
      high: Number(price),
      low: Number(price),
      changePercent: 0,
      history: [{ date: new Date(), price: Number(price) }]
    });

    res.status(201).json({
      message: 'Stock listing created successfully.',
      stock: newStock
    });
  } catch (error) {
    console.error('Create Stock Error:', error.message);
    res.status(500).json({ message: 'Server error creating stock.' });
  }
});

// @route   PUT api/stocks/:symbol
// @desc    Update an existing stock listing
router.put('/:symbol', verifyToken, adminOnly, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { name, price } = req.body;

    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ message: `Stock ${symbol} not found.` });
    }

    const updates = {};
    if (name) updates.name = name;
    
    if (price !== undefined) {
      const numericPrice = Number(price);
      updates.price = numericPrice;
      
      // Update high/low bounds
      if (numericPrice > stock.high) updates.high = numericPrice;
      if (numericPrice < stock.low) updates.low = numericPrice;
      
      // Compute percentage change relative to initial price in history
      const initialPrice = stock.history && stock.history.length > 0 ? stock.history[0].price : numericPrice;
      updates.changePercent = Number((((numericPrice - initialPrice) / initialPrice) * 100).toFixed(2));
    }

    const updatedStock = await Stock.findOneAndUpdate(
      { symbol },
      { $set: updates },
      { new: true }
    );

    res.json({
      message: 'Stock listing updated successfully.',
      stock: updatedStock
    });
  } catch (error) {
    console.error('Update Stock Error:', error.message);
    res.status(500).json({ message: 'Server error updating stock.' });
  }
});

// @route   DELETE api/stocks/:symbol
// @desc    Delete a stock listing
router.delete('/:symbol', verifyToken, adminOnly, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const result = await Stock.deleteOne({ symbol });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: `Stock ${symbol} not found.` });
    }

    res.json({ message: `Stock listing ${symbol} deleted successfully.` });
  } catch (error) {
    console.error('Delete Stock Error:', error.message);
    res.status(500).json({ message: 'Server error deleting stock.' });
  }
});

module.exports = router;
