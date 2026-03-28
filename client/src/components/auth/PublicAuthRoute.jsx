import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useAuthStore from '../../store/useAuthStore';

// Prevent showing auth pages when a user already has an active session.
const PublicAuthRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isAuthenticated || isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicAuthRoute;
