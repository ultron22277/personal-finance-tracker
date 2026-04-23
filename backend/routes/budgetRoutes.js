const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { budgetRules, handleValidation } = require('../middleware/validate');
const bc = require('../controllers/budgetController');

router.use(protect);
router.get('/',          bc.getBudgets);
router.get('/summary',   bc.getBudgetSummary);
router.post('/',         budgetRules, handleValidation, bc.createBudget);
router.put('/:id',       bc.updateBudget);
router.delete('/:id',    bc.deleteBudget);

module.exports = router;
