const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleCsvUpload } = require('../middleware/uploadSecurity');
const { transactionRules, handleValidation } = require('../middleware/validate');
const tc = require('../controllers/transactionController');

// All routes require authentication
router.use(protect);

router.get('/',           tc.getTransactions);
router.post('/',          transactionRules, handleValidation, tc.createTransaction);
router.put('/:id',        transactionRules, handleValidation, tc.updateTransaction);
router.delete('/:id',     tc.deleteTransaction);
router.post('/import-csv',handleCsvUpload,  tc.importCSV);

module.exports = router;
