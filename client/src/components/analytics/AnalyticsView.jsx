import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { getAnalytics } from '../../services/miscApi';

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444', '#64748b'];

const AnalyticsView = () => {
  const { data, isLoading } = useQuery({ queryKey: ['analytics', 'all'], queryFn: () => getAnalytics() });

  if (isLoading) return <p className="text-sm text-slate-400">Crunching numbers…</p>;
  if (!data) return null;

  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5">
        <h2 className="font-medium mb-4">Productivity Trend (7 weeks)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h2 className="font-medium mb-4">Task Distribution</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {statusData.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5 lg:col-span-2">
        <h2 className="font-medium mb-4">Time Distribution by Day</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.timeByDay}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip />
            <Bar dataKey="minutes" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-400">Most Productive Day</p>
          <p className="text-lg font-semibold">{data.mostProductiveDay || '—'}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-400">Most Productive Hour</p>
          <p className="text-lg font-semibold">{data.mostProductiveHour}:00</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-400">Avg. Completion Time</p>
          <p className="text-lg font-semibold">{data.avgCompletionDays}d</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-400">Completed / Pending / Overdue</p>
          <p className="text-lg font-semibold">
            {data.completedCount} / {data.pendingCount} / {data.overdueCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
