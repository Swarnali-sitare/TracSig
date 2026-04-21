import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";
import { AuthBootLoader } from "../common/AuthBootLoader";

export const RootLayout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (location.pathname === "/") {
    if (isLoading) {
      return <AuthBootLoader />;
    }
    if (user) {
      return <Navigate to={homePathForRole(user.role)} replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
