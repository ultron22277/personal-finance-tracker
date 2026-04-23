const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, resetLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, resetRequestRules, resetPasswordRules, handleValidation } = require('../middleware/validate');

// Public routes — rate limited
router.post('/register',        authLimiter, registerRules,      handleValidation, authController.register);
router.post('/login',           authLimiter, loginRules,         handleValidation, authController.login);
router.post('/forgot-password', resetLimiter, resetRequestRules, handleValidation, authController.forgotPassword);
router.post('/reset-password',  resetLimiter, resetPasswordRules,handleValidation, authController.resetPassword);

// Token refresh — uses refresh_token cookie
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout',    protect, authController.logout);
router.get('/me',         protect, authController.getMe);
router.put('/profile',    protect, authController.updateProfile);

module.exports = router;
