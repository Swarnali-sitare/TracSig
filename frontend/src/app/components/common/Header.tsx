import { Bell, Menu, User, LogOut, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-border bg-card transition-colors">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 transition-colors hover:bg-hover-bg"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-accent-primary">Tracsig</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="rounded-full bg-primary/15 px-3 py-1 text-sm capitalize text-accent-primary">
            {user?.role}
          </div>

          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 transition-colors hover:bg-hover-bg"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        className="shrink-0 text-xs text-accent-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearAllNotifications()}
                        className="shrink-0 text-xs text-error hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border-b border-border p-4 transition-colors hover:bg-hover-bg ${
                          notification.unread ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              if (notification.unread) markAsRead(notification.id);
                            }}
                          >
                            <p className="text-sm font-medium text-foreground">{notification.title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{notification.time}</p>
                          </button>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {notification.unread && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="pt-0.5 text-xs text-accent-primary hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => clearNotification(notification.id)}
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                              aria-label={`Dismiss ${notification.title}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-hover-bg"
              aria-label="Profile menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-foreground">{user?.name}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-colors">
                <div className="border-b border-border p-4">
                  <p className="font-semibold text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 p-3 text-error transition-colors hover:bg-hover-bg"
                >
                  <LogOut className="h-4 w-4" />
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
