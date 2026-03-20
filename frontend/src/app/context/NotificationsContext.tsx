import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

export type NotificationIconKey = "bell" | "alert" | "check" | "info";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  iconKey: NotificationIconKey;
  color: string;
  bgColor: string;
}

function iconKeyFromBackend(iconKey: string): NotificationIconKey {
  const map: Record<string, NotificationIconKey> = {
    Bell: "bell",
    Clock: "alert",
    CheckCircle: "check",
    Send: "check",
    BookOpen: "bell",
  };
  return map[iconKey] ?? "bell";
}

function colorsForType(type: string): { color: string; bgColor: string } {
  switch (type) {
    case "assignment":
      return {
        color: "var(--accent-primary)",
        bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
      };
    case "evaluated":
    case "submitted":
      return {
        color: "var(--success)",
        bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
      };
    case "deadline":
    case "reminder":
      return {
        color: "var(--warning)",
        bgColor: "color-mix(in srgb, var(--warning) 18%, transparent)",
      };
    default:
      return {
        color: "var(--text-secondary)",
        bgColor: "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
      };
  }
}

function formatTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(n: any): NotificationItem {
  const { color, bgColor } = colorsForType(n.type);
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    time: formatTime(n.created_at),
    unread: !n.is_read,
    iconKey: iconKeyFromBackend(n.icon_key),
    color,
    bgColor,
  };
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications");
      setNotifications((data.data as unknown[]).map(mapNotification));
    } catch {
      // Silently fail — user may not be logged in yet
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
    } catch {
      // Optimistic update already applied; ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch {
      // Ignore
    }
  }, []);

  const clearNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Ignore
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
    } catch {
      // Ignore
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
