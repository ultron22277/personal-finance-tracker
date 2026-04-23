const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ac = require('../controllers/analyticsController');

router.use(protect);
router.get('/summary', ac.getSummary);
router.get('/category-breakdown', ac.getCategoryBreakdown);
router.get('/monthly-trends', ac.getMonthlyTrends);
router.get('/anomalies', ac.getAnomalies);
router.get('/saving-tips', ac.getSavingTips);

module.exports = router;
