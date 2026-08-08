import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProtectedRoute({ children }) {
  const { admin } = useAdminAuth();
  const token = localStorage.getItem('adminToken');
  if (!token || !admin) return <Navigate to="/login" replace />;
  return children;
}
