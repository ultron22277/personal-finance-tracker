const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { AuditLog, User } = require('../models/index');

router.use(protect);

// Get current user's own activity
router.get('/my-activity', async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 100,
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch activity.' });
    }
});

// Admin only — view all logs
router.get('/', restrictTo('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await AuditLog.findAndCountAll({
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
        });
        res.json({ logs: rows, total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs.' });
    }
});

module.exports = router;