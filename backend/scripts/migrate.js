/**
 * scripts/migrate.js
 * Run once: `npm run db:migrate`
 * Creates all tables if they don't exist.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });

  console.log('🔧  Running migrations…');

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'deploypulse'}\``);
  await conn.query(`USE \`${process.env.DB_NAME || 'deploypulse'}\``);

  // ── users ─────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100)        NOT NULL,
      email      VARCHAR(150)        NOT NULL UNIQUE,
      password   VARCHAR(255)        NOT NULL,
      role       ENUM('admin','developer','viewer') NOT NULL DEFAULT 'developer',
      avatar     VARCHAR(10)         DEFAULT NULL,
      is_active  TINYINT(1)          NOT NULL DEFAULT 1,
      created_at DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── environments ──────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS environments (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(50)  NOT NULL UNIQUE,
      color      VARCHAR(10)  NOT NULL DEFAULT '#6366f1',
      is_active  TINYINT(1)   NOT NULL DEFAULT 1,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── services ──────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL UNIQUE,
      description TEXT         DEFAULT NULL,
      repo_url    VARCHAR(255) DEFAULT NULL,
      is_active   TINYINT(1)   NOT NULL DEFAULT 1,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── deployments ───────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS deployments (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      service_id     INT          NOT NULL,
      environment_id INT          NOT NULL,
      version        VARCHAR(50)  NOT NULL,
      branch         VARCHAR(150) NOT NULL DEFAULT 'main',
      commit_hash    VARCHAR(10)  DEFAULT NULL,
      build_number   VARCHAR(20)  DEFAULT NULL,
      status         ENUM('queued','running','success','failed','cancelled')
                                  NOT NULL DEFAULT 'queued',
      triggered_by   INT          DEFAULT NULL,
      trigger_type   ENUM('manual','pipeline','webhook') NOT NULL DEFAULT 'manual',
      started_at     DATETIME     DEFAULT NULL,
      finished_at    DATETIME     DEFAULT NULL,
      duration_secs  INT          DEFAULT NULL,
      log_url        VARCHAR(255) DEFAULT NULL,
      error_message  TEXT         DEFAULT NULL,
      created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id)     REFERENCES services(id)     ON DELETE RESTRICT,
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE RESTRICT,
      FOREIGN KEY (triggered_by)   REFERENCES users(id)        ON DELETE SET NULL,
      INDEX idx_status      (status),
      INDEX idx_service     (service_id),
      INDEX idx_environment (environment_id),
      INDEX idx_created_at  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── deployment_logs (per-step log lines) ─────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS deployment_logs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      deployment_id INT          NOT NULL,
      level         ENUM('info','warn','error') NOT NULL DEFAULT 'info',
      message       TEXT         NOT NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE,
      INDEX idx_deployment (deployment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅  All tables created successfully.');
  await conn.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
