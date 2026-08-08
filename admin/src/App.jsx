import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './context/ToastContext';

import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDeposits from './pages/AdminDeposits';
import AdminPayouts from './pages/AdminPayouts';
import AdminUsers from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminCustomFields from './pages/AdminCustomFields';

export default function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/deposits" element={<AdminDeposits />} />
              <Route path="/payouts" element={<AdminPayouts />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/transactions" element={<AdminTransactions />} />
              <Route path="/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/custom-fields" element={<AdminCustomFields />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
import AdminUserCustomData from './pages/AdminUserCustomData';
// ... और रूट में
<Route path="/user-custom-data" element={<AdminUserCustomData />} />
