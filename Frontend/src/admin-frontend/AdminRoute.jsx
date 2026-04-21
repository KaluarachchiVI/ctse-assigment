import { Navigate } from 'react-router-dom';
import { isAdminSession } from '../lib/adminAuth';

export default function AdminRoute({ children }) {
  if (!isAdminSession()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
