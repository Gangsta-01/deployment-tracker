const express = require('express');
const { body } = require('express-validator');
const db      = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// ── GET /api/environments ─────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM environments WHERE is_active = 1 ORDER BY id'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /api/environments ────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { name, color = '#6366f1' } = req.body;
      const [result] = await db.query(
        'INSERT INTO environments (name, color) VALUES (?, ?)', [name, color]
      );
      res.status(201).json({ id: result.insertId, name, color, is_active: 1 });
    } catch (err) { next(err); }
  }
);

module.exports = router;
