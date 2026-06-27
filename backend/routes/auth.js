const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const db       = require('../config/db');
const { authenticate }        = require('../middleware/auth');
const { validate, errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // 1. Find user
      const [rows] = await db.query(
        'SELECT id, name, email, password, role, avatar FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const user = rows[0];

      // 2. Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // 3. Sign JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      // 4. Return token + safe user object (no password)
      const { password: _pw, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/me — verify token & return current user ────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/change-password ───────────────────────────
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const [rows] = await db.query(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );
      const match = await bcrypt.compare(currentPassword, rows[0].password);
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
