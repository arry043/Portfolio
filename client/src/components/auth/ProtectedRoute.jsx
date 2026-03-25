import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

// Wraps application routes to shield unauthorized views
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />; // Safely degrade back to dashboard
  }

  return <Outlet />;
};

export default ProtectedRoute;
