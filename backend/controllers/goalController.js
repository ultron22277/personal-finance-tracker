const { Goal, Notification } = require('../models/index');

exports.getGoals = async (req, res) => {
  try { res.json(await Goal.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] })); }
  catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.user.id });
    if (goal.deadline) {
      const monthsLeft = Math.max(1, Math.ceil((new Date(goal.deadline) - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
      await goal.update({ suggestedMonthlyContribution: Math.ceil((parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)) / monthsLeft) });
    }
    res.status(201).json(goal);
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ error: 'Not found.' });
    await goal.update(req.body);
    res.json(goal);
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.contribute = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ error: 'Not found.' });
    const newAmount = Math.min(parseFloat(goal.currentAmount) + parseFloat(amount), parseFloat(goal.targetAmount));
    const pct = Math.round((newAmount / parseFloat(goal.targetAmount)) * 100);
    const updates = { currentAmount: newAmount };
    if (pct >= 100) {
      updates.status = 'completed';
      await Notification.create({ userId: req.user.id, type: 'goal_complete', title: `Goal Achieved: ${goal.name}!`, message: `Congratulations! You've reached your goal of ${goal.targetAmount}.` });
    } else if (pct >= 75) {
      await Notification.create({ userId: req.user.id, type: 'goal_milestone', title: `75% Milestone: ${goal.name}`, message: `You're 75% of the way to "${goal.name}"!` });
    } else if (pct >= 50) {
      await Notification.create({ userId: req.user.id, type: 'goal_milestone', title: `50% Milestone: ${goal.name}`, message: `Halfway there on "${goal.name}"!` });
    }
    await goal.update(updates);
    res.json({ ...goal.toJSON(), progressPercent: pct });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ error: 'Not found.' });
    await goal.destroy();
    res.json({ message: 'Deleted.' });
  } catch { res.status(500).json({ error: 'Failed.' }); }
};
