import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { adminApi } from '../api/axios';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    adminApi.get('/admin/dashboard').then((res) => setSummary(res.data.summary));
  }, []);

  if (!summary) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  const cards = [
    { label: 'Total Users', value: summary.totalUsers, icon: Users, tone: 'text-primary-600 bg-primary-50' },
    { label: 'Pending Deposits', value: summary.pendingDeposits, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Payouts', value: summary.pendingPayouts, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Approved Deposits', value: summary.approvedDeposits, icon: CheckCircle2, tone: 'text-green-600 bg-green-50' },
    { label: 'Approved Payouts', value: summary.approvedPayouts, icon: CheckCircle2, tone: 'text-green-600 bg-green-50' },
    { label: 'Total Transaction Volume', value: `${summary.totalTransactionVolume.toFixed(2)} $`, icon: DollarSign, tone: 'text-primary-600 bg-primary-50' },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${c.tone}`}>
            <c.icon size={18} />
          </div>
          <span className="text-sm text-gray-500">{c.label}</span>
          <div className="text-2xl font-semibold text-gray-800 mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
