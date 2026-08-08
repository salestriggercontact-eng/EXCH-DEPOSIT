import { NavLink } from 'react-router-dom';
import { Home, UserCircle, ArrowDownToLine, ArrowUpFromLine, FileText, TrendingUp, Bell } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/account', label: 'Account', icon: UserCircle },
  { to: '/paying', label: 'Paying', icon: ArrowDownToLine },
  { to: '/payout', label: 'Payout', icon: ArrowUpFromLine },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/earning', label: 'Earning', icon: TrendingUp },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

// Desktop-only left sidebar. Mobile uses MobileBottomNav instead.
export default function Sidebar({ locked, onLockedNavAttempt }) {
  return (
    <aside className="hidden lg:flex lg:sticky top-0 left-0 h-screen w-64 bg-primary-950 text-white flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold">P</div>
        <span className="font-semibold text-lg">PayDash</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-white/40 border-t border-white/10">© 2026 PayDash</div>
    </aside>
  );
}
