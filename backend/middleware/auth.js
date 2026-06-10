const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforjwtshopezstocks');
    
    // Find user in database/in-memory store
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Attach user information to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance
    };
    
    next();
  } catch (error) {
    console.error('JWT Auth Middleware Error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
};

module.exports = {
  verifyToken,
  adminOnly
};
