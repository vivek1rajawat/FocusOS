const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { notFound, errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const subtaskRoutes = require('./routes/subtask.routes');
const noteRoutes = require('./routes/note.routes');
const notificationRoutes = require('./routes/notification.routes');
const goalRoutes = require('./routes/goal.routes');
const kaiRoutes = require('./routes/kai.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['X-Conversation-Id'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ success: true, message: 'FocusOS API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/kai', kaiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
