import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// A small floating launcher that jumps to the full KAI chat page (/kai).
// The full chat experience (history, streaming, tool actions) lives there —
// this just keeps KAI one click away from anywhere in the app.
const KaiWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/kai')) return null;

  return (
    <button
      onClick={() => navigate('/kai')}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center z-40 hover:bg-indigo-500 transition-colors"
      title="Ask KAI"
    >
      <Sparkles size={22} />
    </button>
  );
};

export default KaiWidget;
