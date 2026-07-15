import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { STATUS_COLORS } from '../../utils/format';

const KanbanColumn = ({ status, label, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`w-72 shrink-0 rounded-2xl p-3 bg-slate-100/70 dark:bg-slate-900/50 ${isOver ? 'ring-2 ring-indigo-400' : ''}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>{label}</span>
        <span className="text-xs text-slate-400">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="space-y-2 min-h-[60px]">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
