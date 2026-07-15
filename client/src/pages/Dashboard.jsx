import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Target, ListChecks, CheckCircle2, Clock, AlertTriangle, TrendingUp, Flame, Sparkles,
  StickyNote, ListTodo,
} from 'lucide-react';
import { getDashboard } from '../services/miscApi';
import StatCard from '../components/dashboard/StatCard';
import { greeting, formatDate, isOverdue, PRIORITY_COLORS, STATUS_COLORS } from '../utils/format';
import { formatDistanceToNow } from '../utils/timeAgo';
import { useAuth } from '../hooks/useAuth';

const statGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const statItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) return <p className="text-sm text-slate-400">Loading your dashboard…</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          👋 {greeting()} {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500">Here's what's happening across your work.</p>
      </div>

      <motion.div
        variants={statGrid}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3"
      >
        <motion.div variants={statItem}>
          <StatCard label="Goals" value={data.goalsCount} icon={Target} tone="indigo" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Today's Tasks" value={data.todaysTasksCount} icon={ListChecks} tone="blue" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Completed" value={data.completed} icon={CheckCircle2} tone="emerald" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Pending" value={data.pending} icon={Clock} tone="amber" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Overdue" value={data.overdue} icon={AlertTriangle} tone="red" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Productivity" value={`${data.productivity}%`} icon={TrendingUp} tone="purple" />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Current Streak" value={`${data.streak}d`} icon={Flame} tone="amber" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-medium mb-4">Weekly Progress</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.weeklyProgress}>
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#progressFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" /> KAI Suggestions
          </h2>
          <ul className="space-y-3">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-3 py-2">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Upcoming Deadlines</h2>
            <Link to="/tasks" className="text-xs text-indigo-500">
              View all tasks
            </Link>
          </div>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming deadlines. Enjoy the breathing room.</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingDeadlines.map((t) => (
                <Link
                  key={t._id}
                  to="/tasks"
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                    <span className="text-sm truncate">{t.title}</span>
                  </div>
                  <span className={`text-xs shrink-0 ml-3 ${isOverdue(t.deadline, t.status) ? 'text-red-500' : 'text-slate-400'}`}>
                    {formatDate(t.deadline)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-medium mb-4">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet, create a task to get started.</p>
          ) : (
            <div className="space-y-1">
              {data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                  {a.type === 'note' ? (
                    <StickyNote size={14} className="text-indigo-400 shrink-0" />
                  ) : (
                    <ListTodo size={14} className="text-slate-400 shrink-0" />
                  )}
                  <span className="text-sm truncate flex-1">{a.title}</span>
                  {a.status && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[a.status]}`}>
                      {a.status.replace('-', ' ')}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 shrink-0">{formatDistanceToNow(a.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
