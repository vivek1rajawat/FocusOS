import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Timer, Square, ExternalLink } from 'lucide-react';
import { getActiveTimerTask, stopTimer } from '../../services/taskApi';
import { formatMinutes } from '../../utils/format';

const ActiveTimerBar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: activeTask } = useQuery({
    queryKey: ['active-timer'],
    queryFn: getActiveTimerTask,
    refetchInterval: 15000,
  });

  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!activeTask) return undefined;
    const startedAt = new Date(activeTask.timerStartedAt).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTask]);

  if (!activeTask) return null;

  const totalMinutes = (activeTask.actualTime || 0) + elapsedSec / 60;

  const handleStop = async (e) => {
    e.stopPropagation();
    await stopTimer(activeTask._id);
    queryClient.invalidateQueries({ queryKey: ['active-timer'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <div
      onClick={() => navigate(`/focus/${activeTask._id}`)}
      className="flex items-center justify-between gap-3 px-4 py-2 bg-indigo-600 text-white text-sm cursor-pointer hover:bg-indigo-500 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Timer size={15} className="shrink-0 animate-pulse" />
        <span className="truncate">
          Focusing on <strong>{activeTask.title}</strong>
        </span>
        <span className="tabular-nums opacity-90 shrink-0">· {formatMinutes(totalMinutes)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/focus/${activeTask._id}`);
          }}
          className="flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 rounded-lg px-2 py-1 transition-colors"
        >
          <ExternalLink size={12} /> Open
        </button>
        <button
          onClick={handleStop}
          className="flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 rounded-lg px-2 py-1 transition-colors"
        >
          <Square size={12} /> Stop
        </button>
      </div>
    </div>
  );
};

export default ActiveTimerBar;
