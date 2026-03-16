import { FileText, Users, CheckCircle, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export const StaffDashboard = () => {
  const stats = [
    {
      icon: FileText,
      label: "Assignments Created",
      value: "32",
      color: "#2563EB",
      bgColor: "#EEF2FF",
    },
    {
      icon: Users,
      label: "Total Students",
      value: "156",
      color: "#4F46E5",
      bgColor: "#EEF2FF",
    },
    {
      icon: CheckCircle,
      label: "Submissions",
      value: "124",
      color: "#22C55E",
      bgColor: "#F0FDF4",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: "79%",
      color: "#14B8A6",
      bgColor: "#F0FDFA",
    },
  ];

  const completionData = [
    { name: "Completed", value: 124, color: "#22C55E" },
    { name: "Pending", value: 28, color: "#F59E0B" },
    { name: "Overdue", value: 4, color: "#EF4444" },
  ];

  const courseProgressData = [
    { course: "CS101", submissions: 45, total: 50 },
    { course: "CS201", submissions: 38, total: 52 },
    { course: "CS301", submissions: 28, total: 35 },
    { course: "CS401", submissions: 13, total: 19 },
  ];

  const recentAssignments = [
    { id: 1, title: "Data Structures Project", course: "CS201", students: 52, submitted: 38, dueDate: "2026-03-18" },
    { id: 2, title: "Web Development", course: "CS301", students: 35, submitted: 28, dueDate: "2026-03-20" },
    { id: 3, title: "Algorithm Analysis", course: "CS201", students: 52, submitted: 45, dueDate: "2026-03-10" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-[#1F2937]">Staff Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
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
              <p className="text-[#6B7280]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Submission Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <h3 className="mb-4 text-[#1F2937]">Submission Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <h3 className="mb-4 text-[#1F2937]">Course Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courseProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="course" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="submissions" fill="#2563EB" name="Submissions" radius={[8, 8, 0, 0]} />
              <Bar dataKey="total" fill="#E5E7EB" name="Total Students" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
        <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
          <h3 className="text-[#1F2937]">Recent Assignments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Assignment Title
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Students
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Submissions
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.map((assignment) => {
                const progress = Math.round((assignment.submitted / assignment.students) * 100);
                return (
                  <tr
                    key={assignment.id}
                    className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4 text-[#1F2937]" style={{ fontWeight: 600 }}>
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{assignment.course}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{assignment.students}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{assignment.submitted}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{assignment.dueDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#22C55E]"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#6B7280]">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
