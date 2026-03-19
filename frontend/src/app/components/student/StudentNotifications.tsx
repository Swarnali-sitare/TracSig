import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useNotifications } from "../../context/NotificationsContext";
import type { NotificationIconKey } from "../../context/NotificationsContext";

const ICON_MAP: Record<
  NotificationIconKey,
  typeof Bell
> = {
  bell: Bell,
  alert: AlertCircle,
  check: CheckCircle,
  info: Info,
};

export const StudentNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-[#1F2937]">Notifications</h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="px-3 py-1.5 text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-[#EEF2FF] transition-colors"
              >
                Mark all as read
              </button>
              <span className="px-3 py-1 bg-[#2563EB] text-white rounded-full text-sm">
                {unreadCount} unread
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = ICON_MAP[notification.iconKey];
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border transition-colors ${
                notification.unread
                  ? "border-[#2563EB] bg-[#EEF2FF]"
                  : "border-[rgba(0,0,0,0.1)]"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: notification.bgColor }}
                  >
                    <Icon className="w-6 h-6" style={{ color: notification.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-[#1F2937]" style={{ fontWeight: 600 }}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.unread && (
                          <span className="w-2 h-2 bg-[#2563EB] rounded-full mt-2"></span>
                        )}
                        {notification.unread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm font-medium text-[#2563EB] hover:underline whitespace-nowrap"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[#6B7280] mb-2">{notification.message}</p>
                    <p className="text-sm text-[#6B7280]">{notification.time}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
