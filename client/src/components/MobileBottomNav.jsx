import { NavLink } from 'react-router-dom';
import { LayoutGrid, CreditCard, ArrowDownToLine, ArrowUpFromLine, FileUp } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/account', label: 'Account', icon: CreditCard },
  { to: '/paying', label: 'Payins', icon: ArrowDownToLine },
  { to: '/payout', label: 'Payouts', icon: ArrowUpFromLine },
  { to: '/reports', label: 'Report', icon: FileUp },
];

export default function MobileBottomNav({ locked, onLockedNavAttempt }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={(e) => {
            if (locked && to !== '/') {
              e.preventDefault();
              onLockedNavAttempt?.();
            }
          }}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium ${
              isActive ? 'text-primary-600' : 'text-gray-400'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
