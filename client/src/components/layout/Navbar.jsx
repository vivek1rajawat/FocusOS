import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, Sparkles, LogOut } from 'lucide-react';
import { toggleSidebar, setSearchOpen } from '../../features/uiSlice';
import { toggleTheme } from '../../features/themeSlice';
import { logout } from '../../features/authSlice';
import { useAuth } from '../../hooks/useAuth';
import NotificationsDropdown from '../ui/NotificationsDropdown';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = useSelector((s) => s.theme.mode);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:inline-flex"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={() => dispatch(setSearchOpen(true))}
          className="flex items-center gap-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 w-full max-w-sm"
        >
          <Search size={16} />
          Search tasks, notes, goals…
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/kai')}
          className="btn-primary !px-3 !py-2 hidden sm:inline-flex"
          title="Ask KAI"
        >
          <Sparkles size={16} /> KAI
        </button>

        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative"
          >
            <Bell size={18} />
          </button>
          {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 card p-2 z-30">
              <p className="px-2 py-1 text-sm font-medium truncate">{user?.name}</p>
              <p className="px-2 pb-2 text-xs text-slate-400 truncate">{user?.email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
