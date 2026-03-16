import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export const RootLayout = () => {
  const { user } = useAuth();

  // Redirect to appropriate dashboard or auth based on login status
  if (window.location.pathname === "/") {
    if (user) {
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
