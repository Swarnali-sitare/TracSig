import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const { accessToken } = useAuth();
  const location = useLocation();

  if (accessToken == null || accessToken === '') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
