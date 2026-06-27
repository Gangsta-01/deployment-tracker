const express  = require('express');
const { body, query, param } = require('express-validator');
const db       = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();

// All deployment routes require login
router.use(authenticate);

// ── Helper: format duration ───────────────────────────────────
function fmtDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── GET /api/deployments ─────────────────────────────────────
// Query params: status, environment, service, limit, offset
router.get('/', async (req, res, next) => {
  try {
    const { status, environment, service, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        d.id, d.version, d.branch, d.commit_hash, d.build_number,
        d.status, d.trigger_type, d.started_at, d.finished_at, d.duration_secs,
        d.error_message, d.created_at,
        s.name  AS service,
        e.name  AS environment,
        e.color AS env_color,
        u.name  AS triggered_by
      FROM deployments d
      JOIN services     s ON s.id = d.service_id
      JOIN environments e ON e.id = d.environment_id
      LEFT JOIN users   u ON u.id = d.triggered_by
      WHERE 1=1
    `;
    const params = [];

    if (status)      { sql += ' AND d.status = ?';     params.push(status); }
    if (environment) { sql += ' AND e.name = ?';        params.push(environment); }
    if (service)     { sql += ' AND s.name LIKE ?';     params.push(`%${service}%`); }

    sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(sql, params);

    const deployments = rows.map(d => ({
      ...d,
      duration: fmtDuration(d.duration_secs),
    }));

    // Total count for pagination
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM deployments d
       JOIN services s ON s.id = d.service_id
       JOIN environments e ON e.id = d.environment_id
       WHERE 1=1
       ${status      ? 'AND d.status = ?' : ''}
       ${environment ? 'AND e.name = ?'   : ''}
       ${service     ? 'AND s.name LIKE ?' : ''}`,
      params.slice(0, -2)
    );

    res.json({
      deployments,
      total:  countRows[0].total,
      limit:  parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/deployments/:id ──────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.*,
        s.name  AS service,    s.repo_url,
        e.name  AS environment, e.color AS env_color,
        u.name  AS triggered_by
      FROM deployments d
      JOIN services s     ON s.id = d.service_id
      JOIN environments e ON e.id = d.environment_id
      LEFT JOIN users u   ON u.id = d.triggered_by
      WHERE d.id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ message: 'Deployment not found.' });

    // Fetch logs
    const [logs] = await db.query(
      'SELECT level, message, created_at FROM deployment_logs WHERE deployment_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...rows[0], duration: fmtDuration(rows[0].duration_secs), logs });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/deployments — create ───────────────────────────
router.post(
  '/',
  [
    body('service_id').isInt({ gt: 0 }).withMessage('Valid service_id required.'),
    body('environment_id').isInt({ gt: 0 }).withMessage('Valid environment_id required.'),
    body('version').trim().notEmpty().withMessage('Version required.'),
    body('branch').trim().notEmpty().withMessage('Branch required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { service_id, environment_id, version, branch, commit_hash, build_number } = req.body;

      const [result] = await db.query(
        `INSERT INTO deployments
           (service_id, environment_id, version, branch, commit_hash, build_number, triggered_by, trigger_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
        [service_id, environment_id, version, branch, commit_hash || null, build_number || null, req.user.id]
      );

      const [rows] = await db.query(
        'SELECT d.*, s.name AS service, e.name AS environment FROM deployments d JOIN services s ON s.id=d.service_id JOIN environments e ON e.id=d.environment_id WHERE d.id = ?',
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/deployments/:id — update status ─────────────────
router.put(
  '/:id',
  authorize('admin', 'developer'),
  [
    body('status').isIn(['queued','running','success','failed','cancelled'])
      .withMessage('Invalid status.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, error_message } = req.body;
      const updates = { status };

      if (status === 'running')   updates.started_at  = new Date();
      if (['success','failed','cancelled'].includes(status)) {
        updates.finished_at = new Date();
        // Calculate duration if we have started_at
        const [rows] = await db.query('SELECT started_at FROM deployments WHERE id = ?', [req.params.id]);
        if (rows[0]?.started_at) {
          updates.duration_secs = Math.round((Date.now() - new Date(rows[0].started_at).getTime()) / 1000);
        }
      }
      if (error_message) updates.error_message = error_message;

      await db.query('UPDATE deployments SET ? WHERE id = ?', [updates, req.params.id]);

      const [updated] = await db.query(
        'SELECT d.*, s.name AS service, e.name AS environment FROM deployments d JOIN services s ON s.id=d.service_id JOIN environments e ON e.id=d.environment_id WHERE d.id = ?',
        [req.params.id]
      );
      if (!updated.length) return res.status(404).json({ message: 'Deployment not found.' });

      res.json({ ...updated[0], duration: fmtDuration(updated[0].duration_secs) });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/deployments/:id/trigger ────────────────────────
// Simulates triggering a re-deploy (webhook to Jenkins in real world)
router.post('/:id/trigger', authorize('admin', 'developer'), async (req, res, next) => {
  try {
    const [existing] = await db.query('SELECT * FROM deployments WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Deployment not found.' });

    const dep = existing[0];

    // Create a new queued deployment based on the same config
    const [result] = await db.query(
      `INSERT INTO deployments
         (service_id, environment_id, version, branch, triggered_by, trigger_type)
       VALUES (?, ?, ?, ?, ?, 'manual')`,
      [dep.service_id, dep.environment_id, dep.version, dep.branch, req.user.id]
    );

    res.status(201).json({ message: 'Deployment triggered.', deploymentId: result.insertId });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/deployments/:id/logs — append a log line ───────
router.post('/:id/logs', async (req, res, next) => {
  try {
    const { level = 'info', message } = req.body;
    if (!message) return res.status(422).json({ message: 'Log message required.' });

    await db.query(
      'INSERT INTO deployment_logs (deployment_id, level, message) VALUES (?, ?, ?)',
      [req.params.id, level, message]
    );
    res.status(201).json({ message: 'Log appended.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
