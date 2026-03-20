import { useState, useEffect } from "react";
import { FileText, Users, CheckCircle, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import api from "@/lib/api";

interface DashboardData {
  stats: {
    total_assignments: number;
    total_submissions: number;
    pending_evaluation: number;
    evaluated: number;
  };
  chart_data: Array<{ assignment: string; submissions: number }>;
  status_distribution: Array<{ name: string; value: number }>;
}

const PIE_COLORS = ["var(--warning)", "var(--accent-primary)", "var(--success)"];

export const StaffDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/staff/dashboard")
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          icon: FileText,
          label: "Assignments Created",
          value: String(data.stats.total_assignments),
          color: "var(--accent-primary)",
          bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
        },
        {
          icon: Users,
          label: "Total Submissions",
          value: String(data.stats.total_submissions),
          color: "var(--accent-hover)",
          bgColor: "color-mix(in srgb, var(--accent-hover) 16%, transparent)",
        },
        {
          icon: CheckCircle,
          label: "Evaluated",
          value: String(data.stats.evaluated),
          color: "var(--success)",
          bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
        },
        {
          icon: TrendingUp,
          label: "Pending Evaluation",
          value: String(data.stats.pending_evaluation),
          color: "var(--warning)",
          bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
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
      <h1 className="mb-6 text-foreground">Staff Dashboard</h1>

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
          <h3 className="mb-4 text-foreground">Submission Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.status_distribution ?? []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                dataKey="value"
              >
                {(data?.status_distribution ?? []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Submissions per Assignment</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.chart_data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="assignment" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="submissions" fill="var(--accent-primary)" name="Submissions" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
