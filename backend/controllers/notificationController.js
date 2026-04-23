const { Notification } = require('../models/index');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ notifications, unreadCount });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Marked as read.' });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: 'All marked as read.' });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Deleted.' });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};
