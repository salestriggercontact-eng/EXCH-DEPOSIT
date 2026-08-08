import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/admin/users', { params: { search } })
      .then((res) => setUsers(res.data.users))
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      showToast(`User ${newStatus}`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or account ID"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No users found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Account ID</th>
                <th className="py-2 font-medium">Balance</th>
                <th className="py-2 font-medium">Unlocked</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800 font-medium">{u.name}</td>
                  <td className="py-2.5 text-gray-600">{u.email}</td>
                  <td className="py-2.5 text-gray-500 font-mono text-xs">{u.accountId}</td>
                  <td className="py-2.5 text-gray-800">{u.balance.toFixed(2)} $</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isUnlocked ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button onClick={() => toggleStatus(u)} className="text-xs text-primary-600 hover:underline">
                      {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
