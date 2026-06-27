const express = require('express');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/stats/dashboard ─────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    // Total deployments
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM deployments'
    );

    // Success rate (last 30 days)
    const [[{ success, allLast30 }]] = await db.query(`
      SELECT
        SUM(status = 'success') AS success,
        COUNT(*) AS allLast30
      FROM deployments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status IN ('success','failed')
    `);

    // Avg duration (last 30 days, successful only)
    const [[{ avgSecs }]] = await db.query(`
      SELECT AVG(duration_secs) AS avgSecs
      FROM deployments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status = 'success'
        AND duration_secs IS NOT NULL
    `);

    // Today stats
    const [[{ today, failedToday }]] = await db.query(`
      SELECT
        COUNT(*) AS today,
        SUM(status = 'failed') AS failedToday
      FROM deployments
      WHERE DATE(created_at) = CURDATE()
    `);

    // Active environments
    const [[{ activeEnvs }]] = await db.query(
      'SELECT COUNT(*) AS activeEnvs FROM environments WHERE is_active = 1'
    );

    const successRate = allLast30 > 0
      ? parseFloat(((success / allLast30) * 100).toFixed(1))
      : 0;

    const avgDuration = avgSecs
      ? `${Math.floor(avgSecs / 60)}m ${Math.round(avgSecs % 60)}s`
      : '—';

    res.json({
      totalDeployments:    total,
      successRate,
      avgDuration,
      activeEnvironments:  activeEnvs,
      deploymentsToday:    today,
      failedToday:         failedToday || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/stats/history?days=7 ────────────────────────────
router.get('/history', async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);

    const [rows] = await db.query(`
      SELECT
        DATE(created_at)         AS date,
        SUM(status = 'success')  AS success,
        SUM(status = 'failed')   AS failed,
        COUNT(*)                 AS total
      FROM deployments
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    const history = rows.map(r => ({
      date:    new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      success: Number(r.success),
      failed:  Number(r.failed),
      total:   Number(r.total),
    }));

    res.json(history);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/stats/environments ───────────────────────────────
router.get('/environments', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id, e.name, e.color,
        COUNT(DISTINCT d.service_id) AS services,
        ROUND(
          100 * SUM(d.status = 'success') /
          NULLIF(SUM(d.status IN ('success','failed')), 0)
        , 1) AS health
      FROM environments e
      LEFT JOIN deployments d
        ON d.environment_id = e.id
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      WHERE e.is_active = 1
      GROUP BY e.id
      ORDER BY e.id
    `);

    const envs = rows.map(r => ({
      ...r,
      health: r.health ?? 100,
    }));

    res.json(envs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
