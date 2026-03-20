import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "assignment",
    title: "New Assignment Posted",
    message: "Data Structures Project has been posted in CS201",
    time: "5 minutes ago",
    unread: true,
    iconKey: "bell",
    color: "var(--accent-primary)",
    bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
  },
  {
    id: 2,
    type: "reminder",
    title: "Assignment Due Soon",
    message: "Web Development Assignment is due in 2 days",
    time: "1 hour ago",
    unread: true,
    iconKey: "alert",
    color: "var(--warning)",
    bgColor: "color-mix(in srgb, var(--warning) 18%, transparent)",
  },
  {
    id: 3,
    type: "evaluation",
    title: "Assignment Evaluated",
    message: "Your submission for Algorithm Analysis has been evaluated",
    time: "3 hours ago",
    unread: false,
    iconKey: "check",
    color: "var(--success)",
    bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
  },
  {
    id: 4,
    type: "submission",
    title: "Submission Confirmed",
    message: "Your submission for UI/UX Design was received successfully",
    time: "1 day ago",
    unread: false,
    iconKey: "check",
    color: "var(--success)",
    bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
  },
  {
    id: 5,
    type: "system",
    title: "System Maintenance",
    message: "The system will undergo maintenance on Sunday, 3:00 AM - 5:00 AM",
    time: "2 days ago",
    unread: false,
    iconKey: "info",
    color: "var(--text-secondary)",
    bgColor: "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
  },
  {
    id: 6,
    type: "reminder",
    title: "Deadline Approaching",
    message: "Database Design assignment deadline is tomorrow",
    time: "3 days ago",
    unread: false,
    iconKey: "alert",
    color: "var(--warning)",
    bgColor: "color-mix(in srgb, var(--warning) 18%, transparent)",
  },
];

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  /** Remove one notification from the list */
  clearNotification: (id: number) => void;
  /** Remove all notifications from the list */
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => [
    ...INITIAL_NOTIFICATIONS,
  ]);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const clearNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
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
    [
      notifications,
      unreadCount,
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
