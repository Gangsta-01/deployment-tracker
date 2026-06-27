const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || '10.0.0.217',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'deploytrack_user',
  password:           process.env.DB_PASS     || 'deploy@123',
  database:           process.env.DB_NAME     || 'deploytrack',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // Return JS Date objects, not strings
  dateStrings:        false,
  timezone:           '+00:00',
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
