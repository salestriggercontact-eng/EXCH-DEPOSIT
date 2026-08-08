import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';

export default function Header({ title, onMenuClick, locked, onLockedNavAttempt }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    api
      .get('/notifications')
      .then((res) => setUnreadCount(res.data.unreadCount))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-600" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          Online
        </div>
      </div>

      <h1 className="text-lg font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2 hidden md:block">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right leading-tight">
          <div className="text-sm text-primary-600 font-medium">{user?.email}</div>
          <div className="text-xs text-gray-500">{user?.name}</div>
        </div>

        <Link
          to="/notifications"
          onClick={(e) => {
            if (locked) {
              e.preventDefault();
              onLockedNavAttempt?.();
            }
          }}
          className="relative text-gray-500 hover:text-gray-700"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="text-gray-500 hover:text-gray-700">
            <UserCircle size={24} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
              <Link
                to="/account"
                onClick={(e) => {
                  setMenuOpen(false);
                  if (locked) {
                    e.preventDefault();
                    onLockedNavAttempt?.();
                  }
                }}
                className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
