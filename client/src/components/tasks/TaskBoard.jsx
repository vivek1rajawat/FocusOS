import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { getTasks, reorderTasks } from '../../services/taskApi';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const COLUMNS = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'cancelled', label: 'Cancelled' },
];

const groupByStatus = (tasks) => {
  const grouped = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
  [...tasks]
    .sort((a, b) => a.order - b.order)
    .forEach((t) => {
      (grouped[t.status] = grouped[t.status] || []).push(t);
    });
  return grouped;
};

const TaskBoard = () => {
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => getTasks() });

  const [columns, setColumns] = useState(groupByStatus(tasks));
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => setColumns(groupByStatus(tasks)), [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findContainer = (id) => {
    if (COLUMNS.some((c) => c.id === id)) return id;
    return Object.keys(columns).find((key) => columns[key].some((t) => t._id === id));
  };

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((t) => t._id === active.id);
      const item = activeItems[activeIndex];
      if (!item) return prev;

      const overIndex = overItems.findIndex((t) => t._id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((t) => t._id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          { ...item, status: overContainer },
          ...overItems.slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    let finalColumns = columns;
    if (activeContainer === overContainer) {
      const items = columns[activeContainer];
      const oldIndex = items.findIndex((t) => t._id === active.id);
      const newIndex = items.findIndex((t) => t._id === over.id);
      if (oldIndex !== newIndex && newIndex >= 0) {
        finalColumns = { ...columns, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
        setColumns(finalColumns);
      }
    }

    const updates = [];
    [activeContainer, overContainer].forEach((status) => {
      finalColumns[status]?.forEach((t, index) => {
        updates.push({ id: t._id, status, order: index });
      });
    });

    if (updates.length) {
      try {
        await reorderTasks(updates);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> New Task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {COLUMNS.map((c) => (
            <KanbanColumn
              key={c.id}
              status={c.id}
              label={c.label}
              tasks={columns[c.id] || []}
              onTaskClick={setEditingTask}
            />
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
      </DndContext>

      {(editingTask || creating) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default TaskBoard;
