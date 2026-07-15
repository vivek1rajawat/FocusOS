import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getGoals,
  createGoal,
  deleteGoal,
  addSubGoal,
  updateSubGoal,
  deleteSubGoal,
} from '../services/goalApi';
import GoalFormModal from '../components/goals/GoalFormModal';
import ProgressRing from '../components/ui/ProgressRing';
import { formatDate } from '../utils/format';

const Goals = () => {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: getGoals });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSubGoal, setNewSubGoal] = useState({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['goals'] });

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await createGoal({ ...form, deadline: form.deadline || null });
      invalidate();
      toast.success('Goal created');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await deleteGoal(id);
    invalidate();
  };

  const handleToggleSubGoal = async (goalId, sub) => {
    await updateSubGoal(goalId, sub._id, { completed: !sub.completed });
    invalidate();
  };

  const handleAddSubGoal = async (goalId) => {
    const title = (newSubGoal[goalId] || '').trim();
    if (!title) return;
    await addSubGoal(goalId, title);
    setNewSubGoal((prev) => ({ ...prev, [goalId]: '' }));
    invalidate();
  };

  const handleDeleteSubGoal = async (goalId, subId) => {
    await deleteSubGoal(goalId, subId);
    invalidate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="text-sm text-slate-500">The big wins you're working toward, not just tasks.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading goals…</p>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="mx-auto mb-2 text-slate-300" size={32} />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm text-slate-500 mb-4">Set something bigger than a task.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
            <Plus size={16} /> New Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div key={g._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{g.title}</h3>
                  {g.description && <p className="text-sm text-slate-500 line-clamp-2">{g.description}</p>}
                  {g.deadline && <p className="text-xs text-slate-400 mt-1">Target: {formatDate(g.deadline)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ProgressRing value={g.progress} />
                </div>
              </div>

              {g.subGoals.length > 0 && (
                <div className="mt-3 space-y-1">
                  {g.subGoals.map((s) => (
                    <div key={s._id} className="group flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSubGoal(g._id, s)}
                        className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 ${
                          s.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {s.completed && <Check size={11} />}
                      </button>
                      <span className={`text-sm flex-1 ${s.completed ? 'line-through text-slate-400' : ''}`}>{s.title}</span>
                      <button
                        onClick={() => handleDeleteSubGoal(g._id, s._id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => (e.preventDefault(), handleAddSubGoal(g._id))}
                className="flex gap-2 mt-3"
              >
                <input
                  className="input !py-1.5 text-xs"
                  placeholder="Add a sub-goal…"
                  value={newSubGoal[g._id] || ''}
                  onChange={(e) => setNewSubGoal((prev) => ({ ...prev, [g._id]: e.target.value }))}
                />
                <button type="submit" className="btn-secondary !px-2.5 !py-1.5">
                  <Plus size={13} />
                </button>
              </form>

              <button
                onClick={() => handleDelete(g._id)}
                className="text-xs text-slate-400 hover:text-red-500 mt-3"
              >
                Delete goal
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && <GoalFormModal onClose={() => setShowModal(false)} onSubmit={handleCreate} loading={saving} />}
    </div>
  );
};

export default Goals;
