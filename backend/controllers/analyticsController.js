const { Op, fn, col, literal } = require('sequelize');
const { Transaction, sequelize } = require('../models/index');

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
    const rows = await Transaction.findAll({
      where: { userId: req.user.id, date: { [Op.between]: [startOfMonth, endOfMonth] } },
      attributes: ['type', [fn('SUM', col('amount')), 'total']],
      group: ['type'],
    });
    const income = parseFloat(rows.find(r => r.type === 'income')?.dataValues?.total || 0);
    const expenses = parseFloat(rows.find(r => r.type === 'expense')?.dataValues?.total || 0);
    res.json({ income, expenses, savings: income - expenses, month: now.getMonth()+1, year: now.getFullYear() });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth()+1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const type = req.query.type || 'expense';
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const rows = await Transaction.findAll({
      where: { userId: req.user.id, type, date: { [Op.between]: [startDate, endDate] } },
      attributes: ['category', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      group: ['category'],
      order: [[literal('total'), 'DESC']],
    });
    const totalSum = rows.reduce((s, r) => s + parseFloat(r.dataValues.total), 0);
    const breakdown = rows.map(r => ({
      category: r.category,
      amount: parseFloat(r.dataValues.total),
      count: parseInt(r.dataValues.count),
      percent: totalSum > 0 ? Math.round((parseFloat(r.dataValues.total) / totalSum) * 100) : 0,
    }));
    res.json({ month, year, type, total: totalSum, breakdown });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};

exports.getMonthlyTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).toISOString().split('T')[0];
    const rows = await Transaction.findAll({
      where: { userId: req.user.id, date: { [Op.gte]: startDate } },
      attributes: [
        [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [literal("DATE_FORMAT(`date`, '%Y-%m')"), 'type'],
      order: [[literal("DATE_FORMAT(`date`, '%Y-%m')"), 'ASC']],
    });
    const monthMap = {};
    for (const r of rows) {
      const key = r.dataValues.month;
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 };
      monthMap[key][r.type] = parseFloat(r.dataValues.total);
    }
    const result = Object.values(monthMap).map(m => ({ ...m, savings: m.income - m.expense }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};

exports.getAnomalies = async (req, res) => {
  try {
    const txs = await Transaction.findAll({ where: { userId: req.user.id, type: 'expense' }, order: [['date', 'DESC']], limit: 200 });
    const catMap = {};
    for (const t of txs) {
      if (!catMap[t.category]) catMap[t.category] = [];
      catMap[t.category].push(parseFloat(t.amount));
    }
    const anomalies = [];
    for (const t of txs) {
      const amounts = catMap[t.category];
      if (amounts.length < 3) continue;
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const std = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length);
      const zScore = std > 0 ? Math.abs((parseFloat(t.amount) - mean) / std) : 0;
      if (zScore > 2.5) anomalies.push({ ...t.toJSON(), zScore: Math.round(zScore * 100) / 100, mean: Math.round(mean) });
    }
    res.json({ anomalies: anomalies.slice(0, 20) });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};

exports.getSavingTips = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
    const rows = await Transaction.findAll({
      where: { userId: req.user.id, type: 'expense', date: { [Op.gte]: startDate } },
      attributes: ['category', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      group: ['category'],
      order: [[literal('total'), 'DESC']],
      limit: 3,
    });
    const tips = rows.map(r => ({
      category: r.category,
      totalSpent: parseFloat(r.dataValues.total),
      suggestion: `Consider reviewing your ${r.category} spending. You've spent $${parseFloat(r.dataValues.total).toFixed(2)} in the last 3 months.`,
      potentialSaving: Math.round(parseFloat(r.dataValues.total) * 0.15),
    }));
    res.json({ tips });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};
