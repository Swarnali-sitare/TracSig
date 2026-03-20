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
        return "bg-warning/10 text-warning border-warning/40";
      case "saved":
        return "bg-primary/10 text-accent-primary border-info/40";
      case "submitted":
        return "bg-success/10 text-success border-success/40";
      case "overdue":
        return "bg-error/10 text-error border-error/40";
      default:
        return "bg-muted text-muted-foreground border-border";
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
      <h1 className="mb-6 text-foreground">My Assignments</h1>

      {/* Filters */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
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
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Assignment Title
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
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
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{assignment.course}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-foreground">{assignment.dueDate}</p>
                        {daysUntilDue > 0 && assignment.status !== "submitted" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} left
                          </p>
                        )}
                        {daysUntilDue <= 0 && assignment.status !== "submitted" && (
                          <p className="text-xs text-error mt-1">Overdue</p>
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
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
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
