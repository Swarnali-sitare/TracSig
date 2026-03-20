import { useState, useEffect } from "react";
import { Users, UserCheck, FileText, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/api";

interface DashboardData {
  stats: {
    total_students: number;
    total_staff: number;
    total_courses: number;
    total_batches: number;
    total_assignments: number;
    total_submissions: number;
  };
  enrollment_data: Array<{ batch: string; students: number }>;
  submission_status: { draft: number; submitted: number; evaluated: number };
}

const PIE_COLORS = ["var(--warning)", "var(--accent-primary)", "var(--success)"];

export const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          icon: Users,
          label: "Total Students",
          value: data.stats.total_students.toLocaleString(),
          color: "var(--accent-primary)",
          bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
        },
        {
          icon: UserCheck,
          label: "Total Staff",
          value: String(data.stats.total_staff),
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
          value: String(data.stats.total_courses),
          color: "var(--warning)",
          bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
        },
      ]
    : [];

  const statusPieData = data
    ? [
        { name: "Draft", value: data.submission_status.draft },
        { name: "Submitted", value: data.submission_status.submitted },
        { name: "Evaluated", value: data.submission_status.evaluated },
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
          <h3 className="mb-4 text-foreground">Enrollment by Batch</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.enrollment_data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="batch" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Bar dataKey="students" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Submission Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                dataKey="value"
              >
                {statusPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Batches</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {data?.stats.total_batches ?? 0}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Submissions</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {data?.stats.total_submissions ?? 0}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Courses</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {data?.stats.total_courses ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
};
