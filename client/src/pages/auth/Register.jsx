import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthShell from '../../components/ui/AuthShell';
import GoogleLoginButton from '../../components/ui/GoogleLoginButton';
import { register } from '../../services/authApi';
import { setCredentials } from '../../features/authSlice';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(form);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success('Account created! Check your email to verify.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Every account is its own private space — no admin, no roles."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Full name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Vivek Rajawat"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <div className="flex items-center gap-3 my-5">
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        <span className="text-xs text-slate-400">OR</span>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
      </div>
      <GoogleLoginButton />
    </AuthShell>
  );
};

export default Register;
