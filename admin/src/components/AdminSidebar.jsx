import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Users, Receipt, ScrollText, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { to: '/payouts', label: 'Payouts', icon: ArrowUpFromLine },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/custom-fields', label: 'Custom Fields', icon: Settings }, // <-- NEW
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <span className="text-lg font-bold text-primary-600">PayDash Admin</span>
        <button onClick={onClose} className="ml-auto lg:hidden text-gray-500">
          ✕
        </button>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
