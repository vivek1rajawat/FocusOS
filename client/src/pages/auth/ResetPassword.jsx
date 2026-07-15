import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/ui/AuthShell';
import { resetPassword } from '../../services/authApi';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium">
          Back to login
        </Link>
      }
    >
      {!token ? (
        <p className="text-sm text-red-500">Missing or invalid reset token. Request a new link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">New password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
