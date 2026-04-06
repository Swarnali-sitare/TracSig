import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { RechartsBarHoverCursor } from "../charts";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { fetchStudentDashboard } from "../../services/tracsigApi";
import {
  getDisplayStatusBadgeClass,
  type StudentAssignmentDisplayStatus,
} from "../../utils/assignmentStatus";

type DashboardPayload = {
  stats: {
    total_assignments: number;
    completed: number;
    pending: number;
    incomplete: number;
  };
  weekly_completion: { day: string; completed: number }[];
  monthly_statistics: { month: string; assignments: number }[];
  upcoming_assignments: {
    id: number;
    title: string;
    course_code: string;
    due_date: string;
    display_status: string;
  }[];
  recent_submissions: { title: string; course_code: string; submitted_on: string }[];
};

function asDisplayStatus(s: string): StudentAssignmentDisplayStatus {
  if (s === "Pending" || s === "Completed" || s === "Incomplete") return s;
  return "Pending";
}

export const StudentDashboard = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = (await fetchStudentDashboard()) as DashboardPayload;
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

  const stats = data
    ? [
        {
          icon: FileText,
          label: "Total Assignments",
          value: String(data.stats.total_assignments),
          color: "var(--accent-primary)",
          bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
        },
        {
          icon: CheckCircle,
          label: "Completed",
          value: String(data.stats.completed),
          color: "var(--success)",
          bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
        },
        {
          icon: Clock,
          label: "Pending",
          value: String(data.stats.pending),
          color: "var(--warning)",
          bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
        },
        {
          icon: AlertCircle,
          label: "Incomplete",
          value: String(data.stats.incomplete),
          color: "var(--error)",
          bgColor: "color-mix(in srgb, var(--error) 16%, transparent)",
        },
      ]
    : [];

  const weeklyData = data?.weekly_completion?.length ? data.weekly_completion : [];
  const monthlyData = data?.monthly_statistics?.length ? data.monthly_statistics : [];
  const upcomingAssignments = data?.upcoming_assignments ?? [];
  const recentSubmissions = data?.recent_submissions ?? [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
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
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Weekly Completion</h3>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activity this week.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip cursor={<RechartsBarHoverCursor />} />
                <Bar dataKey="completed" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Monthly Statistics</h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip />
                <Line type="monotone" dataKey="assignments" stroke="var(--info)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Upcoming Assignments</h3>
          <p className="text-xs text-muted-foreground mb-3">Due date not passed — Pending or Completed.</p>
          <div className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming assignments.</p>
            ) : (
              upcomingAssignments.map((assignment) => {
                const displayStatus = asDisplayStatus(assignment.display_status);
                return (
                  <div
                    key={assignment.id}
                    className="cursor-pointer rounded-lg border border-border bg-muted p-4 transition-colors hover:border-primary"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{assignment.course_code}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs border shrink-0 ${getDisplayStatusBadgeClass(displayStatus)}`}
                      >
                        {displayStatus}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Due: {assignment.due_date}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Recent Submissions</h3>
          <p className="text-xs text-muted-foreground mb-3">Completed assignments (submitted).</p>
          <div className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent submissions.</p>
            ) : (
              recentSubmissions.map((submission, i) => (
                <div key={`${submission.title}-${i}`} className="p-4 bg-muted rounded-lg border border-border">
                  <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                    {submission.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{submission.course_code}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">Submitted: {submission.submitted_on}</p>
                    <span className="px-2 py-1 rounded text-xs bg-success/10 text-success border border-success/40">
                      Completed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
