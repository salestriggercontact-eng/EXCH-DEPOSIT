import { useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

const dotColor = {
  deposit_approved: 'bg-green-500',
  payout_approved: 'bg-green-500',
  deposit_rejected: 'bg-red-500',
  payout_rejected: 'bg-red-500',
  account: 'bg-blue-500',
  telegram_verification: 'bg-blue-500',
  deposit_required: 'bg-amber-500',
  system: 'bg-green-500',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/notifications')
      .then((res) => setNotifications(res.data.notifications))
      .catch(() => showToast('Failed to load notifications', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {
      showToast('Failed to update notification', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } catch {
      showToast('Failed to update notifications', 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold text-gray-800">
            Notifications {unreadCount > 0 && <span className="text-sm font-normal text-gray-400">({unreadCount} unread)</span>}
          </h2>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No notifications yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={`w-full text-left flex gap-3 rounded-lg px-3 py-3 border ${
                  n.read ? 'border-gray-100 bg-white' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : dotColor[n.type] || 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{n.title}</span>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 break-words">{n.message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
