const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const audit = require('../middleware/auditMiddleware');
const gc = require('../controllers/goalController');

router.use(protect);
router.get('/', gc.getGoals);
router.post('/', audit('CREATE', 'Goal'), gc.createGoal);
router.put('/:id', audit('UPDATE', 'Goal'), gc.updateGoal);
router.post('/:id/contribute', gc.contribute);
router.delete('/:id', audit('DELETE', 'Goal'), gc.deleteGoal);

module.exports = router;
