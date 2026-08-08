import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

const typeTabs = ['all', 'deposit', 'payout', 'earning'];
const statusTabs = ['all', 'pending', 'approved', 'rejected'];

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Reports() {
  const { showToast } = useToast();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ transactions: [], pagination: { pages: 1 }, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports', { params: { type, status, search, from, to, page, limit: 10 } })
      .then((res) => setData(res.data))
      .catch(() => showToast('Failed to load reports', 'error'))
      .finally(() => setLoading(false));
  }, [type, status, search, from, to, page]);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {typeTabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setPage(1);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
                type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="w-px bg-gray-200 mx-1" />
          {statusTabs.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
                status === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference ID or description"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Total amount (filtered)</span>
          <span className="font-semibold text-gray-800">{data.totalAmount.toFixed(2)} $</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : data.transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Transaction ID</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t._id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 text-gray-500 font-mono text-xs">{t.referenceId}</td>
                    <td className="py-2.5 text-gray-700 capitalize">{t.type}</td>
                    <td className="py-2.5 font-medium text-gray-800">{t.amount.toFixed(2)} $</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
