import { Bell, Menu, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useNavigate } from "react-router";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[rgba(0,0,0,0.1)] z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-[#1F2937]" />
          </button>
          <h1 className="text-xl" style={{ fontWeight: 700, color: "#2563EB" }}>
            Tracsig
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-sm capitalize">
            {user?.role}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#1F2937]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.1)] overflow-hidden">
                <div className="p-4 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between gap-2">
                  <h3 style={{ fontWeight: 600 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-xs text-[#2563EB] hover:underline shrink-0"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] ${
                        notification.unread ? "bg-[#EEF2FF]" : ""
                      }`}
                    >
                      <div className="flex gap-2 justify-between items-start">
                        <button
                          type="button"
                          className="flex-1 text-left min-w-0"
                          onClick={() => {
                            if (notification.unread) markAsRead(notification.id);
                          }}
                        >
                          <p className="text-sm text-[#1F2937] font-medium">
                            {notification.title}
                          </p>
                          <p className="text-sm text-[#6B7280] mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            {notification.time}
                          </p>
                        </button>
                        {notification.unread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs text-[#2563EB] hover:underline shrink-0 pt-0.5"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-[#1F2937]">{user?.name}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.1)] overflow-hidden">
                <div className="p-4 border-b border-[rgba(0,0,0,0.1)]">
                  <p style={{ fontWeight: 600 }}>{user?.name}</p>
                  <p className="text-sm text-[#6B7280]">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full p-3 flex items-center gap-2 hover:bg-[#F8FAFC] text-[#EF4444] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
