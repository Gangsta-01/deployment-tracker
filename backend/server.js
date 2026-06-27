require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

// Routes
const authRoutes         = require('./routes/auth');
const deploymentRoutes   = require('./routes/deployments');
const statsRoutes        = require('./routes/stats');
const environmentRoutes  = require('./routes/environments');
const serviceRoutes      = require('./routes/services');

// Error handler
const { errorHandler } = require('./middleware/errorHandler');

// Initialize DB pool (side-effect: tests connection)
require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & logging ───────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy: origin ${origin} not allowed.`));
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Tighter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// ── Health check (no auth) ────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/deployments',  deploymentRoutes);
app.use('/api/stats',        statsRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/services',     serviceRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` })
);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  DeployPulse backend running on http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
