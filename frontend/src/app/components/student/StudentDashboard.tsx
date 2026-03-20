import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import api from "@/lib/api";

interface DashboardData {
  stats: {
    total_assignments: number;
    submitted: number;
    evaluated: number;
    pending: number;
    average_marks: number;
  };
  chart_data: Array<{ month: string; submitted: number; evaluated: number }>;
  recent_submissions: Array<{
    id: string;
    assignment_title: string;
    course_name?: string;
    submitted_at: string | null;
    status: string;
  }>;
}

export const StudentDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard")
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
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
          label: "Submitted",
          value: String(data.stats.submitted),
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
          label: "Avg Marks",
          value: data.stats.average_marks ? String(data.stats.average_marks) : "—",
          color: "var(--info)",
          bgColor: "color-mix(in srgb, var(--info) 16%, transparent)",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
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
          <h3 className="mb-4 text-foreground">Monthly Submissions</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.chart_data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Bar dataKey="submitted" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} name="Submitted" />
              <Bar dataKey="evaluated" fill="var(--success)" radius={[8, 8, 0, 0]} name="Evaluated" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Submission Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.chart_data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Line type="monotone" dataKey="submitted" stroke="var(--info)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
        <h3 className="mb-4 text-foreground">Recent Submissions</h3>
        {data?.recent_submissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {data?.recent_submissions.map((submission) => (
              <div key={submission.id} className="p-4 bg-muted rounded-lg border border-border">
                <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                  {submission.assignment_title}
                </h4>
                <p className="text-sm text-muted-foreground">{submission.course_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {submission.submitted_at
                      ? `Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}`
                      : "Draft"}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    submission.status === "evaluated" ? "bg-success/10 text-success" :
                    submission.status === "submitted" ? "bg-info/10 text-info" :
                    "bg-warning/10 text-warning"
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
