import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import DepositRequiredModal from '../components/DepositRequiredModal';
import UnlockDepositModal from '../components/UnlockDepositModal';
import { UnlockProvider, useUnlock } from '../context/UnlockContext';

const titles = {
  '/': 'Home',
  '/account': 'Account',
  '/paying': 'Paying',
  '/payout': 'Payout',
  '/reports': 'Reports',
  '/earning': 'Earning',
  '/notifications': 'Notifications',
};

function DashboardLayoutInner() {
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const { pathname } = useLocation();
  const { isUnlocked, loading, refresh } = useUnlock();

  const locked = !loading && isUnlocked === false;
  const isHome = pathname === '/';

  // typed-URL / direct navigation to a locked page also surfaces the gate
  useEffect(() => {
    if (locked && !isHome) setGateModalOpen(true);
  }, [locked, isHome, pathname]);

  const openGate = () => setGateModalOpen(true);

  const handleMakeDeposit = () => {
    setGateModalOpen(false);
    setUnlockModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar locked={locked} onLockedNavAttempt={openGate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={titles[pathname] || 'Dashboard'} locked={locked} onLockedNavAttempt={openGate} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {locked && !isHome ? (
            <div className="max-w-md mx-auto text-center py-16 px-4">
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Lock className="text-amber-500" size={24} />
              </div>
              <h2 className="text-gray-800 font-semibold text-lg mb-1">Deposit Required</h2>
              <p className="text-gray-500 text-sm mb-4">
                Access to dashboard functionality is blocked until you make your first USDT deposit.
              </p>
              <button
                onClick={handleMakeDeposit}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
              >
                Make Deposit
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <MobileBottomNav locked={locked} onLockedNavAttempt={openGate} />

      {gateModalOpen && (
        <DepositRequiredModal onClose={() => setGateModalOpen(false)} onMakeDeposit={handleMakeDeposit} />
      )}
      {unlockModalOpen && (
        <UnlockDepositModal onClose={() => setUnlockModalOpen(false)} onSubmitted={refresh} />
      )}
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <UnlockProvider>
      <DashboardLayoutInner />
    </UnlockProvider>
  );
}
