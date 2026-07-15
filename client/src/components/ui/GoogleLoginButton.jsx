import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleLogin } from '../../services/authApi';
import { setCredentials } from '../../features/authSlice';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleLoginButton = () => {
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID) return;

    const handleCredential = async (response) => {
      try {
        const data = await googleLogin(response.credential);
        dispatch(setCredentials({ user: data.user, token: data.token }));
        toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-in failed');
      }
    };

    const init = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      });
    };

    if (window.google) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [dispatch, navigate]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID/SECRET to enable Google login"
        className="btn-secondary w-full opacity-60 cursor-not-allowed"
      >
        Continue with Google (not configured)
      </button>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
};

export default GoogleLoginButton;
