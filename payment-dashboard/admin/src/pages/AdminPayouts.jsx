import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminPayouts() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/payouts/admin/all', { params: status === 'all' ? {} : { status } })
      .then((res) => setPayouts(res.data.payouts))
      .catch(() => showToast('Failed to load payouts', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const approve = async (id) => {
    try {
      await adminApi.patch(`/payouts/admin/${id}/approve`);
      showToast('Payout approved and balance debited');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
      load();
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await adminApi.patch(`/payouts/admin/${id}/reject`, { reason });
      showToast('Payout rejected');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
              status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : payouts.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No payouts found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Method</th>
                <th className="py-2 font-medium">Details</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <div className="text-gray-800 font-medium">{p.userId?.name}</div>
                    <div className="text-xs text-gray-400">
                      Balance: {p.userId?.balance?.toFixed(2)} $
                    </div>
                  </td>
                  <td className="py-2.5 font-medium text-gray-800">{p.amount}</td>
                  <td className="py-2.5 text-gray-600">{p.paymentMethod}</td>
                  <td className="py-2.5 text-gray-500 max-w-[180px] truncate">{p.paymentDetails}</td>
                  <td className="py-2.5 text-gray-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="py-2.5">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve(p._id)} className="text-green-600 hover:bg-green-50 rounded p-1.5">
                          <Check size={16} />
                        </button>
                        <button onClick={() => reject(p._id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                          <X size={16} />
                        </button>
                      </div>
                    )}
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
