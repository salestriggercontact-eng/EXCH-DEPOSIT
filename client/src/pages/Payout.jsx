import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Payout() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [homeRes, payoutsRes] = await Promise.all([api.get('/dashboard/home'), api.get('/payouts/my')]);
      setBalance(homeRes.data.summary.availableBalance);
      setPayouts(payoutsRes.data.payouts);
    } catch {
      showToast('Failed to load payout data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    if (Number(amount) > balance) return showToast('Amount exceeds available balance', 'error');
    if (!paymentDetails) return showToast('Enter your payment details', 'error');

    setSubmitting(true);
    try {
      await api.post('/payouts', { amount, paymentMethod, paymentDetails });
      showToast('Payout request submitted for review');
      setAmount('');
      setPaymentDetails('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit payout', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = payouts.filter((p) => p.status === 'pending');
  const history = payouts.filter((p) => p.status !== 'pending');

  return (
    <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Request payout</h2>
            <div className="text-sm text-gray-500">
              Available: <span className="font-semibold text-gray-800">{balance.toFixed(2)} $</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Payout amount</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Crypto (USDT)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Account / UPI / wallet details</label>
              <textarea
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                rows={3}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your UPI ID, bank account, or wallet address"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Submit payout request
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Previous payouts</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400">No previous payouts</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Method</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p._id} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 font-medium text-gray-800">{p.amount.toFixed(2)} $</td>
                      <td className="py-2.5 text-gray-600">{p.paymentMethod}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[p.status]}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
        <h2 className="font-semibold text-gray-800 mb-4">Pending payout requests</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing pending</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p._id} className="border border-amber-100 bg-amber-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{p.amount.toFixed(2)} $</span>
                  <span className="text-amber-700 text-xs font-medium">Pending</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.paymentMethod}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
