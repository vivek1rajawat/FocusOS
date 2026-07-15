const Task = require('../models/Task');
const Note = require('../models/Note');
const Goal = require('../models/Goal');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  const [goalsCount, allTasks] = await Promise.all([
    Goal.countDocuments({ user: userId }),
    Task.find({ user: userId }).lean(),
  ]);

  const todaysTasks = allTasks.filter(
    (t) => t.deadline && new Date(t.deadline) >= startOfToday && new Date(t.deadline) < endOfToday
  );
  const completed = allTasks.filter((t) => t.status === 'completed').length;
  const pending = allTasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const overdue = allTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < today && t.status !== 'completed'
  ).length;

  const productivity = allTasks.length
    ? Math.round((completed / allTasks.length) * 100)
    : 0;

  const upcomingDeadlines = allTasks
    .filter((t) => t.deadline && new Date(t.deadline) >= today && t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 6);

  const weeklyProgress = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(startOfToday.getTime() - i * 86400000);
    const nextDay = new Date(day.getTime() + 86400000);
    const count = allTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= day && new Date(t.completedAt) < nextDay
    ).length;
    weeklyProgress.push({
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: count,
    });
  }

  const recentNotes = await Note.find({ user: userId }).sort({ updatedAt: -1 }).limit(10).select('title updatedAt').lean();

  const recentActivity = [
    ...allTasks.map((t) => ({
      type: 'task',
      title: t.title,
      status: t.status,
      updatedAt: t.updatedAt,
    })),
    ...recentNotes.map((n) => ({
      type: 'note',
      title: n.title,
      status: null,
      updatedAt: n.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 10);

  const suggestions = [];
  if (overdue > 0) suggestions.push(`You have ${overdue} overdue task${overdue > 1 ? 's' : ''} tackle these first to get back on track.`);
  const highPriorityTodo = allTasks.find((t) => t.priority === 'high' && t.status === 'todo');
  if (highPriorityTodo) suggestions.push(`Consider starting "${highPriorityTodo.title}" it's marked high priority and still in Todo.`);
  if (todaysTasks.length === 0) suggestions.push('No deadlines today, a good time to make progress on upcoming milestones.');
  if (suggestions.length === 0) suggestions.push("You're on track. Keep the momentum going!");

  res.json({
    success: true,
    dashboard: {
      greetingName: req.user.name,
      goalsCount,
      todaysTasksCount: todaysTasks.length,
      completed,
      pending,
      overdue,
      productivity,
      streak: req.user.streak,
      upcomingDeadlines,
      weeklyProgress,
      recentActivity,
      suggestions,
    },
  });
});

module.exports = { getDashboard };
