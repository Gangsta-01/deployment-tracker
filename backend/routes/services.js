const express = require('express');
const { body } = require('express-validator');
const db      = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// ── GET /api/services ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY name'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /api/services ────────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Service name required.')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, repo_url } = req.body;
      const [result] = await db.query(
        'INSERT INTO services (name, description, repo_url) VALUES (?, ?, ?)',
        [name, description || null, repo_url || null]
      );
      res.status(201).json({ id: result.insertId, name, description, repo_url, is_active: 1 });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/services/:id — soft delete ────────────────────
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    await db.query('UPDATE services SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deactivated.' });
  } catch (err) { next(err); }
});

module.exports = router;
