import { useEffect, useState } from 'react';
import { Check, X, Settings, Plus } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

const statusStyles = {
  initiated: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function AdminDeposits() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressPanelOpen, setAddressPanelOpen] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/deposits/admin/all', { params: status === 'all' ? {} : { status } })
      .then((res) => setDeposits(res.data.deposits))
      .catch(() => showToast('Failed to load deposits', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const approve = async (id) => {
    try {
      await adminApi.patch(`/deposits/admin/${id}/approve`);
      showToast('Deposit approved and balance credited');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await adminApi.patch(`/deposits/admin/${id}/reject`, { reason });
      showToast('Deposit rejected');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
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
        <button
          onClick={() => setAddressPanelOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <Settings size={14} /> Deposit addresses
        </button>
      </div>

      {addressPanelOpen && <DepositAddressPanel />}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : deposits.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No deposits found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Coin / Network</th>
                <th className="py-2 font-medium">Reference</th>
                <th className="py-2 font-medium">Proof</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d._id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <div className="text-gray-800 font-medium">{d.userId?.name}</div>
                    <div className="text-xs text-gray-400">{d.userId?.email}</div>
                  </td>
                  <td className="py-2.5 font-medium text-gray-800">{d.amount}</td>
                  <td className="py-2.5 text-gray-600">
                    {d.coin} / {d.network}
                  </td>
                  <td className="py-2.5 text-gray-500 font-mono text-xs">{d.referenceId}</td>
                  <td className="py-2.5">
                    {d.paymentProof ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${d.paymentProof}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline text-xs"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2.5 text-gray-500 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="py-2.5">
                    {d.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve(d._id)} className="text-green-600 hover:bg-green-50 rounded p-1.5">
                          <Check size={16} />
                        </button>
                        <button onClick={() => reject(d._id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
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

function DepositAddressPanel() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ coin: '', coinSymbol: '', network: '', address: '', minimumDeposit: '', isPopular: false });
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.get('/deposits/admin/addresses').then((res) => setAddresses(res.data.addresses));

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post('/deposits/admin/addresses', form);
      showToast('Deposit address saved');
      setForm({ coin: '', coinSymbol: '', network: '', address: '', minimumDeposit: '', isPopular: false });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this deposit address?')) return;
    await adminApi.delete(`/deposits/admin/addresses/${id}`);
    load();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Manage deposit addresses (shown on user Paying page)</h3>
      <form onSubmit={save} className="grid sm:grid-cols-3 gap-3 mb-5">
        <input required placeholder="Coin name (e.g. TRON)" value={form.coin} onChange={(e) => setForm({ ...form, coin: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Symbol (e.g. TRX)" value={form.coinSymbol} onChange={(e) => setForm({ ...form, coinSymbol: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Network (e.g. TRON (TRX))" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Wallet address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <input required type="number" placeholder="Minimum deposit" value={form.minimumDeposit} onChange={(e) => setForm({ ...form, minimumDeposit: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
          Mark as popular coin
        </label>
        <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60">
          <Plus size={14} /> {saving ? 'Saving...' : 'Save address'}
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Network</th>
            <th className="py-2 font-medium">Address</th>
            <th className="py-2 font-medium">Min. deposit</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((a) => (
            <tr key={a._id} className="border-b border-gray-50">
              <td className="py-2 text-gray-800">{a.coin} ({a.coinSymbol})</td>
              <td className="py-2 text-gray-600">{a.network}</td>
              <td className="py-2 text-gray-500 font-mono text-xs truncate max-w-[160px]">{a.address}</td>
              <td className="py-2 text-gray-600">{a.minimumDeposit}</td>
              <td className="py-2">
                <button onClick={() => remove(a._id)} className="text-red-500 hover:underline text-xs">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
