import { useEffect, useState } from 'react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AdminAuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/audit-logs')
      .then((res) => setLogs(res.data.logs))
      .catch(() => showToast('Failed to load audit logs', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No audit logs yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((l) => (
              <div key={l._id} className="border-b border-gray-50 pb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{l.action.replaceAll('_', ' ')}</span>
                  <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {l.adminId?.name} ({l.adminId?.email}) — {l.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
