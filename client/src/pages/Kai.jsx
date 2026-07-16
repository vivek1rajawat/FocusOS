import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import toast from 'react-hot-toast';
import { Sparkles, Plus, Trash2, Send, Wand2, CheckCircle2, Download, Menu, X } from 'lucide-react';
import { getConversations, getConversation, deleteConversation, streamChat } from '../services/kaiApi';
import { formatDistanceToNow } from '../utils/timeAgo';
import { exportMarkdownToPdf } from '../utils/exportPdf';

// Only offer a PDF download when the user actually asked for one in the message that
// prompted this reply — not on every long response.
const DOWNLOAD_INTENT_RE = /\b(pdf|download|export|notes?)\b/i;

const SUGGESTIONS = [
  'Build a Food Delivery App',
  'What should I work on today?',
  'Explain closures in JavaScript',
  'Help me write a cover letter',
];

const Kai = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({ queryKey: ['kai-conversations'], queryFn: getConversations });
  const { data: loadedConversation } = useQuery({
    queryKey: ['kai-conversation', id],
    queryFn: () => getConversation(id),
    enabled: Boolean(id),
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (id && loadedConversation) {
      setMessages(loadedConversation.messages || []);
    } else if (!id) {
      setMessages([]);
    }
  }, [id, loadedConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || streaming) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setStreaming(true);
    setStreamingText('');

    await streamChat(
      { conversationId: id, message: content },
      {
        onToken: (chunk) => setStreamingText((prev) => prev + chunk),
        onDone: (returnedId) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
          setStreaming(false);
          queryClient.invalidateQueries({ queryKey: ['kai-conversations'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          if (!id && returnedId) navigate(`/kai/${returnedId}`, { replace: true });
        },
        onError: (err) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` }]);
          setStreaming(false);
        },
      }
    );
  };

  // Once streaming ends, fold the accumulated streamingText into the last assistant message.
  useEffect(() => {
    if (!streaming && streamingText) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next[next.length - 1] = { ...last, content: streamingText };
        }
        return next;
      });
      setStreamingText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const handleDelete = async (convId, e) => {
    e.stopPropagation();
    await deleteConversation(convId);
    queryClient.invalidateQueries({ queryKey: ['kai-conversations'] });
    if (convId === id) navigate('/kai');
  };

  const displayMessages = streaming
    ? [...messages, { role: 'assistant', content: streamingText, streaming: true }]
    : messages;

  const activeTitle = id ? conversations.find((c) => c._id === id)?.title : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-3 sm:-m-4 md:-m-6 relative overflow-hidden">
      {historyOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-200 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shrink-0 ${
          historyOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={() => {
              navigate('/kai');
              setHistoryOpen(false);
            }}
            className="btn-primary flex-1 !py-2 text-sm"
          >
            <Plus size={16} /> New Chat
          </button>
          <button
            onClick={() => setHistoryOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => {
                navigate(`/kai/${c._id}`);
                setHistoryOpen(false);
              }}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm ${
                id === c._id
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate">{c.title}</p>
                <p className="text-[10px] text-slate-400">{formatDistanceToNow(c.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(c._id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No conversations yet.</p>}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 shrink-0">
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <Menu size={18} />
          </button>
          <p className="text-sm font-medium truncate flex-1">{activeTitle || 'New chat'}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4">
                <Sparkles size={26} />
              </div>
              <h1 className="text-xl font-semibold mb-1">Talk to KAI</h1>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Your AI assistant for anything, plan projects, study a topic, write something, brainstorm, or organize your tasks and goals. Just ask.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="btn-secondary text-sm">
                    <Wand2 size={13} /> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
              {displayMessages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  precedingUserText={displayMessages[i - 1]?.role === 'user' ? displayMessages[i - 1].content : ''}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              className="input"
              placeholder="Ask KAI anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              autoFocus
            />
            <button type="submit" disabled={streaming || !input.trim()} className="btn-primary !px-4">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, precedingUserText }) => {
  const isUser = message.role === 'user';
  const [exporting, setExporting] = useState(false);

  const wantsDownload =
    !isUser && !message.streaming && Boolean(message.content) && DOWNLOAD_INTENT_RE.test(precedingUserText || '');

  const handleDownloadPdf = () => {
    setExporting(true);
    try {
      const heading = message.content.match(/^#{1,2}\s+(.+)$/m)?.[1] || 'FocusOS Notes';
      const filename = `${heading.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
      exportMarkdownToPdf(message.content, filename, heading);
    } catch (err) {
      toast.error('Could not generate the PDF — please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[92%] sm:max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        {!isUser && message.toolCalls?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {message.toolCalls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300"
              >
                <CheckCircle2 size={11} /> {tc.summary}
              </span>
            ))}
          </div>
        )}
        <div
          className={
            isUser
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm'
              : 'card px-5 py-4 text-sm prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-headings:font-semibold prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h2:first:mt-0 prose-h3:text-sm prose-h3:mt-4 prose-p:leading-relaxed prose-table:text-xs prose-thead:border-slate-300 dark:prose-thead:border-slate-700 prose-th:font-medium prose-th:bg-slate-50 dark:prose-th:bg-slate-800/60 prose-td:align-top prose-li:my-0.5'
          }
        >
          {isUser ? (
            message.content
          ) : message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto">
                    <table {...props} />
                  </div>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            </span>
          )}
        </div>
        {wantsDownload && (
          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Download size={12} /> {exporting ? 'Preparing PDF…' : 'Download as PDF'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Kai;
