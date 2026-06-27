/**
 * scripts/seed.js
 * Run after migrate: `npm run db:seed`
 * Inserts demo users, environments, services, and deployments.
 */
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'deploypulse',
  });

  console.log('🌱  Seeding database…');

  // ── Users ────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password', 12);

  await conn.query(`
    INSERT IGNORE INTO users (name, email, password, role, avatar) VALUES
      ('Arjun Mehta',  'admin@deploypulse.io', ?, 'admin',     'AM'),
      ('Priya Singh',  'priya@deploypulse.io', ?, 'developer', 'PS'),
      ('Rahul Verma',  'rahul@deploypulse.io', ?, 'developer', 'RV'),
      ('Neha Kapoor',  'neha@deploypulse.io',  ?, 'viewer',    'NK')
  `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

  // ── Environments ─────────────────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO environments (name, color) VALUES
      ('production',  '#22c55e'),
      ('staging',     '#f59e0b'),
      ('development', '#6366f1'),
      ('testing',     '#00d4ff')
  `);

  // ── Services ─────────────────────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO services (name, description, repo_url) VALUES
      ('api-gateway',         'Main API gateway',              'https://github.com/org/api-gateway'),
      ('auth-service',        'Authentication & authorization','https://github.com/org/auth-service'),
      ('frontend',            'React web application',         'https://github.com/org/frontend'),
      ('notification-worker', 'Async notification processor',  'https://github.com/org/notif-worker'),
      ('data-pipeline',       'ETL data pipeline',             'https://github.com/org/data-pipeline'),
      ('reporting-api',       'Reports & analytics API',       'https://github.com/org/reporting-api')
  `);

  // ── Deployments ──────────────────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO deployments
      (service_id, environment_id, version, branch, commit_hash, build_number,
       status, trigger_type, started_at, finished_at, duration_secs)
    VALUES
      (1, 1, 'v2.4.1', 'main',           'a3f9b2c', '#148', 'success',  'pipeline', DATE_SUB(NOW(), INTERVAL 65  MINUTE), DATE_SUB(NOW(), INTERVAL 62  MINUTE), 192),
      (2, 2, 'v1.8.0', 'feature/oauth',  'd7e1a40', '#149', 'running',  'manual',   DATE_SUB(NOW(), INTERVAL 5   MINUTE), NULL, NULL),
      (3, 1, 'v3.1.2', 'main',           'c9d4f18', '#147', 'failed',   'pipeline', DATE_SUB(NOW(), INTERVAL 95  MINUTE), DATE_SUB(NOW(), INTERVAL 93  MINUTE), 104),
      (4, 3, 'v1.2.5', 'develop',        'b5a3e91', '#146', 'success',  'manual',   DATE_SUB(NOW(), INTERVAL 110 MINUTE), DATE_SUB(NOW(), INTERVAL 107 MINUTE), 178),
      (5, 2, 'v2.0.0', 'release/2.0',    'f2c8b74', '#150', 'queued',   'manual',   NULL, NULL, NULL),
      (6, 1, 'v1.5.3', 'main',           'e6d2a35', '#145', 'success',  'pipeline', DATE_SUB(NOW(), INTERVAL 180 MINUTE), DATE_SUB(NOW(), INTERVAL 176 MINUTE), 241)
  `);

  console.log('✅  Seed data inserted.');
  await conn.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
