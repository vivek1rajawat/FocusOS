import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from '../../utils/timeAgo';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/miscApi';

const NotificationsDropdown = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  const notifications = data?.notifications || [];

  const handleRead = async (id) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] card p-3 z-30 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">Notifications</p>
        <button onClick={handleReadAll} className="text-xs text-indigo-500">
          Mark all read
        </button>
      </div>
      {notifications.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">You're all caught up.</p>}
      <div className="space-y-1">
        {notifications.map((n) => (
          <button
            key={n._id}
            onClick={() => handleRead(n._id)}
            className={`w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
              n.read ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            <p>{n.message}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{formatDistanceToNow(n.createdAt)}</p>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="text-xs text-slate-400 mt-2 w-full text-center">
        Close
      </button>
    </div>
  );
};

export default NotificationsDropdown;
