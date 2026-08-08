import { useEffect, useState } from 'react';
import { Lock, Bell, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';
import UnlockDepositModal from '../components/UnlockDepositModal';

const MIN_UNLOCK_DEPOSIT = 2000;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const notifStyles = {
  account: 'bg-blue-50 border-blue-100 text-blue-700',
  telegram_verification: 'bg-blue-50 border-blue-100 text-blue-700',
  deposit_required: 'bg-amber-50 border-amber-100 text-amber-700',
  deposit_approved: 'bg-green-50 border-green-100 text-green-700',
  deposit_rejected: 'bg-amber-50 border-amber-100 text-amber-700',
  payout_approved: 'bg-green-50 border-green-100 text-green-700',
  payout_rejected: 'bg-amber-50 border-amber-100 text-amber-700',
  system: 'bg-green-50 border-green-100 text-green-700',
};

export default function Home() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [earningsRange, setEarningsRange] = useState('Tdy');
  const [loading, setLoading] = useState(true);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  const loadHome = () => {
    Promise.all([api.get('/dashboard/home'), api.get('/earnings/summary')])
      .then(([homeRes, earnRes]) => {
        setSummary(homeRes.data.summary);
        setActivity(homeRes.data.recentActivity || []);
        setEarnings(earnRes.data.summary);
      })
      .catch(() => showToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHome();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-20">Loading dashboard...</div>;
  }

  const isUnlocked = summary?.isUnlocked;
  const earningsValue =
    earningsRange === 'Tdy' ? earnings?.today : earningsRange === '7D' ? earnings?.week : earnings?.month;

  return (
    <div className="space-y-6">
      {/* Balance card with deposit-required lock overlay */}
      <div className="relative bg-primary-950 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[320px]">
        <div className={`p-5 sm:p-8 ${!isUnlocked ? 'blur-sm select-none pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm sm:text-base">Available Balance</span>
            <Link
              to={isUnlocked ? '/paying' : '#'}
              onClick={(e) => {
                if (!isUnlocked) {
                  e.preventDefault();
                  setUnlockModalOpen(true);
                }
              }}
              className="text-xs sm:text-sm bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/20"
            >
              Deposit
            </Link>
          </div>
          <div className="text-3xl sm:text-5xl font-semibold text-white mt-3">{(summary?.availableBalance ?? 0).toFixed(2)} $</div>
        </div>

        {!isUnlocked && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-5 sm:px-8 py-8 sm:py-10 bg-primary-950/75">
            <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full bg-amber-100 flex items-center justify-center mb-4 sm:mb-5">
              <Lock className="text-amber-500" size={28} />
            </div>
            <h3 className="text-white font-semibold text-xl sm:text-2xl mb-2 w-full">Deposit Required</h3>
            <p className="text-white/70 text-sm sm:text-base w-full mb-5 sm:mb-6">
              Make an initial USDT deposit to unlock your trader account and start working
            </p>
            <button
              onClick={() => setUnlockModalOpen(true)}
              className="bg-gray-50 text-primary-700 font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl hover:bg-white transition-colors w-full max-w-sm text-center"
            >
              Make Deposit
            </button>
            <p className="text-white/50 text-xs sm:text-sm mt-3 sm:mt-4">Minimum: {MIN_UNLOCK_DEPOSIT} USDT</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Notifications widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[220px]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-800 font-medium text-base">
              <span className="relative">
                <Bell size={20} className="text-gray-400" />
                {activity.some((n) => !n.read) && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-white" />
                )}
              </span>
              Notifications
            </div>
            <Link to="/notifications" className="text-sm text-primary-600 flex items-center hover:underline">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {activity.length === 0 && <p className="text-sm text-gray-400">No notifications yet</p>}
            {activity.map((n) => (
              <div key={n._id} className={`rounded-lg border px-4 py-3 text-sm ${notifStyles[n.type] || notifStyles.system}`}>
                {n.message}
              </div>
            ))}
          </div>
        </div>

        {/* Earnings widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-800 font-medium text-base">
              <TrendingUp size={20} className="text-green-500" />
              Earnings
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
              {['Tdy', '7D', '30D', 'Custom'].map((r) => (
                <button
                  key={r}
                  onClick={() => setEarningsRange(r)}
                  className={`px-2.5 py-1 rounded-md ${
                    earningsRange === r ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-400">{earningsRange === 'Tdy' ? 'Today' : earningsRange === '7D' ? 'Last 7 days' : 'This month'}</span>
            <div className="text-3xl font-semibold text-green-600 mt-1">{(earningsValue ?? 0).toFixed(2)} $</div>
          </div>
          <div className="border-t border-gray-100 mt-5 pt-5 flex justify-between">
            <div>
              <span className="text-sm text-gray-400">Transactions</span>
              <div className="text-gray-800 font-medium text-lg">{earnings?.transactions ?? 0}</div>
            </div>
            <div>
              <span className="text-sm text-gray-400">Success Rate</span>
              <div className="text-green-600 font-medium text-lg">{earnings?.successRate ?? 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {unlockModalOpen && (
        <UnlockDepositModal onClose={() => setUnlockModalOpen(false)} onSubmitted={loadHome} />
      )}
    </div>
  );
}
