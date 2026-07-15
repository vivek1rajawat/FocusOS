import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Modal from '../ui/Modal';

const GoalFormModal = ({ onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [subGoals, setSubGoals] = useState(['']);

  const updateSubGoal = (i, value) => {
    setSubGoals((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  };

  const addSubGoalRow = () => setSubGoals((prev) => [...prev, '']);
  const removeSubGoalRow = (i) => setSubGoals((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, subGoals: subGoals.map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <Modal title="New Goal" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Goal</label>
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Get a MERN Developer Job"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Why does this matter?"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Target date</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Sub-goals</label>
          <div className="space-y-2">
            {subGoals.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  value={s}
                  onChange={(e) => updateSubGoal(i, e.target.value)}
                  placeholder={`e.g. ${['Resume', 'Portfolio', 'DSA', 'Projects'][i] || 'Sub-goal'}`}
                />
                {subGoals.length > 1 && (
                  <button type="button" onClick={() => removeSubGoalRow(i)} className="btn-secondary !px-2.5">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addSubGoalRow} className="btn-secondary !py-1.5 text-xs mt-2">
            <Plus size={12} /> Add sub-goal
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Create Goal'}
        </button>
      </form>
    </Modal>
  );
};

export default GoalFormModal;
