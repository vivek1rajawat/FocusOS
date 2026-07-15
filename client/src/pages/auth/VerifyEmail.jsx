import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/ui/AuthShell';
import { verifyEmail } from '../../services/authApi';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      footer={
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium">
          Go to login
        </Link>
      }
    >
      {status === 'verifying' && <p className="text-sm text-slate-500">Verifying your email…</p>}
      {status === 'success' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Your email has been verified. You can now use all FocusOS features.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500">This verification link is invalid or has expired.</p>
      )}
    </AuthShell>
  );
};

export default VerifyEmail;
