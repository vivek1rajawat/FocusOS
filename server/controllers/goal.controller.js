const Goal = require('../models/Goal');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const syncProgress = (goal) => {
  if (!goal.subGoals.length) return;
  const done = goal.subGoals.filter((s) => s.completed).length;
  goal.progress = Math.round((done / goal.subGoals.length) * 100);
  if (goal.progress === 100 && goal.status === 'active') goal.status = 'completed';
  if (goal.progress < 100 && goal.status === 'completed') goal.status = 'active';
};

const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, goals });
});

const getGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  res.json({ success: true, goal });
});

const createGoal = asyncHandler(async (req, res) => {
  const { title, description, deadline, subGoals } = req.body;
  if (!title) throw new ApiError(400, 'title is required');

  const goal = new Goal({
    user: req.user._id,
    title,
    description,
    deadline: deadline || null,
    subGoals: Array.isArray(subGoals)
      ? subGoals.map((s, i) => ({ title: typeof s === 'string' ? s : s.title, order: i }))
      : [],
  });
  syncProgress(goal);
  await goal.save();
  res.status(201).json({ success: true, goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');

  ['title', 'description', 'deadline', 'status', 'progress'].forEach((f) => {
    if (req.body[f] !== undefined) goal[f] = req.body[f];
  });
  await goal.save();
  res.json({ success: true, goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  res.json({ success: true, message: 'Goal deleted' });
});

const addSubGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  const { title } = req.body;
  if (!title) throw new ApiError(400, 'title is required');

  goal.subGoals.push({ title, order: goal.subGoals.length });
  syncProgress(goal);
  await goal.save();
  res.status(201).json({ success: true, goal });
});

const updateSubGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');

  const subGoal = goal.subGoals.id(req.params.subId);
  if (!subGoal) throw new ApiError(404, 'Sub-goal not found');

  if (req.body.title !== undefined) subGoal.title = req.body.title;
  if (req.body.completed !== undefined) subGoal.completed = req.body.completed;

  syncProgress(goal);
  await goal.save();
  res.json({ success: true, goal });
});

const deleteSubGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');

  goal.subGoals.pull(req.params.subId);
  syncProgress(goal);
  await goal.save();
  res.json({ success: true, goal });
});

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, addSubGoal, updateSubGoal, deleteSubGoal };
