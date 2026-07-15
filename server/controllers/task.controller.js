const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const getTasks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.timerActive === 'true') filter.timerStartedAt = { $ne: null };

  const tasks = await Task.find(filter).sort({ order: 1, createdAt: -1 });
  const taskIds = tasks.map((t) => t._id);
  const subtasks = await Subtask.find({ task: { $in: taskIds } }).sort({ order: 1 });

  const subtasksByTask = subtasks.reduce((acc, s) => {
    const key = s.task.toString();
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const tasksWithSubtasks = tasks.map((t) => ({
    ...t.toObject(),
    subtasks: subtasksByTask[t._id.toString()] || [],
  }));

  res.json({ success: true, tasks: tasksWithSubtasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  const subtasks = await Subtask.find({ task: task._id }).sort({ order: 1 });
  res.json({ success: true, task: { ...task.toObject(), subtasks } });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, deadline, estimatedTime, tags } = req.body;
  if (!title) throw new ApiError(400, 'Title is required');

  const lastTask = await Task.findOne({ user: req.user._id, status: 'todo' }).sort({ order: -1 });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    user: req.user._id,
    title,
    description,
    priority,
    deadline,
    estimatedTime,
    tags,
    order,
  });

  res.status(201).json({ success: true, task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');

  const fields = [
    'title', 'description', 'status', 'priority', 'deadline',
    'estimatedTime', 'actualTime', 'progress', 'tags', 'attachments', 'order',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) task[f] = req.body[f];
  });

  if (req.body.status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
    task.progress = 100;
  }
  if (req.body.status && req.body.status !== 'completed') {
    task.completedAt = null;
  }

  await task.save();
  res.json({ success: true, task });
});

// Bulk reorder/status update for drag-and-drop kanban moves
const reorderTasks = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{ id, status, order }]
  if (!Array.isArray(updates)) throw new ApiError(400, 'updates must be an array');

  await Promise.all(
    updates.map(({ id, status, order }) =>
      Task.updateOne(
        { _id: id, user: req.user._id },
        { $set: { status, order, ...(status === 'completed' ? { completedAt: new Date(), progress: 100 } : {}) } }
      )
    )
  );

  res.json({ success: true, message: 'Tasks reordered' });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');

  await Promise.all([Subtask.deleteMany({ task: task._id }), task.deleteOne()]);
  res.json({ success: true, message: 'Task deleted' });
});

// Focus mode timer
const startTimer = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  task.timerStartedAt = new Date();
  task.status = 'in-progress';
  await task.save();
  res.json({ success: true, task });
});

const stopTimer = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.timerStartedAt) {
    const elapsedMinutes = Math.round((Date.now() - new Date(task.timerStartedAt).getTime()) / 60000);
    task.actualTime += elapsedMinutes;
    task.timerStartedAt = null;
  }
  await task.save();
  res.json({ success: true, task });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
  startTimer,
  stopTimer,
};
