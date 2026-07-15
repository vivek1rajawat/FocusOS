import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Trash2, Eye, Pencil, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotes, createNote, updateNote, deleteNote } from '../services/noteApi';
import { useDebounce } from '../hooks/useDebounce';
import { formatDateLong } from '../utils/format';

const Notes = () => {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 250);
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', debouncedQ],
    queryFn: () => getNotes({ q: debouncedQ || undefined }),
  });

  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = notes.find((n) => n._id === activeId);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notes'] });

  const openNote = (note) => {
    setActiveId(note._id);
    setDraft({ title: note.title, content: note.content });
    setPreview(false);
  };

  const handleNew = async () => {
    const note = await createNote({ title: `Note — ${formatDateLong(new Date())}`, content: '' });
    invalidate();
    openNote(note);
  };

  const handleSave = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      await updateNote(activeId, draft);
      invalidate();
      toast.success('Note saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (activeId === id) setActiveId(null);
    invalidate();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-sm text-slate-500">Your journal, plan your day, jot down ideas, keep anything on your mind.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-3 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-slate-400" />
            <input className="input !py-1.5 text-sm" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button onClick={handleNew} className="btn-primary w-full mb-3 !py-1.5 text-sm">
            <Plus size={14} /> New Note
          </button>
          <div className="space-y-1 max-h-[32rem] overflow-y-auto">
            {notes.map((n) => (
              <div
                key={n._id}
                className={`group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer text-sm ${
                  activeId === n._id ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => openNote(n)}
              >
                <span className="truncate">{n.title}</span>
                <button onClick={(e) => (e.stopPropagation(), handleDelete(n._id))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {notes.length === 0 && <p className="text-xs text-slate-400 px-2">No notes yet. Start writing.</p>}
          </div>
        </div>

        <div className="card p-4 lg:col-span-3">
          {!active ? (
            <p className="text-sm text-slate-400 text-center py-16">Select or create a note to get started.</p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  className="input flex-1 font-medium"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
                <button onClick={() => setPreview((p) => !p)} className="btn-secondary !px-3">
                  {preview ? <Pencil size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
              {preview ? (
                <div className="prose prose-sm dark:prose-invert max-w-none min-h-[24rem] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content || '*Nothing to preview*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="input min-h-[24rem] font-mono text-sm"
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder={'Plan your day, take notes…\n\n- [ ] checklist item\n\n```js\nconsole.log("code block")\n```\n\n![alt](https://image-url)'}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
