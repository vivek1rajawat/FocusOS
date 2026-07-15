import { motion } from 'framer-motion';

const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950 px-4">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          🛡️ FocusOS
        </div>
        <p className="text-sm text-slate-500 mt-1">Your Personal AI Project Operating System</p>
      </div>
      <div className="card p-8">
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mb-6">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="text-center text-sm text-slate-500 mt-6">{footer}</div>}
    </motion.div>
  </div>
);

export default AuthShell;
