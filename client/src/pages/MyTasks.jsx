import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Circle, Play, List, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTasks, createTask, updateTask } from '../services/taskApi';
import TaskModal from '../components/tasks/TaskModal';
import TaskBoard from '../components/tasks/TaskBoard';
import { PRIORITY_COLORS, formatDate, isOverdue } from '../utils/format';

const isToday = (d) => {
  const now = new Date();
  const date = new Date(d);
  return date.toDateString() === now.toDateString();
};

const MyTasks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => getTasks() });

  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState('list');

  const active = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const completed = tasks.filter((t) => t.status === 'completed');

  const overdue = active.filter((t) => isOverdue(t.deadline, t.status));
  const today = active.filter((t) => t.deadline && isToday(t.deadline) && !isOverdue(t.deadline, t.status));
  const upcoming = active.filter((t) => t.deadline && !isToday(t.deadline) && !isOverdue(t.deadline, t.status));
  const noDate = active.filter((t) => !t.deadline);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setAdding(true);
    try {
      await createTask({ title: quickTitle, deadline: new Date().toISOString() });
      setQuickTitle('');
      invalidate();
      toast.success('Task added to today');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (task) => {
    await updateTask(task._id, { status: task.status === 'completed' ? 'todo' : 'completed' });
    invalidate();
  };

  const Section = ({ title, items }) =>
    items.length > 0 && (
      <div>
        <h2 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          {title} <span className="text-slate-300 dark:text-slate-600">· {items.length}</span>
        </h2>
        <div className="space-y-1.5">
          {items.map((t) => (
            <div
              key={t._id}
              className="group flex items-center gap-3 card px-3 py-2.5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditingTask(t)}
            >
              <button
                onClick={(e) => (e.stopPropagation(), handleToggle(t))}
                className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                  t.status === 'completed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {t.status === 'completed' && <Check size={12} />}
              </button>
              <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
              <span className={`text-sm flex-1 truncate ${t.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                {t.title}
              </span>
              {t.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500"
                >
                  {tag}
                </span>
              ))}
              {t.deadline && (
                <span className={`text-xs shrink-0 ${isOverdue(t.deadline, t.status) ? 'text-red-500' : 'text-slate-400'}`}>
                  {formatDate(t.deadline)}
                </span>
              )}
              {t.status !== 'completed' && (
                <button
                  onClick={(e) => (e.stopPropagation(), navigate(`/focus/${t._id}`))}
                  title="Start focus timer"
                  className="opacity-0 group-hover:opacity-100 text-indigo-500 hover:text-indigo-600 shrink-0 transition-opacity"
                >
                  <Play size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className={`space-y-6 ${view === 'list' ? 'max-w-3xl' : ''}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-sm text-slate-500">Everything you need to do, all in one place.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'board' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <LayoutGrid size={14} /> Board
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <TaskBoard />
      ) : (
        <>
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <input
              className="input"
              placeholder="Quick add a task for today…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <button type="submit" disabled={adding} className="btn-primary !px-3">
              <Plus size={16} />
            </button>
            <button type="button" onClick={() => setCreating(true)} className="btn-secondary whitespace-nowrap">
              Detailed Task
            </button>
          </form>

          {active.length === 0 && completed.length === 0 ? (
            <div className="card p-12 text-center">
              <Circle className="mx-auto mb-2 text-slate-300" size={32} />
              <p className="font-medium">Nothing here yet</p>
              <p className="text-sm text-slate-500">Add a task above, or ask KAI to plan something for you.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Section title="Overdue" items={overdue} />
              <Section title="Today" items={today} />
              <Section title="Upcoming" items={upcoming} />
              <Section title="No Due Date" items={noDate} />
              <Section title="Completed" items={completed.slice(0, 10)} />
            </div>
          )}
        </>
      )}

      {(editingTask || creating) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default MyTasks;
