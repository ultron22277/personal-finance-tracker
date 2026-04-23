/**
 * Input Validation Middleware
 * - All user input is validated SERVER-SIDE (never trust frontend validation alone)
 * - Strict type checking, length limits, and character restrictions
 * - CSV injection prevention: cells starting with =, +, -, @ get sanitized
 */
const { body, param, query, validationResult } = require('express-validator');

/** Reusable: return 400 if any validation errors */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Never reveal internal details — return generic field errors only
    return res.status(400).json({
      error: 'Validation failed.',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/** Sanitize a string value — strip null bytes, trim, limit length */
const sanitizeString = (value, maxLen = 255) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\0/g, '').trim().slice(0, maxLen);
};

/**
 * CSV Injection Prevention
 * If a cell starts with =, +, -, or @, prepend apostrophe so Excel treats it as text
 */
const sanitizeCsvCell = (value) => {
  if (typeof value !== 'string') return value;
  const dangerous = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerous.some(ch => value.startsWith(ch))) {
    return `'${value}`;
  }
  return value;
};

// ─── Validation rule sets ──────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1–100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 150 }).withMessage('Email too long'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').isLength({ max: 128 }),
];

const transactionRules = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999 }).withMessage('Amount must be a positive number'),
  body('category')
    .trim().notEmpty().withMessage('Category is required')
    .isLength({ max: 100 }).withMessage('Category too long')
    .matches(/^[a-zA-Z0-9\s&'-]+$/).withMessage('Category contains invalid characters'),
  body('date').isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('description')
    .optional().trim().isLength({ max: 255 }).withMessage('Description too long'),
  body('notes')
    .optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  body('paymentMode')
    .optional().isIn(['cash','card','bank_transfer','upi','other']),
];

const budgetRules = [
  body('category').trim().notEmpty().isLength({ max: 100 }),
  body('limit').isFloat({ min: 0.01, max: 999999999 }).withMessage('Limit must be a positive number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1–12'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  body('alertThreshold').optional().isInt({ min: 1, max: 100 }),
];

const resetRequestRules = [
  body('email').trim().isEmail().normalizeEmail(),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().isLength({ min: 64, max: 64 }).withMessage('Invalid token'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
];

module.exports = {
  handleValidation,
  sanitizeString,
  sanitizeCsvCell,
  registerRules,
  loginRules,
  transactionRules,
  budgetRules,
  resetRequestRules,
  resetPasswordRules,
};
