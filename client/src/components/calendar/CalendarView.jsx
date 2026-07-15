import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTasks } from '../../services/taskApi';
import { PRIORITY_COLORS } from '../../utils/format';

const CalendarView = () => {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => getTasks() });
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const arr = [];
    let day = start;
    while (day <= end) {
      arr.push(day);
      day = addDays(day, 1);
    }
    return arr;
  }, [cursor]);

  const tasksByDay = (day) => tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">{format(cursor, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="btn-secondary !p-2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCursor(new Date())} className="btn-secondary !px-3 text-xs">
              Today
            </button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn-secondary !p-2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTasks = tasksByDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={`h-20 rounded-lg p-1 text-left border transition-colors ${
                  isSameMonth(day, cursor) ? 'border-slate-200 dark:border-slate-800' : 'border-transparent opacity-40'
                } ${selected && isSameDay(selected, day) ? 'ring-2 ring-indigo-500' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
              >
                <p className={`text-xs ${isSameDay(day, new Date()) ? 'text-indigo-600 font-bold' : ''}`}>{format(day, 'd')}</p>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span key={t._id} className={`h-1.5 w-1.5 rounded-full ${PRIORITY_COLORS[t.priority]}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-medium mb-3">{selected ? format(selected, 'EEEE, MMM d') : 'Select a day'}</h2>
        {selected ? (
          tasksByDay(selected).length === 0 ? (
            <p className="text-sm text-slate-400">No deadlines this day.</p>
          ) : (
            <div className="space-y-2">
              {tasksByDay(selected).map((t) => (
                <div key={t._id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[t.priority]}`} />
                  {t.title}
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-slate-400">Click a date to see deadlines.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
