import React, { useState } from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { Sidebar } from "../common/Sidebar";
import { Header } from "../common/Header";

export const DashboardLayout = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
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
