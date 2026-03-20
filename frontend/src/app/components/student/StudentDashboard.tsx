import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export const StudentDashboard = () => {
  const stats = [
    {
      icon: FileText,
      label: "Total Assignments",
      value: "24",
      color: "var(--accent-primary)",
      bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: "18",
      color: "var(--success)",
      bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
    },
    {
      icon: Clock,
      label: "Pending",
      value: "4",
      color: "var(--warning)",
      bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
    {
      icon: AlertCircle,
      label: "Overdue",
      value: "2",
      color: "var(--error)",
      bgColor: "color-mix(in srgb, var(--error) 16%, transparent)",
    },
  ];

  const weeklyData = [
    { day: "Mon", completed: 2 },
    { day: "Tue", completed: 3 },
    { day: "Wed", completed: 1 },
    { day: "Thu", completed: 4 },
    { day: "Fri", completed: 2 },
    { day: "Sat", completed: 1 },
    { day: "Sun", completed: 0 },
  ];

  const monthlyData = [
    { month: "Sep", assignments: 8 },
    { month: "Oct", assignments: 12 },
    { month: "Nov", assignments: 10 },
    { month: "Dec", assignments: 9 },
    { month: "Jan", assignments: 11 },
    { month: "Feb", assignments: 14 },
  ];

  const upcomingAssignments = [
    {
      id: 1,
      title: "Data Structures Project",
      course: "CS201",
      dueDate: "2026-03-18",
      status: "pending",
    },
    {
      id: 2,
      title: "Web Development Assignment",
      course: "CS301",
      dueDate: "2026-03-20",
      status: "pending",
    },
    {
      id: 3,
      title: "Database Design",
      course: "CS202",
      dueDate: "2026-03-22",
      status: "saved",
    },
  ];

  const recentSubmissions = [
    { id: 1, title: "Algorithm Analysis", course: "CS201", submittedOn: "2026-03-10", status: "Evaluated" },
    { id: 2, title: "UI/UX Design", course: "CS301", submittedOn: "2026-03-12", status: "Evaluated" },
    { id: 3, title: "System Architecture", course: "CS401", submittedOn: "2026-03-14", status: "Pending" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Dashboard</h1>

      {/* Stats Grid */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Completion */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Weekly Completion</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="day" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Bar dataKey="completed" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Statistics */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Monthly Statistics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip />
              <Line type="monotone" dataKey="assignments" stroke="var(--info)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Upcoming Assignments</h3>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="cursor-pointer rounded-lg border border-border bg-muted p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                      {assignment.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{assignment.course}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    assignment.status === "pending" ? "bg-warning/10 text-warning" : "bg-primary/10 text-accent-primary"
                  }`}>
                    {assignment.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Due: {assignment.dueDate}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Recent Submissions</h3>
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 bg-muted rounded-lg border border-border"
              >
                <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                  {submission.title}
                </h4>
                <p className="text-sm text-muted-foreground">{submission.course}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Submitted: {submission.submittedOn}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    submission.status === "Evaluated" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
