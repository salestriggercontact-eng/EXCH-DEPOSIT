import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Earning() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/earnings/summary'), api.get('/earnings/history')])
      .then(([sRes, hRes]) => {
        setSummary(sRes.data.summary);
        setHistory(hRes.data.history);
      })
      .catch(() => showToast('Failed to load earnings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = [
    { label: 'Today', value: summary?.today ?? 0 },
    { label: 'This week', value: summary?.week ?? 0 },
    { label: 'This month', value: summary?.month ?? 0 },
  ];

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earnings" value={summary.total} highlight />
        <StatCard label="Today's Earnings" value={summary.today} />
        <StatCard label="This Week" value={summary.week} />
        <StatCard label="This Month" value={summary.month} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Pending Earnings" value={summary.pending} tone="amber" />
        <StatCard label="Success Rate" value={`${summary.successRate}%`} isText tone="green" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Earnings overview</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v.toFixed(2)} $`, 'Earnings']} />
              <Bar dataKey="value" fill="#2358f5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Earnings history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No earnings recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 font-medium text-gray-800 whitespace-nowrap">{h.amount.toFixed(2)} $</td>
                    <td className="py-2.5 text-gray-600 capitalize whitespace-nowrap">{h.status}</td>
                    <td className="py-2.5 text-gray-500">{h.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, isText, tone }) {
  const toneClass = tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-green-600' : 'text-gray-800';
  return (
    <div className={`bg-white rounded-2xl border p-5 ${highlight ? 'border-primary-200 bg-primary-50/40' : 'border-gray-100'}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{isText ? value : `${Number(value).toFixed(2)} $`}</div>
    </div>
  );
}
