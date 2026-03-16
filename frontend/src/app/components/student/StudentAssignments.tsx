import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter } from "lucide-react";

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const assignments = [
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
    {
      id: 4,
      title: "Algorithm Analysis",
      course: "CS201",
      dueDate: "2026-03-10",
      status: "submitted",
    },
    {
      id: 5,
      title: "UI/UX Design",
      course: "CS301",
      dueDate: "2026-03-12",
      status: "submitted",
    },
    {
      id: 6,
      title: "Machine Learning Report",
      course: "CS401",
      dueDate: "2026-03-08",
      status: "overdue",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]";
      case "saved":
        return "bg-[#EEF2FF] text-[#2563EB] border-[#BFDBFE]";
      case "submitted":
        return "bg-[#F0FDF4] text-[#22C55E] border-[#BBF7D0]";
      case "overdue":
        return "bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date("2026-03-15");
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredAssignments = assignments
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .filter((a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.course.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-[#1F2937]">My Assignments</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="saved">Saved</option>
              <option value="submitted">Submitted</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
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
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => {
                const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                return (
                  <tr
                    key={assignment.id}
                    className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4 text-[#1F2937]" style={{ fontWeight: 600 }}>
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{assignment.course}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[#1F2937]">{assignment.dueDate}</p>
                        {daysUntilDue > 0 && assignment.status !== "submitted" && (
                          <p className="text-xs text-[#6B7280] mt-1">
                            {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} left
                          </p>
                        )}
                        {daysUntilDue <= 0 && assignment.status !== "submitted" && (
                          <p className="text-xs text-[#EF4444] mt-1">Overdue</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm capitalize border ${getStatusColor(assignment.status)}`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                        className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
                      >
                        {assignment.status === "submitted" ? "View" : "Work"}
                      </button>
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
