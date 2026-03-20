import { Users, UserCheck, FileText, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export const AdminDashboard = () => {
  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: "1,245",
      color: "var(--accent-primary)",
      bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
    },
    {
      icon: UserCheck,
      label: "Total Staff",
      value: "48",
      color: "var(--accent-hover)",
      bgColor: "color-mix(in srgb, var(--accent-hover) 16%, transparent)",
    },
    {
      icon: FileText,
      label: "Total Assignments",
      value: "324",
      color: "var(--info)",
      bgColor: "color-mix(in srgb, var(--info) 16%, transparent)",
    },
    {
      icon: BookOpen,
      label: "Active Courses",
      value: "28",
      color: "var(--warning)",
      bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
  ];

  const monthlyAssignments = [
    { month: "Sep", assignments: 45 },
    { month: "Oct", assignments: 52 },
    { month: "Nov", assignments: 48 },
    { month: "Dec", assignments: 38 },
    { month: "Jan", assignments: 56 },
    { month: "Feb", assignments: 62 },
  ];

  const completionTrends = [
    { month: "Sep", completed: 85, pending: 15 },
    { month: "Oct", completed: 82, pending: 18 },
    { month: "Nov", completed: 88, pending: 12 },
    { month: "Dec", completed: 90, pending: 10 },
    { month: "Jan", completed: 87, pending: 13 },
    { month: "Feb", completed: 92, pending: 8 },
  ];

  const departmentStats = [
    { department: "Computer Science", students: 425, staff: 15 },
    { department: "Information Technology", students: 380, staff: 12 },
    { department: "Electronics", students: 290, staff: 11 },
    { department: "Mechanical", students: 150, staff: 10 },
  ];

  const recentActivity = [
    { id: 1, action: "New staff member added", user: "John Doe", time: "2 hours ago" },
    { id: 2, action: "Course updated", user: "Admin", time: "5 hours ago" },
    { id: 3, action: "Batch created", user: "Admin", time: "1 day ago" },
    { id: 4, action: "Assignment created", user: "Jane Smith", time: "2 days ago" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Admin Dashboard</h1>

      {/* Stats Grid */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Assignments */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Monthly Assignments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyAssignments}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Bar dataKey="assignments" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trends */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Completion Percentage Trends</h3>
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
        </div>
      </div>

      {/* Department Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-foreground">Department Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-foreground" style={{ fontWeight: 600 }}>
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-foreground" style={{ fontWeight: 600 }}>
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-foreground" style={{ fontWeight: 600 }}>
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-3 text-foreground" style={{ fontWeight: 600 }}>
                      {dept.department}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{dept.students}</td>
                    <td className="px-6 py-3 text-muted-foreground">{dept.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h3 className="mb-4 text-foreground">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 bg-muted rounded-lg"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-foreground" style={{ fontWeight: 600 }}>
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">by {activity.user}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
