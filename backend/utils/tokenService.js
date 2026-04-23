/**
 * JWT Token Service
 * - Access token:  short-lived (15 min), stored in HTTP-only cookie ONLY
 * - Refresh token: long-lived (7 days), stored in HTTP-only cookie ONLY
 * - Never stored in localStorage (XSS risk)
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('./argon2Config');

const ACCESS_TOKEN_EXPIRY  = '15m';   // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';    // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,                                           // JS cannot read it
  secure: process.env.NODE_ENV === 'production',           // HTTPS only in prod
  sameSite: 'strict',                                      // CSRF protection
};

/** Sign a short-lived access token */
const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

/** Sign a long-lived refresh token (random + signed) */
const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

/** Set both tokens as HTTP-only cookies — never sent to localStorage */
const attachTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,          // 15 min
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',         // Only sent to refresh endpoint
  });
};

/** Clear both auth cookies on logout */
const clearTokenCookies = (res) => {
  res.cookie('access_token',  '', { ...COOKIE_OPTIONS, expires: new Date(0) });
  res.cookie('refresh_token', '', { ...COOKIE_OPTIONS, expires: new Date(0), path: '/api/auth/refresh' });
};

/** Generate a cryptographically secure reset token */
const generateResetToken = () => {
  const plain = crypto.randomBytes(32).toString('hex');
  return plain;
};

/** Hash reset token before storing (so DB theft doesn't reveal tokens) */
const hashResetToken = (plain) =>
  crypto.createHash('sha256').update(plain).digest('hex');

module.exports = {
  signAccessToken,
  signRefreshToken,
  attachTokenCookies,
  clearTokenCookies,
  generateResetToken,
  hashResetToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
