import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, password, userType, institute, graduationYear, company, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, user_type, institute, graduation_year, company, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, email, user_type, institute, graduation_year, company, role`,
      [name, email, passwordHash, userType, institute, graduationYear, company, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.user_type,
        institute: user.institute,
        graduationYear: user.graduation_year,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, user_type, institute, graduation_year, company, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.user_type,
        institute: user.institute,
        graduationYear: user.graduation_year,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, user_type, institute, graduation_year, company, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.user_type,
        institute: user.institute,
        graduationYear: user.graduation_year,
        company: user.company,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, institute, graduationYear, company, role } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, institute = $2, graduation_year = $3, company = $4, role = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, name, email, user_type, institute, graduation_year, company, role`,
      [name, institute, graduationYear, company, role, req.user.id]
    );

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.user_type,
        institute: user.institute,
        graduationYear: user.graduation_year,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;