const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const { sequelize } = require('./models/index');
const { globalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.set('trust proxy', false);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(globalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'MySQL' }));

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((err, req, res, next) => {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message,
  });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    logger.info('✅ MySQL connected & tables synced');
    app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`));
  })
  .catch((err) => {
    logger.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;