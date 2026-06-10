require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const { User } = require('./models');
const { startSimulation } = require('./services/stockSimulator');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Bind API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/portfolio', require('./routes/portfolio'));

// Server status endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Seed default users for review
const seedUsers = async () => {
  try {
    // 1. Seed Default Admin
    const adminEmail = 'admin@shopez.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      console.log('Seeding default system Admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword', salt);
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        balance: 100000
      });
      console.log('Admin seeded (admin@shopez.com / adminpassword).');
    }

    // 2. Seed Default Trader
    const traderEmail = 'trader@shopez.com';
    const traderUser = await User.findOne({ email: traderEmail });
    if (!traderUser) {
      console.log('Seeding default system Trader user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('traderpassword', salt);
      await User.create({
        username: 'trader',
        email: traderEmail,
        password: hashedPassword,
        role: 'USER',
        balance: 50000
      });
      console.log('Trader seeded (trader@shopez.com / traderpassword).');
    }
  } catch (err) {
    console.error('Error seeding initial system users:', err.message);
  }
};

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database (falls back to In-Memory if connection fails)
  await connectDB();

  // Seed default credentials
  await seedUsers();

  // Start stock price simulator engine
  await startSimulation();

  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
  });
};

startServer();
