const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getWeeklyStats = async (userId) => {
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [tasksThisWeek, allTasks] = await Promise.all([
    Task.find({ user: userId, updatedAt: { $gte: weekStart, $lt: weekEnd } }).lean(),
    Task.find({ user: userId }).lean(),
  ]);

  const completedTasks = tasksThisWeek.filter((t) => t.status === 'completed').length;
  const pendingTasks = allTasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const overdueTasks = allTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
  ).length;

  const totalTasks = allTasks.length || 1;
  const productivity = Math.round((allTasks.filter((t) => t.status === 'completed').length / totalTasks) * 100);

  const totalMinutes = tasksThisWeek.reduce((sum, t) => sum + (t.actualTime || 0), 0);
  const avgWorkHoursPerDay = Math.round((totalMinutes / 60 / 7) * 10) / 10;

  return {
    weekStart,
    weekEnd,
    stats: { completedTasks, pendingTasks, overdueTasks, productivity, avgWorkHoursPerDay },
  };
};

const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tasks = await Task.find({ user: userId }).lean();

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const timeByDay = Array(7).fill(0);
  const timeByHour = Array(24).fill(0);
  tasks.forEach((t) => {
    if (t.completedAt && t.actualTime) {
      const d = new Date(t.completedAt);
      timeByDay[d.getDay()] += t.actualTime;
      timeByHour[d.getHours()] += t.actualTime;
    }
  });

  const mostProductiveDayIdx = timeByDay.indexOf(Math.max(...timeByDay));
  const mostProductiveHour = timeByHour.indexOf(Math.max(...timeByHour));

  const completedWithTimes = tasks.filter((t) => t.completedAt && t.createdAt);
  const avgCompletionMs =
    completedWithTimes.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.createdAt)), 0) /
    (completedWithTimes.length || 1);
  const avgCompletionDays = Math.round((avgCompletionMs / 86400000) * 10) / 10;

  // last 7 weeks productivity trend
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i -= 1) {
    const wStart = new Date(startOfWeek().getTime() - i * 7 * 86400000);
    const wEnd = new Date(wStart.getTime() + 7 * 86400000);
    const weekTasks = tasks.filter((t) => new Date(t.updatedAt) >= wStart && new Date(t.updatedAt) < wEnd);
    const done = weekTasks.filter((t) => t.status === 'completed').length;
    weeklyTrend.push({
      week: `${wStart.getMonth() + 1}/${wStart.getDate()}`,
      completed: done,
    });
  }

  res.json({
    success: true,
    analytics: {
      statusCounts,
      priorityCounts,
      timeByDay: timeByDay.map((minutes, i) => ({ day: DAY_NAMES[i], minutes })),
      timeByHour,
      mostProductiveDay: DAY_NAMES[mostProductiveDayIdx] || null,
      mostProductiveHour,
      avgCompletionDays,
      weeklyTrend,
      completedCount: statusCounts.completed || 0,
      pendingCount: tasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length,
      overdueCount: tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
    },
  });
});

module.exports = { getAnalytics, getWeeklyStats };
