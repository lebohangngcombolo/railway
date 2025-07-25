import React from 'react';
import { Navigate } from 'react-router-dom';
import { requireRole } from '../utils/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  if (!requireRole('admin')) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default AdminRoute; 