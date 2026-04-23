const { AuditLog, User } = require('../models/index');

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AuditLog.findAndCountAll({ include: [{ model: User, attributes: ['name', 'email'] }], order: [['createdAt', 'DESC']], limit: parseInt(limit), offset });
    res.json({ logs: rows, total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.getMyActivity = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 100 });
    res.json(logs);
  } catch { res.status(500).json({ error: 'Failed.' }); }
};
