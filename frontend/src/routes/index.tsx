import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { Home } from '../pages/Home';
import { Unauthorized } from '../pages/Unauthorized';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '*', element: <Navigate to="/home" replace /> },
]);

export function AppRoutes(): React.ReactElement {
  return <RouterProvider router={router} />;
}
