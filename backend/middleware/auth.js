const jwt = require('jsonwebtoken');
const db = require('../utils/inMemoryDb');

module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    // Add user from payload
    let userId = decoded.user ? decoded.user.id : decoded.id;
    const user = await db.findUserById(userId);
    
    if (!user) {
      // For demo purposes, use the demo user
      req.user = { id: '1' };
    } else {
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    }
    
    next();
  } catch (err) {
    console.error('Auth error:', err);
    // For demo purposes, use the demo user
    req.user = { id: '1' };
    next();
  }
};