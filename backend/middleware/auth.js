/**
 * Auth Middleware
 * - Reads access token from HTTP-only cookie ONLY (never localStorage)
 * - Validates JWT signature and expiry
 * - Attaches user to req.user
 * - Enforces role-based access control on the SERVER (not just UI hiding)
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

const protect = async (req, res, next) => {
  try {
    // Read ONLY from HTTP-only cookie — never from localStorage or headers for user routes
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please refresh.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshTokenHash', 'resetToken'] },
    });

    if (!user)          return res.status(401).json({ error: 'User not found.' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated.' });
    if (user.isLocked()) return res.status(423).json({ error: 'Account temporarily locked due to failed login attempts.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

/**
 * Server-side role enforcement — NEVER rely on hiding UI buttons alone
 * Usage: restrictTo('admin')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
  }
  next();
};

/**
 * Ownership check — ensures user can only access THEIR OWN data
 * Usage: ownsResource('userId') on route params
 */
const ownsResource = (userIdField = 'userId') => (req, res, next) => {
  const resourceUserId = parseInt(req.params[userIdField] || req.body[userIdField]);
  if (resourceUserId && resourceUserId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. You can only access your own data.' });
  }
  next();
};

module.exports = { protect, restrictTo, ownsResource };
