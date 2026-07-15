import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Calendar, ListChecks, Play } from 'lucide-react';
import { PRIORITY_COLORS, formatDate, isOverdue } from '../../utils/format';

const TaskCard = ({ task, onClick }) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const subtaskTotal = task.subtasks?.length || 0;
  const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${PRIORITY_COLORS[task.priority]}`} title={task.priority} />
      </div>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3 min-w-0">
          {task.deadline && (
            <span className={`flex items-center gap-1 shrink-0 ${isOverdue(task.deadline, task.status) ? 'text-red-500' : ''}`}>
              <Calendar size={11} /> {formatDate(task.deadline)}
            </span>
          )}
          {subtaskTotal > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <ListChecks size={11} /> {subtaskDone}/{subtaskTotal}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/focus/${task._id}`);
          }}
          title="Start focus timer"
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 text-indigo-500 hover:text-indigo-600 transition-opacity"
        >
          <Play size={13} />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
