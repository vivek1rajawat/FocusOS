const Subtask = require('../models/Subtask');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const syncTaskProgress = async (taskId) => {
  const subtasks = await Subtask.find({ task: taskId });
  if (!subtasks.length) return;
  const completed = subtasks.filter((s) => s.completed).length;
  const progress = Math.round((completed / subtasks.length) * 100);
  await Task.findByIdAndUpdate(taskId, {
    progress,
    ...(progress === 100 ? { status: 'completed', completedAt: new Date() } : {}),
  });
};

const createSubtask = asyncHandler(async (req, res) => {
  const { task, title } = req.body;
  if (!task || !title) throw new ApiError(400, 'task and title are required');

  const taskDoc = await Task.findOne({ _id: task, user: req.user._id });
  if (!taskDoc) throw new ApiError(404, 'Task not found');

  const lastSubtask = await Subtask.findOne({ task }).sort({ order: -1 });
  const order = lastSubtask ? lastSubtask.order + 1 : 0;

  const subtask = await Subtask.create({ task, title, order });
  res.status(201).json({ success: true, subtask });
});

const updateSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findById(req.params.id);
  if (!subtask) throw new ApiError(404, 'Subtask not found');

  if (req.body.title !== undefined) subtask.title = req.body.title;
  if (req.body.completed !== undefined) subtask.completed = req.body.completed;
  if (req.body.order !== undefined) subtask.order = req.body.order;
  await subtask.save();

  await syncTaskProgress(subtask.task);
  res.json({ success: true, subtask });
});

const deleteSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findById(req.params.id);
  if (!subtask) throw new ApiError(404, 'Subtask not found');
  const taskId = subtask.task;
  await subtask.deleteOne();
  await syncTaskProgress(taskId);
  res.json({ success: true, message: 'Subtask deleted' });
});

module.exports = { createSubtask, updateSubtask, deleteSubtask };
