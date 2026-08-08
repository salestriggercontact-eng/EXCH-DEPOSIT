import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // for modal

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

  // Helper to render custom fields nicely
  const renderCustomFields = (customFields) => {
    if (!customFields || Object.keys(customFields).length === 0) {
      return <span className="text-gray-400 text-xs">No data</span>;
    }
    // Show first 2 fields, if more show +N more
    const entries = Object.entries(customFields);
    if (entries.length <= 2) {
      return entries.map(([key, val]) => (
        <div key={key} className="text-xs text-gray-600">
          <span className="font-medium">{key}:</span> {val}
        </div>
      ));
    }
    const firstTwo = entries.slice(0, 2);
    const remaining = entries.length - 2;
    return (
      <>
        {firstTwo.map(([key, val]) => (
          <div key={key} className="text-xs text-gray-600">
            <span className="font-medium">{key}:</span> {val}
          </div>
        ))}
        <button
          onClick={() => setSelectedUser(users.find(u => u.customFields === customFields))}
          className="text-xs text-primary-600 hover:underline"
        >
          +{remaining} more
        </button>
      </>
    );
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
                <th className="py-2 font-medium min-w-[120px]">Custom Fields</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800 font-medium">{u.name}</td>
                  <td className="py-2.5 text-gray-600">{u.email}</td>
                  <td className="py-2.5 text-gray-600 font-mono text-xs">{u.accountId}</td>
                  <td className="py-2.5 text-gray-800 font-medium">{u.balance.toFixed(2)}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.isUnlocked ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {renderCustomFields(u.customFields)}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        u.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal to show all custom fields */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">
                Custom Fields - {selectedUser.name}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {selectedUser.customFields &&
            Object.keys(selectedUser.customFields).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(selectedUser.customFields).map(([key, val]) => (
                  <div key={key} className="border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 block">{key}</span>
                    <span className="text-sm text-gray-800 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No custom fields filled.</p>
            )}
            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
