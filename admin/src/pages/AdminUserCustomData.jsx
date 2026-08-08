import { useEffect, useState } from 'react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AdminUserCustomData() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/custom-fields/admin/users-values')
      .then((res) => {
        setUsers(res.data.users);
        setFields(res.data.fields);
      })
      .catch(() => showToast('Failed to load user custom data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;

  return (
    <div className="space-y-4 max-w-6xl">
      <h2 className="text-lg font-semibold text-gray-800">Users' Custom Field Responses</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {users.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No users have filled custom fields yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Account ID</th>
                {fields.map((f) => (
                  <th key={f._id} className="py-2 font-medium">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">{user.name}</td>
                  <td className="py-2.5 text-gray-600">{user.email}</td>
                  <td className="py-2.5 text-gray-600">{user.accountId}</td>
                  {fields.map((f) => (
                    <td key={f._id} className="py-2.5 text-gray-600">
                      {user.values[f.fieldKey] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
