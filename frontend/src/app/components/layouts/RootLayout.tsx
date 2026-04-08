import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";

export const RootLayout = () => {
  const { user } = useAuth();

  // Redirect to appropriate dashboard or auth based on login status
  if (window.location.pathname === "/") {
    if (user) {
      return <Navigate to={homePathForRole(user.role)} replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
