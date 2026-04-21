import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatDistanceToNow } from "date-fns";
import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "../services/tracsigApi";
import { useAuth } from "./AuthContext";

export type NotificationIconKey = "bell" | "alert" | "check" | "info";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  iconKey: NotificationIconKey;
  color: string;
  bgColor: string;
}

function mapIconKey(iconKey: string): NotificationIconKey {
  if (iconKey === "bell" || iconKey === "alert" || iconKey === "check" || iconKey === "info") {
    return iconKey;
  }
  return "info";
}

function colorsForIcon(iconKey: NotificationIconKey): { color: string; bgColor: string } {
  switch (iconKey) {
    case "bell":
      return {
        color: "var(--accent-primary)",
        bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
      };
    case "alert":
      return {
        color: "var(--warning)",
        bgColor: "color-mix(in srgb, var(--warning) 18%, transparent)",
      };
    case "check":
      return {
        color: "var(--success)",
        bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
      };
    default:
      return {
        color: "var(--text-secondary)",
        bgColor: "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
      };
  }
}

function dtoToItem(n: NotificationDto): NotificationItem {
  const iconKey = mapIconKey(n.icon_key || "info");
  const { color, bgColor } = colorsForIcon(iconKey);
  let time = "";
  if (n.created_at) {
    try {
      time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
    } catch {
      time = "";
    }
  }
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    time,
    unread: !n.is_read,
    iconKey,
    color,
    bgColor,
  };
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STUDENT_NOTIFICATION_POLL_MS = 15 * 60 * 1000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items } = await fetchNotifications();
      setNotifications(items.map(dtoToItem));
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (user?.role !== "student") return;
    const id = window.setInterval(() => {
      void refetch();
    }, STUDENT_NOTIFICATION_POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch, user?.role]);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    void markNotificationRead(id).catch(() => refetch());
  }, [refetch]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    void markAllNotificationsRead().catch(() => refetch());
  }, [refetch]);

  const clearNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void deleteNotification(id).catch(() => refetch());
  }, [refetch]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    void deleteAllNotifications().catch(() => refetch());
  }, [refetch]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refetch,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      refetch,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    ]
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
