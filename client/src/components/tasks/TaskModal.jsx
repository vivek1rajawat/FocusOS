import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Check, Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { createTask, updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask } from '../../services/taskApi';

const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['todo', 'in-progress', 'completed', 'blocked', 'cancelled'];

const TaskModal = ({ task, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    deadline: task?.deadline ? task.deadline.slice(0, 10) : '',
    estimatedTime: task?.estimatedTime || '',
    tags: (task?.tags || []).join(', '),
  });
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : 0,
      deadline: form.deadline || null,
    };
    try {
      if (isEdit) {
        await updateTask(task._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      invalidate();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    await deleteTask(task._id);
    invalidate();
    toast.success('Task deleted');
    onClose();
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim() || !isEdit) return;
    const subtask = await createSubtask({ task: task._id, title: newSubtask });
    setSubtasks((s) => [...s, subtask]);
    setNewSubtask('');
    invalidate();
  };

  const handleToggleSubtask = async (s) => {
    const updated = await updateSubtask(s._id, { completed: !s.completed });
    setSubtasks((prev) => prev.map((x) => (x._id === s._id ? updated : x)));
    invalidate();
  };

  const handleDeleteSubtask = async (id) => {
    await deleteSubtask(id);
    setSubtasks((prev) => prev.filter((x) => x._id !== id));
    invalidate();
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <Modal title={isEdit ? 'Edit Task' : 'New Task'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Estimated time (min)</label>
            <input type="number" min="0" className="input" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
          <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, bug, urgent" />
        </div>

        {isEdit && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Subtasks</label>
              <span className="text-xs text-slate-400">
                {completedCount}/{subtasks.length} completed
              </span>
            </div>
            <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
              {subtasks.map((s) => (
                <div key={s._id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(s)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                      s.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {s.completed && <Check size={12} />}
                  </button>
                  <span className={`text-sm flex-1 ${s.completed ? 'line-through text-slate-400' : ''}`}>{s.title}</span>
                  <button type="button" onClick={() => handleDeleteSubtask(s._id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Add a subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask(e))}
              />
              <button type="button" onClick={handleAddSubtask} className="btn-secondary !px-3">
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <>
              <button type="button" onClick={handleDelete} className="btn-secondary text-red-500">
                <Trash2 size={14} /> Delete
              </button>
              <button type="button" onClick={() => navigate(`/focus/${task._id}`)} className="btn-secondary">
                <Timer size={14} /> Focus
              </button>
            </>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
