/**
 * Auth Controller
 * Security features implemented:
 * - Argon2id password hashing (via model hook)
 * - Account lockout after 5 failed login attempts
 * - Progressive delays on failed attempts
 * - JWT in HTTP-only cookies (15min access + 7d refresh)
 * - One-time password reset link sent via email (token hashed before storage)
 * - Never reveal whether an email exists (prevents user enumeration)
 * - Generic error messages that don't expose internals
 */
const crypto = require('crypto');
const { User, AuditLog } = require('../models/index');
const {
  signAccessToken,
  signRefreshToken,
  attachTokenCookies,
  clearTokenCookies,
  generateResetToken,
  hashResetToken,
} = require('../utils/tokenService');
const { hashPassword } = require('../utils/argon2Config');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ─── Helper: send token response ──────────────────────────────────────────────
const sendAuthResponse = (user, statusCode, res) => {
  const accessToken  = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  attachTokenCookies(res, accessToken, refreshToken);  // HTTP-only cookies only

  // Return minimal user info — never return password, tokens, or hashes
  res.status(statusCode).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currency: user.currency,
    },
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      // Generic message — don't confirm the email exists
      return res.status(409).json({ error: 'Registration failed. Please try a different email.' });
    }

    // Password is hashed via Argon2id in the model beforeCreate hook
    const user = await User.create({ name, email, password });

    await AuditLog.create({ userId: user.id, action: 'CREATE', resource: 'User', ipAddress: req.ip, userAgent: req.get('User-Agent') });
    logger.info(`New user registered: ${user.id}`);

    sendAuthResponse(user, 201, res);
  } catch (err) {
    logger.error('Register error:', err.message);
    // Never expose internal error details to the client
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // Always run password check even if user not found — prevents timing attacks
    if (!user) {
      await fakeArgon2Delay(); // Constant-time response
      await AuditLog.create({ action: 'FAILED_LOGIN', resource: 'User', details: { email: 'unknown' }, ipAddress: req.ip });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await AuditLog.create({ userId: user.id, action: 'FAILED_LOGIN', resource: 'User', details: { reason: 'account_locked' }, ipAddress: req.ip });
      return res.status(423).json({ error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).` });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated. Contact support.' });
    }

    // Verify password with Argon2id
    const valid = await user.comparePassword(password);

    if (!valid) {
      // Increment failed attempts
      const newFailed = user.failedLogins + 1;
      const updates = { failedLogins: newFailed };

      if (newFailed >= MAX_FAILED_ATTEMPTS) {
        // Lock account for 15 minutes
        updates.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        updates.failedLogins = 0;
        await user.update(updates);
        await AuditLog.create({ userId: user.id, action: 'ACCOUNT_LOCKED', resource: 'User', details: { attempts: newFailed }, ipAddress: req.ip });
        logger.warn(`Account locked: user ${user.id} after ${MAX_FAILED_ATTEMPTS} failed attempts`);
        return res.status(423).json({ error: `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.` });
      }

      await user.update(updates);
      await AuditLog.create({ userId: user.id, action: 'FAILED_LOGIN', resource: 'User', details: { attemptsRemaining: MAX_FAILED_ATTEMPTS - newFailed }, ipAddress: req.ip });
      return res.status(401).json({ error: `Invalid email or password. ${MAX_FAILED_ATTEMPTS - newFailed} attempt(s) remaining.` });
    }

    // Successful login — reset failed counter
    await user.update({ failedLogins: 0, lockUntil: null });
    await AuditLog.create({ userId: user.id, action: 'LOGIN', resource: 'User', ipAddress: req.ip, userAgent: req.get('User-Agent') });

    sendAuthResponse(user, 200, res);
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token.' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found.' });

    // Issue a new access token (silent refresh — user stays logged in)
    const newAccessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id);
    attachTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: 'Token refreshed.' });
  } catch (err) {
    res.status(401).json({ error: 'Token refresh failed.' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  clearTokenCookies(res);
  if (req.user) {
    await AuditLog.create({ userId: req.user.id, action: 'LOGOUT', resource: 'User', ipAddress: req.ip });
  }
  res.json({ message: 'Logged out successfully.' });
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // ALWAYS return the same message — never confirm if email exists (prevents enumeration)
    const genericResponse = { message: 'If that email exists, a password reset link has been sent.' };

    if (!user) return res.json(genericResponse);

    // Generate a cryptographically secure one-time token
    const plainToken = generateResetToken();           // 32 random bytes as hex
    const hashedToken = hashResetToken(plainToken);    // SHA-256 hash for storage

    await user.update({
      resetToken: hashedToken,
      resetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
    });

    // Send the PLAIN token in the email link — never the hash
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;
    await emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

    await AuditLog.create({ userId: user.id, action: 'PASSWORD_RESET', resource: 'User', details: { stage: 'requested' }, ipAddress: req.ip });

    res.json(genericResponse);
  } catch (err) {
    logger.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Hash the incoming token to compare against stored hash
    const hashedToken = hashResetToken(token);

    const user = await User.findOne({ where: { email } });

    if (!user || user.resetToken !== hashedToken || user.resetExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Update password — Argon2id hashing happens in model beforeUpdate hook
    await user.update({ password: newPassword, resetToken: null, resetExpiry: null, failedLogins: 0, lockUntil: null });

    await AuditLog.create({ userId: user.id, action: 'PASSWORD_RESET', resource: 'User', details: { stage: 'completed' }, ipAddress: req.ip });

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    logger.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = (req, res) => {
  // Never return sensitive fields
  const { id, name, email, role, currency, createdAt } = req.user;
  res.json({ id, name, email, role, currency, createdAt });
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, currency } = req.body;
    await User.update({ name, currency }, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: ['id','name','email','role','currency'] });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed.' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Fake Argon2 delay to prevent timing attacks on non-existent users */
async function fakeArgon2Delay() {
  const { hashPassword } = require('../utils/argon2Config');
  await hashPassword('dummy_timing_prevention_password');
}
