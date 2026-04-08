import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";
import { ThemeToggle } from "../common/ThemeToggle";

export const AuthLayout = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 transition-colors">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-accent-primary">Tracsig</h1>
          <p className="text-muted-foreground">Assignment Tracking System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
