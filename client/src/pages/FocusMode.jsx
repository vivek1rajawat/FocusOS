import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Check, Play, Pause, SkipForward, Coffee, Brain } from 'lucide-react';
import { getTask, startTimer, stopTimer, updateSubtask } from '../services/taskApi';
import { useTheme } from '../hooks/useTheme';

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;
const LONG_BREAK_SEC = 15 * 60;
const SESSIONS_BEFORE_LONG_BREAK = 4;

const formatClock = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const beep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio not available — non-critical
  }
};

const FocusMode = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useTheme();

  const { data: task, refetch } = useQuery({ queryKey: ['task', taskId], queryFn: () => getTask(taskId) });

  const [phase, setPhase] = useState('work'); // 'work' | 'break' | 'longBreak'
  const [secondsLeft, setSecondsLeft] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  // Start the very first work session's backend timer on mount.
  useEffect(() => {
    startTimer(taskId).then(() => setRunning(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Phase transition when countdown hits zero.
  useEffect(() => {
    if (secondsLeft !== 0) return;

    const transition = async () => {
      beep();
      if (phase === 'work') {
        await stopTimer(taskId);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        refetch();
        const nextCount = sessionCount + 1;
        setSessionCount(nextCount);
        const nextPhase = nextCount % SESSIONS_BEFORE_LONG_BREAK === 0 ? 'longBreak' : 'break';
        setPhase(nextPhase);
        setSecondsLeft(nextPhase === 'longBreak' ? LONG_BREAK_SEC : BREAK_SEC);
        setRunning(true);
      } else {
        await startTimer(taskId);
        setPhase('work');
        setSecondsLeft(WORK_SEC);
        setRunning(true);
      }
    };

    transition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const toggleTimer = async () => {
    if (running) {
      if (phase === 'work') await stopTimer(taskId);
      setRunning(false);
    } else {
      if (phase === 'work') await startTimer(taskId);
      setRunning(true);
    }
  };

  const skipPhase = async () => {
    if (phase === 'work') {
      await stopTimer(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);
      const nextPhase = nextCount % SESSIONS_BEFORE_LONG_BREAK === 0 ? 'longBreak' : 'break';
      setPhase(nextPhase);
      setSecondsLeft(nextPhase === 'longBreak' ? LONG_BREAK_SEC : BREAK_SEC);
      setRunning(false);
    } else {
      await startTimer(taskId);
      setPhase('work');
      setSecondsLeft(WORK_SEC);
      setRunning(true);
    }
  };

  const handleToggleSubtask = async (s) => {
    await updateSubtask(s._id, { completed: !s.completed });
    refetch();
  };

  const handleExit = async () => {
    if (phase === 'work' && running) await stopTimer(taskId);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    navigate(-1);
  };

  if (!task) return null;

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const checklistProgress = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : task.progress;
  const isBreak = phase !== 'work';
  const totalForPhase = phase === 'work' ? WORK_SEC : phase === 'longBreak' ? LONG_BREAK_SEC : BREAK_SEC;
  const ringProgress = 1 - secondsLeft / totalForPhase;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 relative">
      <button onClick={handleExit} className="absolute top-6 right-6 text-slate-400 hover:text-white">
        <X size={24} />
      </button>

      <div className="absolute top-6 left-6 text-xs text-slate-500">
        Session {sessionCount + 1} · {isBreak ? 'Break' : 'Focus'}
      </div>

      <p
        className={`text-sm uppercase tracking-widest mb-2 flex items-center gap-2 ${
          isBreak ? 'text-emerald-400' : 'text-indigo-400'
        }`}
      >
        {isBreak ? <Coffee size={14} /> : <Brain size={14} />}
        {phase === 'work' ? 'Focus Session' : phase === 'longBreak' ? 'Long Break' : 'Short Break'}
      </p>
      <h1 className="text-3xl md:text-4xl font-semibold text-center max-w-2xl mb-8">
        {isBreak ? 'Take a breather 🙂' : task.title}
      </h1>

      <div className="text-center mb-8">
        <div className="relative h-56 w-56 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={isBreak ? '#10b981' : '#6366f1'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - ringProgress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold tabular-nums">{formatClock(secondsLeft)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleTimer}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
          >
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={skipPhase}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
          >
            <SkipForward size={16} /> Skip
          </button>
        </div>
      </div>

      {!isBreak && subtasks.length > 0 && (
        <div className="w-full max-w-md space-y-2 mb-8">
          {subtasks.map((s) => (
            <button
              key={s._id}
              onClick={() => handleToggleSubtask(s)}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              <span
                className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                  s.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'
                }`}
              >
                {s.completed && <Check size={12} />}
              </span>
              <span className={`text-sm ${s.completed ? 'line-through text-slate-500' : ''}`}>{s.title}</span>
            </button>
          ))}
        </div>
      )}

      {!isBreak && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Task Progress</span>
            <span>{checklistProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${checklistProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;
