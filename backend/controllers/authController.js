import { pool } from '../config/db.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, role, avatar FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, avatar`,
      [name, email, password, role]
    );

    const user = result.rows[0];

    // Generate token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const logout = async (req, res) => {
  try {
    // In a real application, you would invalidate the token here
    // For now, we'll just return success
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const result = await pool.query(
      'SELECT id, name, email, role, avatar FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    return res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
