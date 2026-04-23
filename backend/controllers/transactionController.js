/**
 * Transaction Controller
 * Security: All queries scoped to req.user.id — users NEVER see each other's data
 * CSV: Cells starting with =, +, -, @ are sanitized to prevent formula injection
 */
const { Op } = require('sequelize');
const { Transaction, Budget, Notification } = require('../models/index');
const { sanitizeCsvCell } = require('../middleware/validate');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

exports.getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    // ALWAYS filter by req.user.id — users can only see their own data
    const where = { userId: req.user.id };
    if (type && ['income','expense'].includes(type)) where.type = type;
    if (category) where.category = category.slice(0, 100); // enforce length
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate)   where.date[Op.lte] = endDate;
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // cap at 100
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Transaction.findAndCountAll({
      where, order: [['date','DESC'],['createdAt','DESC']], limit: limitNum, offset,
    });

    res.json({ transactions: rows, pagination: { total: count, page: pageNum, pages: Math.ceil(count / limitNum), limit: limitNum } });
  } catch (err) {
    logger.error('getTransactions:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    // userId always comes from the authenticated session — never from request body
    const tx = await Transaction.create({ ...req.body, userId: req.user.id });
    if (tx.type === 'expense') await updateBudget(req.user.id, tx);
    res.status(201).json(tx);
  } catch (err) {
    logger.error('createTransaction:', err.message);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    // WHERE clause includes userId — cannot update another user's transaction
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    // Never allow changing userId via body
    const { userId, ...safeBody } = req.body;
    await tx.update(safeBody);
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: 'Update failed.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    // WHERE clause includes userId — cannot delete another user's transaction
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    await tx.destroy();
    res.json({ message: 'Transaction deleted.' });
  } catch { res.status(500).json({ error: 'Delete failed.' }); }
};

exports.importCSV = async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const errors = [];

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Validate required fields
          if (!row.type || !row.amount || !row.category || !row.date) {
            errors.push({ row, reason: 'Missing required fields' });
            return;
          }

          const type = row.type?.toLowerCase();
          if (!['income','expense'].includes(type)) {
            errors.push({ row, reason: 'Invalid type' });
            return;
          }

          const amount = parseFloat(row.amount);
          if (isNaN(amount) || amount <= 0) {
            errors.push({ row, reason: 'Invalid amount' });
            return;
          }

          // CSV Injection prevention — sanitize all string cells
          results.push({
            userId: req.user.id,  // Always use session user — never trust CSV userId column
            type,
            amount,
            category: sanitizeCsvCell(String(row.category || '').slice(0, 100)),
            date: row.date,
            description: sanitizeCsvCell(String(row.description || '').slice(0, 255)),
            paymentMode: ['cash','card','bank_transfer','upi','other'].includes(row.paymentMode) ? row.paymentMode : 'other',
            notes: sanitizeCsvCell(String(row.notes || '').slice(0, 1000)),
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete temp file immediately after reading
    fs.unlinkSync(filePath);

    if (results.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in CSV.', errors: errors.slice(0, 5) });
    }

    const inserted = await Transaction.bulkCreate(results, { validate: true });
    res.json({ imported: inserted.length, failed: errors.length, errors: errors.slice(0, 5) });
  } catch (err) {
    // Clean up temp file on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    logger.error('CSV import:', err.message);
    res.status(500).json({ error: 'CSV import failed.' });
  }
};

async function updateBudget(userId, tx) {
  const date = new Date(tx.date);
  const budget = await Budget.findOne({ where: { userId, category: tx.category, month: date.getMonth() + 1, year: date.getFullYear() } });
  if (!budget) return;
  const newSpent = parseFloat(budget.spent) + parseFloat(tx.amount);
  const pct = (newSpent / parseFloat(budget.limitAmount)) * 100;
  const updates = { spent: newSpent };
  if (pct >= 100 && !budget.alertSent100) {
    updates.alertSent100 = true;
    await Notification.create({ userId, type: 'budget_alert', title: `Budget Exceeded: ${tx.category}`, message: `You have exceeded your ${tx.category} budget!` });
  } else if (pct >= budget.alertThreshold && !budget.alertSent80) {
    updates.alertSent80 = true;
    await Notification.create({ userId, type: 'budget_alert', title: `Budget Alert: ${tx.category}`, message: `You've used ${Math.round(pct)}% of your ${tx.category} budget.` });
  }
  await budget.update(updates);
}
