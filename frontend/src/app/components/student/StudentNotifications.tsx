import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";

export const StudentNotifications = () => {
  const notifications = [
    {
      id: 1,
      type: "assignment",
      title: "New Assignment Posted",
      message: "Data Structures Project has been posted in CS201",
      time: "5 minutes ago",
      unread: true,
      icon: Bell,
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
      icon: AlertCircle,
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
      icon: CheckCircle,
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
      icon: CheckCircle,
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
      icon: Info,
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
      icon: AlertCircle,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#1F2937]">Notifications</h1>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-[#2563EB] text-white rounded-full text-sm">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = notification.icon;
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
                      {notification.unread && (
                        <span className="w-2 h-2 bg-[#2563EB] rounded-full flex-shrink-0 mt-2"></span>
                      )}
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
