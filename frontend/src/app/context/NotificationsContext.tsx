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
    color: "#2563EB",
    bgColor: "#EEF2FF",
  },
  {
    id: 2,
    type: "reminder",
    title: "Assignment Due Soon",
    message: "Web Development Assignment is due in 2 days",
    time: "1 hour ago",
    unread: true,
    iconKey: "alert",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
  },
  {
    id: 3,
    type: "evaluation",
    title: "Assignment Evaluated",
    message: "Your submission for Algorithm Analysis has been evaluated",
    time: "3 hours ago",
    unread: false,
    iconKey: "check",
    color: "#22C55E",
    bgColor: "#F0FDF4",
  },
  {
    id: 4,
    type: "submission",
    title: "Submission Confirmed",
    message: "Your submission for UI/UX Design was received successfully",
    time: "1 day ago",
    unread: false,
    iconKey: "check",
    color: "#22C55E",
    bgColor: "#F0FDF4",
  },
  {
    id: 5,
    type: "system",
    title: "System Maintenance",
    message: "The system will undergo maintenance on Sunday, 3:00 AM - 5:00 AM",
    time: "2 days ago",
    unread: false,
    iconKey: "info",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
  {
    id: 6,
    type: "reminder",
    title: "Deadline Approaching",
    message: "Database Design assignment deadline is tomorrow",
    time: "3 days ago",
    unread: false,
    iconKey: "alert",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
  },
];

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
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
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead]
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
