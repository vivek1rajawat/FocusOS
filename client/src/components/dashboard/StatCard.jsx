const TONES = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
};

const StatCard = ({ label, value, icon: Icon, tone = 'indigo' }) => (
  <div className="card p-4 flex items-center gap-3">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${TONES[tone] || TONES.indigo}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
);

export default StatCard;
