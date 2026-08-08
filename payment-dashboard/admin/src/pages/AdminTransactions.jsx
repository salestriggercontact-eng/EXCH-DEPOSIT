import { useEffect, useState } from 'react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminTransactions() {
  const { showToast } = useToast();
  const [type, setType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/admin/transactions', { params: { type } })
      .then((res) => setTransactions(res.data.transactions))
      .catch(() => showToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex gap-2">
        {['all', 'deposit', 'payout', 'earning'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
              type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No transactions found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Balance before → after</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">{t.userId?.name}</td>
                  <td className="py-2.5 text-gray-600 capitalize">{t.type}</td>
                  <td className="py-2.5 font-medium text-gray-800">{t.amount.toFixed(2)} $</td>
                  <td className="py-2.5 text-gray-500">
                    {t.balanceBefore.toFixed(2)} → {t.balanceAfter.toFixed(2)}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="py-2.5 text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
