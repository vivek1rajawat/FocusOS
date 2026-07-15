const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Goal = require('../models/Goal');
const { getWeeklyStats } = require('../controllers/analytics.controller');

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'List the user\'s tasks, optionally filtered by status. Use this to see what exists before suggesting a plan, identifying blockers, or estimating completion.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['todo', 'in-progress', 'completed', 'blocked', 'cancelled'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_tasks_from_plan',
      description: 'Create a batch of tasks (with subtasks) from a plan or roadmap you just wrote out for the user — e.g. after generating a project blueprint. Tag each task with the plan/project name and its phase (e.g. ["AI Resume Analyzer", "Phase 1: Authentication"]) so related tasks are easy to find together in the task list.',
      parameters: {
        type: 'object',
        properties: {
          planName: { type: 'string', description: 'Short name for the overall plan, used as a shared tag across all its tasks.' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                subtasks: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' }, description: 'Additional tags, e.g. ["Phase 1: Authentication"]' },
              },
              required: ['title'],
            },
          },
        },
        required: ['planName', 'tasks'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a single task.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          deadline: { type: 'string', description: 'ISO date, e.g. 2026-07-20' },
          estimatedTime: { type: 'number', description: 'Estimated minutes to complete' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_subtasks',
      description: 'Break an existing task into subtasks. Call get_tasks first if you do not already know the task id.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          subtasks: { type: 'array', items: { type: 'string' } },
        },
        required: ['taskId', 'subtasks'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: "Update an existing task's status, priority, deadline or progress. Use for reprioritizing, marking complete, or rescheduling.",
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'completed', 'blocked', 'cancelled'] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          deadline: { type: 'string' },
          progress: { type: 'number' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_goals',
      description: "List the user's goals (bigger, longer-term wins, distinct from tasks) with progress and sub-goals.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description: 'Create a new goal — a bigger objective like "Get a MERN developer job", broken into sub-goals. Use this instead of create_task when the user describes an outcome/objective rather than a concrete piece of work.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string', description: 'ISO date' },
          subGoals: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics_summary',
      description: 'Get aggregated weekly productivity stats plus a list of currently overdue tasks. Use this for productivity reports, completion estimates, or identifying blockers.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

const toolGetTasks = async (userId, { status } = {}) => {
  const filter = { user: userId };
  if (status) filter.status = status;
  const tasks = await Task.find(filter).select('title status priority deadline tags progress').limit(100).lean();
  return tasks.map((t) => ({
    id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    tags: t.tags,
    progress: t.progress,
  }));
};

const toolCreateTasksFromPlan = async (userId, { planName, tasks = [] }) => {
  const createdTasks = [];
  for (let i = 0; i < tasks.length; i += 1) {
    const t = tasks[i];
    const tags = [planName, ...(Array.isArray(t.tags) ? t.tags : [])].filter(Boolean);
    const task = await Task.create({
      user: userId,
      title: t.title,
      priority: t.priority || 'medium',
      tags,
      order: i,
    });
    let subtasks = [];
    if (Array.isArray(t.subtasks) && t.subtasks.length) {
      subtasks = await Promise.all(
        t.subtasks.map((title, idx) => Subtask.create({ task: task._id, title, order: idx }))
      );
    }
    createdTasks.push({ id: task._id, title: task.title, subtasks: subtasks.map((s) => ({ id: s._id, title: s.title })) });
  }

  return { planName, tasksCreated: tasks.length, tasks: createdTasks };
};

const toolCreateTask = async (userId, { title, priority, deadline, estimatedTime, tags }) => {
  const task = await Task.create({
    user: userId,
    title,
    priority: priority || 'medium',
    deadline: deadline || null,
    estimatedTime: estimatedTime || 0,
    tags: Array.isArray(tags) ? tags : [],
  });
  return { taskId: task._id, title: task.title };
};

const toolAddSubtasks = async (userId, { taskId, subtasks = [] }) => {
  const task = await Task.findOne({ _id: taskId, user: userId });
  if (!task) throw new Error('Task not found');
  const lastSubtask = await Subtask.findOne({ task: taskId }).sort({ order: -1 });
  let order = lastSubtask ? lastSubtask.order + 1 : 0;
  const created = await Promise.all(subtasks.map((title) => Subtask.create({ task: taskId, title, order: order++ })));
  return { taskTitle: task.title, subtasksCreated: created.length };
};

const toolUpdateTask = async (userId, { taskId, status, priority, deadline, progress }) => {
  const task = await Task.findOne({ _id: taskId, user: userId });
  if (!task) throw new Error('Task not found');
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (deadline !== undefined) task.deadline = deadline;
  if (progress !== undefined) task.progress = progress;
  if (status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
    task.progress = 100;
  }
  await task.save();
  return { taskId: task._id, title: task.title, status: task.status };
};

const toolGetGoals = async (userId) => {
  const goals = await Goal.find({ user: userId }).lean();
  return goals.map((g) => ({
    id: g._id,
    title: g.title,
    progress: g.progress,
    status: g.status,
    deadline: g.deadline,
    subGoals: g.subGoals.map((s) => ({ title: s.title, completed: s.completed })),
  }));
};

const toolCreateGoal = async (userId, { title, description, deadline, subGoals = [] }) => {
  const goal = await Goal.create({
    user: userId,
    title,
    description: description || '',
    deadline: deadline || null,
    subGoals: subGoals.map((s, i) => ({ title: s, order: i })),
  });
  return { goalId: goal._id, title: goal.title };
};

const toolGetAnalyticsSummary = async (userId) => {
  const weekly = await getWeeklyStats(userId);
  const overdue = await Task.find({ user: userId, deadline: { $lt: new Date() }, status: { $ne: 'completed' } })
    .select('title deadline priority')
    .limit(20)
    .lean();
  return { ...weekly.stats, overdueTasks: overdue.map((t) => ({ title: t.title, deadline: t.deadline, priority: t.priority })) };
};

const TOOL_HANDLERS = {
  get_tasks: (userId, args) => toolGetTasks(userId, args),
  create_tasks_from_plan: (userId, args) => toolCreateTasksFromPlan(userId, args),
  create_task: (userId, args) => toolCreateTask(userId, args),
  add_subtasks: (userId, args) => toolAddSubtasks(userId, args),
  update_task: (userId, args) => toolUpdateTask(userId, args),
  get_goals: (userId, args) => toolGetGoals(userId, args),
  create_goal: (userId, args) => toolCreateGoal(userId, args),
  get_analytics_summary: (userId, args) => toolGetAnalyticsSummary(userId, args),
};

const TOOL_SUMMARIES = {
  create_tasks_from_plan: (args, result) => `Created ${result.tasksCreated} tasks for "${result.planName}"`,
  create_task: (args, result) => `Created task "${result.title}"`,
  add_subtasks: (args, result) => `Added ${result.subtasksCreated} subtasks to "${result.taskTitle}"`,
  update_task: (args, result) => `Updated "${result.title}"`,
  create_goal: (args, result) => `Created goal "${result.title}"`,
};

const executeTool = async (userId, name, args) => {
  const handler = TOOL_HANDLERS[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  const result = await handler(userId, args || {});
  const summarize = TOOL_SUMMARIES[name];
  return { result, summary: summarize ? summarize(args, result) : null };
};

module.exports = { TOOL_DEFINITIONS, executeTool };
