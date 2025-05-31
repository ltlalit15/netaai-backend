 
const jwt = require('jsonwebtoken');
const db = require('../config'); // your db connection
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    // Extract token string from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

    console.log('Received token:', token);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch tokenVersion from DB for this user
    const [userRows] = await db.query('SELECT tokenVersion FROM users WHERE id = ?', [decoded.id]);
    if (userRows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Compare tokenVersion
    if (userRows[0].tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: 'Token invalidated due to logout from all devices' });
    }

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
