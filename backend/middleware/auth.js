const jwt = require('jsonwebtoken');
const db  = require('../config/db');

/**
 * Verifies Bearer token and attaches req.user = { id, name, email, role }
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally confirm user still exists & is active
    const [rows] = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = 1',
      [payload.id]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

/**
 * Role guard — use after authenticate()
 * Usage: authorize('admin') or authorize('admin', 'developer')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
