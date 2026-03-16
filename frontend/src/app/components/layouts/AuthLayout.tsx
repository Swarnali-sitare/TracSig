import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export const AuthLayout = () => {
  const { user } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2" style={{ fontWeight: 700, color: "#2563EB" }}>
            Tracsig
          </h1>
          <p className="text-[#6B7280]">Assignment Tracking System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
