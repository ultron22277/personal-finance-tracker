const { Op, fn, col, literal } = require('sequelize');
const { Budget, Transaction } = require('../models/index');

exports.getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.user.id };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    const budgets = await Budget.findAll({ where, order: [['category', 'ASC']] });
    res.json(budgets);
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.createBudget = async (req, res) => {
  try {
    const { category, limit: limitAmount, month, year, alertThreshold = 80 } = req.body;
    // calc existing spend
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const spentResult = await Transaction.findOne({
      where: { userId: req.user.id, type: 'expense', category, date: { [Op.between]: [startDate, endDate] } },
      attributes: [[fn('SUM', col('amount')), 'total']],
    });
    const spent = parseFloat(spentResult?.dataValues?.total || 0);
    const budget = await Budget.create({ userId: req.user.id, category, limitAmount, month, year, alertThreshold, spent });
    res.status(201).json(budget);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Budget for this category/month already exists.' });
    res.status(500).json({ error: 'Failed to create budget.' });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Not found.' });
    await budget.update(req.body);
    res.json(budget);
  } catch { res.status(500).json({ error: 'Update failed.' }); }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Not found.' });
    await budget.destroy();
    res.json({ message: 'Deleted.' });
  } catch { res.status(500).json({ error: 'Delete failed.' }); }
};

exports.getBudgetSummary = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const budgets = await Budget.findAll({ where: { userId: req.user.id, month, year } });
    const summary = budgets.map(b => {
      const limit = parseFloat(b.limitAmount);
      const spent = parseFloat(b.spent);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { id: b.id, category: b.category, limit, spent, remaining: Math.max(limit - spent, 0), usagePercent: pct, status: pct >= 100 ? 'exceeded' : pct >= b.alertThreshold ? 'warning' : 'ok' };
    });
    res.json({ month, year, budgets: summary, totalLimit: summary.reduce((s, b) => s + b.limit, 0), totalSpent: summary.reduce((s, b) => s + b.spent, 0) });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};
