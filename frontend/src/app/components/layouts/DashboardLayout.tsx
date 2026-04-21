import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { AuthBootLoader } from "../common/AuthBootLoader";
import { Sidebar } from "../common/Sidebar";
import { Header } from "../common/Header";

export const DashboardLayout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Wait for session bootstrap — otherwise first paint has user=null and we wrongly send users to login.
  if (isLoading) {
    return <AuthBootLoader />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  const path = location.pathname;
  if (path.startsWith("/admin") && user.role !== "admin") {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  if (path.startsWith("/student") && user.role !== "student") {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  if (path.startsWith("/faculty") && user.role !== "faculty") {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background transition-colors">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} />
          <main
            className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} mt-16`}
          >
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
};
