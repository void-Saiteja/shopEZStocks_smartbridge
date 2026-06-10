const { Stock, isConnected, memStore } = require('../models');

// Seeding default list of stocks
const defaultStockSpecs = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 180.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.20 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.80 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.10 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 170.30 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 900.00 },
  { symbol: 'META', name: 'Meta Platforms', price: 485.60 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 610.40 }
];

const seedStocks = async () => {
  try {
    const existingStocks = await Stock.find();
    if (existingStocks.length === 0) {
      console.log('Seeding default stocks...');
      const now = new Date();
      for (const spec of defaultStockSpecs) {
        // Generate pre-populated history for charts (24 hours)
        const history = [];
        for (let i = 24; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          const randomFluctuation = (Math.random() - 0.5) * 5;
          history.push({ date: time, price: Math.max(1, spec.price + randomFluctuation) });
        }

        await Stock.create({
          symbol: spec.symbol,
          name: spec.name,
          price: spec.price,
          high: spec.price + (Math.random() * 5),
          low: spec.price - (Math.random() * 5),
          changePercent: Number(((Math.random() - 0.5) * 4).toFixed(2)),
          history
        });
      }
      console.log('Stock seeding completed successfully.');
    }
  } catch (error) {
    console.error('Error seeding stocks:', error.message);
  }
};

const simulateMarketMovement = async () => {
  try {
    const stocks = await Stock.find();
    
    for (const stock of stocks) {
      const currentPrice = stock.price;
      // Random walk between -1.5% and +1.5%
      const changePercent = (Math.random() - 0.5) * 3; 
      const priceDelta = currentPrice * (changePercent / 100);
      const newPrice = Number(Math.max(1.0, currentPrice + priceDelta).toFixed(2));
      
      const newHigh = Number(Math.max(stock.high, newPrice).toFixed(2));
      const newLow = Number(Math.min(stock.low, newPrice).toFixed(2));
      
      // Calculate overall daily change based on the initial price in the history (approx 24h ago)
      let initialPrice = currentPrice;
      if (stock.history && stock.history.length > 0) {
        initialPrice = stock.history[0].price;
      }
      const newChangePercent = Number((((newPrice - initialPrice) / initialPrice) * 100).toFixed(2));

      await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        {
          price: newPrice,
          high: newHigh,
          low: newLow,
          changePercent: newChangePercent,
          lastUpdated: new Date()
        }
      );
    }
  } catch (error) {
    console.error('Stock Simulation Engine Error:', error.message);
  }
};

const startSimulation = async () => {
  // Ensure we seed stocks on start (handles MongoDB case, In-Memory is pre-seeded in models index)
  await seedStocks();
  
  // Update stock prices every 6 seconds
  setInterval(simulateMarketMovement, 6000);
  console.log('Stock Simulator Engine started (updates every 6 seconds).');
};

module.exports = {
  startSimulation
};
