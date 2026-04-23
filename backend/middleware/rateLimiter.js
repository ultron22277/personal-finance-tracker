const rateLimit = require('express-rate-limit');

const authLimiter = (req, res, next) => next();
const resetLimiter = (req, res, next) => next();
const globalLimiter = (req, res, next) => next();

module.exports = { authLimiter, resetLimiter, globalLimiter };