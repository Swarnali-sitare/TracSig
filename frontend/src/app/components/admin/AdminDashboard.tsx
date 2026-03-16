import { Users, UserCheck, FileText, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export const AdminDashboard = () => {
  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: "1,245",
      color: "#2563EB",
      bgColor: "#EEF2FF",
    },
    {
      icon: UserCheck,
      label: "Total Staff",
      value: "48",
      color: "#4F46E5",
      bgColor: "#EEF2FF",
    },
    {
      icon: FileText,
      label: "Total Assignments",
      value: "324",
      color: "#14B8A6",
      bgColor: "#F0FDFA",
    },
    {
      icon: BookOpen,
      label: "Active Courses",
      value: "28",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
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
      <h1 className="mb-6 text-[#1F2937]">Admin Dashboard</h1>

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
        {/* Monthly Assignments */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <h3 className="mb-4 text-[#1F2937]">Monthly Assignments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyAssignments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="assignments" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <h3 className="mb-4 text-[#1F2937]">Completion Percentage Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={completionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} name="Completed %" />
              <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pending %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
            <h3 className="text-[#1F2937]">Department Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.1)]">
                <tr>
                  <th className="px-6 py-3 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr
                    key={index}
                    className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-3 text-[#1F2937]" style={{ fontWeight: 600 }}>
                      {dept.department}
                    </td>
                    <td className="px-6 py-3 text-[#6B7280]">{dept.students}</td>
                    <td className="px-6 py-3 text-[#6B7280]">{dept.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <h3 className="mb-4 text-[#1F2937]">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 bg-[#F8FAFC] rounded-lg"
              >
                <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-[#1F2937]" style={{ fontWeight: 600 }}>
                    {activity.action}
                  </p>
                  <p className="text-sm text-[#6B7280]">by {activity.user}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
