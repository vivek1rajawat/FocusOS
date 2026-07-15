import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
    <p className="text-6xl">🧭</p>
    <h1 className="text-2xl font-semibold">Page not found</h1>
    <p className="text-slate-500">The page you're looking for doesn't exist.</p>
    <Link to="/" className="btn-primary mt-2">
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
