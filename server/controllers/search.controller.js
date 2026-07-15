const Task = require('../models/Task');
const Note = require('../models/Note');
const Goal = require('../models/Goal');
const asyncHandler = require('../utils/asyncHandler');

const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: true, results: { tasks: [], notes: [], goals: [], tags: [] } });

  const userId = req.user._id;
  const regex = new RegExp(q, 'i');

  const [tasks, notes, goals] = await Promise.all([
    Task.find({ user: userId, $or: [{ title: regex }, { description: regex }, { tags: regex }] }).limit(10),
    Note.find({ user: userId, $or: [{ title: regex }, { content: regex }, { tags: regex }] }).limit(10),
    Goal.find({ user: userId, $or: [{ title: regex }, { description: regex }] }).limit(10),
  ]);

  const tagSet = new Set();
  [...tasks, ...notes].forEach((doc) => (doc.tags || []).forEach((t) => {
    if (t.toLowerCase().includes(q.toLowerCase())) tagSet.add(t);
  }));

  res.json({
    success: true,
    results: { tasks, notes, goals, tags: [...tagSet] },
  });
});

module.exports = { globalSearch };
