import { useEffect, useState } from "react";
import { Users, UserCheck, FileText, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { RechartsBarHoverCursor } from "../charts";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { fetchAdminDashboard } from "../../services/tracsigApi";

type AdminDash = {
  stats: {
    total_students: number;
    total_faculty: number;
    total_assignments: number;
    active_courses: number;
  };
  monthly_assignments: { month: string; assignments: number }[];
  completion_trends: { month: string; completed: number; pending: number }[];
  recent_activity: { id: number; action: string; actor_name: string; created_at: string }[];
};

export const AdminDashboard = () => {
  const [data, setData] = useState<AdminDash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = (await fetchAdminDashboard()) as AdminDash;
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError) toast.error(e.message);
          else toast.error("Could not load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: String(data.stats.total_students),
      color: "var(--accent-primary)",
      bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
    },
    {
      icon: UserCheck,
      label: "Total Faculty",
      value: String(data.stats.total_faculty),
      color: "var(--accent-hover)",
      bgColor: "color-mix(in srgb, var(--accent-hover) 16%, transparent)",
    },
    {
      icon: FileText,
      label: "Total Assignments",
      value: String(data.stats.total_assignments),
      color: "var(--info)",
      bgColor: "color-mix(in srgb, var(--info) 16%, transparent)",
    },
    {
      icon: BookOpen,
      label: "Active Courses",
      value: String(data.stats.active_courses),
      color: "var(--warning)",
      bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
  ];

  const monthlyAssignments = data.monthly_assignments ?? [];
  const completionTrends = data.completion_trends ?? [];
  const recentActivity = data.recent_activity ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-3xl mb-1" style={{ fontWeight: 700, color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Monthly Assignments</h3>
          {monthlyAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyAssignments}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip cursor={<RechartsBarHoverCursor />} />
                <Bar dataKey="assignments" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Completion Percentage Trends</h3>
          {completionTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="var(--success)" strokeWidth={2} name="Completed %" />
                <Line type="monotone" dataKey="pending" stroke="var(--warning)" strokeWidth={2} name="Pending %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              recentActivity.map((activity) => {
                let timeLabel = "";
                if (activity.created_at) {
                  try {
                    timeLabel = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
                  } catch {
                    timeLabel = activity.created_at;
                  }
                }
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 bg-muted rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-foreground" style={{ fontWeight: 600 }}>
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">{activity.actor_name}</p>
                      {timeLabel && <p className="text-xs text-muted-foreground mt-1">{timeLabel}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
