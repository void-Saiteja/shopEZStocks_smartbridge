const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyToken, adminOnly } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    // Check if user already exists
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set role (default is USER, but allow ADMIN for system administration setup if desired)
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: assignedRole,
      balance: 50000 // default $50,000 USD virtual balance
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'supersecretkeyforjwtshopezstocks',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkeyforjwtshopezstocks',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details (using token)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      watchlist: user.watchlist || []
    });
  } catch (error) {
    console.error('Fetch User Details Error:', error.message);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

// @route   POST api/auth/watchlist
// @desc    Toggle stock symbol in user watchlist
router.post('/watchlist', verifyToken, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol required.' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const sym = symbol.toUpperCase();
    const hasSymbol = user.watchlist && user.watchlist.includes(sym);
    
    let updatedUser;
    if (hasSymbol) {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $pull: { watchlist: sym } },
        { new: true }
      );
    } else {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $push: { watchlist: sym } },
        { new: true }
      );
    }

    res.json({
      message: hasSymbol ? 'Removed from watchlist.' : 'Added to watchlist.',
      watchlist: updatedUser.watchlist || []
    });
  } catch (error) {
    console.error('Watchlist Toggle Error:', error.message);
    res.status(500).json({ message: 'Server error updating watchlist.' });
  }
});

// ==========================================
// Admin Protected Routes (User Management)
// ==========================================

// @route   GET api/auth/admin/users
// @desc    Get all users list (Admin only)
router.get('/admin/users', verifyToken, adminOnly, async (req, res) => {
  try {
    const allUsers = await User.find();
    // Exclude passwords from return payload
    const sanitisedUsers = allUsers.map(u => ({
      id: u._id || u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      balance: u.balance,
      createdAt: u.createdAt
    }));
    res.json(sanitisedUsers);
  } catch (error) {
    console.error('Fetch Admin Users Error:', error.message);
    res.status(500).json({ message: 'Server error retrieving system users list.' });
  }
});

// @route   PUT api/auth/admin/users/:id
// @desc    Update a user's role or virtual balance (Admin only)
router.put('/admin/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { role, balance } = req.body;
    const updates = {};
    if (role !== undefined) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role assignment.' });
      }
      updates.role = role;
    }
    if (balance !== undefined) {
      if (isNaN(balance) || Number(balance) < 0) {
        return res.status(400).json({ message: 'Balance must be a positive number.' });
      }
      updates.balance = Number(balance);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User profile updated successfully.',
      user: {
        id: updatedUser._id || updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        balance: updatedUser.balance
      }
    });
  } catch (error) {
    console.error('Update Admin User Error:', error.message);
    res.status(500).json({ message: 'Server error updating user profile.' });
  }
});

// @route   DELETE api/auth/admin/users/:id
// @desc    Delete a user account (Admin only)
router.delete('/admin/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    // Avoid self deletion
    if (req.user.id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Access denied. You cannot delete your own Administrator account.' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: `Trader account ${deletedUser.username} deleted successfully.` });
  } catch (error) {
    console.error('Delete Admin User Error:', error.message);
    res.status(500).json({ message: 'Server error deleting trader account.' });
  }
});

module.exports = router;
