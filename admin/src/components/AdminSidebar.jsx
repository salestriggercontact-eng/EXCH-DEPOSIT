import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Users, Receipt, ScrollText, ListPlus, X } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { to: '/payouts', label: 'Payouts', icon: ArrowUpFromLine },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/custom-fields', label: 'Custom Fields', icon: ListPlus },
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-gray-900 text-white z-40 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <span className="font-semibold text-lg">Admin Panel</span>
          <button className="lg:hidden text-white/70" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );

  const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { to: '/payouts', label: 'Payouts', icon: ArrowUpFromLine },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/user-custom-data', label: 'User Custom Data', icon: ListPlus }, // <-- नया
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/custom-fields', label: 'Custom Fields', icon: ListPlus },
];
}
