import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, Sparkles, X, ListChecks, NotebookPen, Target, CalendarDays, BarChart3,
} from 'lucide-react';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`;

const Label = ({ show, children }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 'auto' }}
        exit={{ opacity: 0, width: 0 }}
        transition={{ duration: 0.15 }}
        className="overflow-hidden whitespace-nowrap"
      >
        {children}
      </motion.span>
    )}
  </AnimatePresence>
);

const Sidebar = ({ onClose }) => {
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400">
          🛡️ <Label show={sidebarOpen}>FocusOS</Label>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="px-3 space-y-1">
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Dashboard</Label>
        </NavLink>
        <NavLink to="/kai" className={linkClass}>
          <Sparkles size={18} className="shrink-0" />
          <Label show={sidebarOpen}>KAI</Label>
        </NavLink>
        <NavLink to="/tasks" className={linkClass}>
          <ListChecks size={18} className="shrink-0" />
          <Label show={sidebarOpen}>My Tasks</Label>
        </NavLink>
        <NavLink to="/goals" className={linkClass}>
          <Target size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Goals</Label>
        </NavLink>
        <NavLink to="/calendar" className={linkClass}>
          <CalendarDays size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Calendar</Label>
        </NavLink>
        <NavLink to="/notes" className={linkClass}>
          <NotebookPen size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Notes</Label>
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          <BarChart3 size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Analytics</Label>
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <Settings size={18} className="shrink-0" />
          <Label show={sidebarOpen}>Settings</Label>
        </NavLink>
      </nav>

      <div className="mt-6 flex-1" />

      {sidebarOpen && (
        <div className="p-4">
          <NavLink
            to="/kai"
            className="flex items-center gap-2 text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors whitespace-nowrap"
          >
            <Sparkles size={14} className="shrink-0" /> Ask KAI anything
          </NavLink>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
