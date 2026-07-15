import { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { updateMe } from '../services/authApi';
import { updateUser } from '../features/authSlice';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateMe({ name });
      dispatch(updateUser(data.user));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Account Settings</h1>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input className="input opacity-60" value={user?.email} disabled />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div className="card p-5">
        <h3 className="font-medium mb-2">Streak</h3>
        <p className="text-sm text-slate-500">
          You're on a <strong>{user?.streak || 0}-day</strong> streak. Keep logging in and completing tasks to grow it.
        </p>
      </div>
    </div>
  );
};

export default Settings;
