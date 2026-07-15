import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Notes from './pages/Notes';
import Goals from './pages/Goals';
import CalendarPage from './pages/Calendar';
import AnalyticsPage from './pages/Analytics';
import Kai from './pages/Kai';
import FocusMode from './pages/FocusMode';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/kai" element={<Kai />} />
        <Route path="/kai/:id" element={<Kai />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route
        path="/focus/:taskId"
        element={
          <ProtectedRoute>
            <FocusMode />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
