const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/inMemoryDb');

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await db.createUser({
      name,
      email,
      password: hashedPassword,
      company
    });

    // Create JWT token
    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo purposes, allow login with demo credentials
    if (email === 'demo@example.com' && password === 'password123') {
      // Create JWT token for demo user
      const token = jwt.sign(
        { id: '1' },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );
      
      return res.json({ token });
    }

    // Check if user exists
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    // For demo purposes, if user ID is '1', return the demo user
    if (req.user.id === '1') {
      return res.json({
        _id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        company: {
          name: 'Demo Company',
          address: '123 Demo Street, Demo City',
          phone: '123-456-7890',
          email: 'info@democompany.com',
          website: 'www.democompany.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, company } = req.body;
    
    const updatedUser = await db.updateUser(req.user.id, {
      name,
      company
    });
    
    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};