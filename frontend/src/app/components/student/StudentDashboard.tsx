import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import {
  countAssignmentStats,
  getMockStudentAssignments,
} from "../../data/studentAssignmentsMock";
import {
  getDisplayStatusBadgeClass,
  getStudentAssignmentDisplayStatus,
  isDueDatePassed,
} from "../../utils/assignmentStatus";

export const StudentDashboard = () => {
  const assignments = getMockStudentAssignments();
  const { total, completed, pending, incomplete } = countAssignmentStats(assignments);

  const stats = [
    {
      icon: FileText,
      label: "Total Assignments",
      value: String(total),
      color: "var(--accent-primary)",
      bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: String(completed),
      color: "var(--success)",
      bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
    },
    {
      icon: Clock,
      label: "Pending",
      value: String(pending),
      color: "var(--warning)",
      bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
    {
      icon: AlertCircle,
      label: "Incomplete",
      value: String(incomplete),
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

  const upcomingAssignments = [...assignments]
    .filter((a) => !isDueDatePassed(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const recentSubmissions = [...assignments]
    .filter((a) => a.status === "completed")
    .sort((a, b) => (b.submittedOn ?? b.dueDate).localeCompare(a.submittedOn ?? a.dueDate))
    .slice(0, 3);

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
          <p className="text-xs text-muted-foreground mb-3">
            Due date not passed — Pending or Completed.
          </p>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment) => {
              const displayStatus = getStudentAssignmentDisplayStatus(assignment);
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
                      <p className="text-sm text-muted-foreground">{assignment.course}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs border shrink-0 ${getDisplayStatusBadgeClass(displayStatus)}`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Due: {assignment.dueDate}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors">
          <h3 className="mb-4 text-foreground">Recent Submissions</h3>
          <p className="text-xs text-muted-foreground mb-3">Completed assignments (submitted).</p>
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
                  <p className="text-xs text-muted-foreground">
                    Submitted: {submission.submittedOn ?? submission.dueDate}
                  </p>
                  <span className="px-2 py-1 rounded text-xs bg-success/10 text-success border border-success/40">
                    Completed
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
