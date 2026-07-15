import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Search, ListTodo, StickyNote, Target } from 'lucide-react';
import { setSearchOpen } from '../../features/uiSlice';
import { useDebounce } from '../../hooks/useDebounce';
import { globalSearch } from '../../services/miscApi';

const GlobalSearchModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const { data } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => globalSearch(debouncedQ),
    enabled: debouncedQ.trim().length > 1,
  });

  const close = () => dispatch(setSearchOpen(false));

  const goTo = (path) => {
    close();
    navigate(path);
  };

  const results = data || { tasks: [], notes: [], goals: [], tags: [] };
  const hasResults = results.tasks.length || results.notes.length || results.goals.length;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center pt-24 px-4" onClick={close}>
      <div className="card w-full max-w-xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search tasks, notes, goals, tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={close}>
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {debouncedQ.trim().length <= 1 && (
            <p className="text-sm text-slate-400 text-center py-8">Start typing to search everything…</p>
          )}

          {results.tasks.length > 0 && (
            <SearchGroup icon={<ListTodo size={14} />} title="Tasks">
              {results.tasks.map((t) => (
                <SearchItem key={t._id} label={t.title} onClick={() => goTo('/tasks')} />
              ))}
            </SearchGroup>
          )}
          {results.notes.length > 0 && (
            <SearchGroup icon={<StickyNote size={14} />} title="Notes">
              {results.notes.map((n) => (
                <SearchItem key={n._id} label={n.title} onClick={() => goTo('/notes')} />
              ))}
            </SearchGroup>
          )}
          {results.goals.length > 0 && (
            <SearchGroup icon={<Target size={14} />} title="Goals">
              {results.goals.map((g) => (
                <SearchItem key={g._id} label={g.title} onClick={() => goTo('/goals')} />
              ))}
            </SearchGroup>
          )}

          {debouncedQ.trim().length > 1 && !hasResults && (
            <p className="text-sm text-slate-400 text-center py-8">No results for "{debouncedQ}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchGroup = ({ icon, title, children }) => (
  <div>
    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400 mb-1">
      {icon} {title}
    </p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const SearchItem = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 truncate"
  >
    {label}
  </button>
);

export default GlobalSearchModal;
