import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Filter } from "lucide-react";
import api from "@/lib/api";

interface Assignment {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  due_date: string;
  submission_status: string;
}

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api.get("/student/assignments")
      .then((res) => setAssignments(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-warning/10 text-warning border-warning/40";
      case "draft":
        return "bg-primary/10 text-accent-primary border-info/40";
      case "submitted":
        return "bg-success/10 text-success border-success/40";
      case "evaluated":
        return "bg-info/10 text-info border-info/40";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffTime = due.getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredAssignments = assignments
    .filter((a) => statusFilter === "all" || a.submission_status === statusFilter)
    .filter((a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">My Assignments</h1>

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
              <option value="not_started">Not Started</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="evaluated">Evaluated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Assignment Title</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Course</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Due Date</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Status</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No assignments found.
                  </td>
                </tr>
              ) : filteredAssignments.map((assignment) => {
                const daysUntilDue = getDaysUntilDue(assignment.due_date);
                const dueLabel = new Date(assignment.due_date).toLocaleDateString();
                return (
                  <tr key={assignment.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {assignment.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{assignment.course_code}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-foreground">{dueLabel}</p>
                        {daysUntilDue > 0 && assignment.submission_status !== "submitted" && assignment.submission_status !== "evaluated" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} left
                          </p>
                        )}
                        {daysUntilDue <= 0 && assignment.submission_status !== "submitted" && assignment.submission_status !== "evaluated" && (
                          <p className="text-xs text-error mt-1">Overdue</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize border ${getStatusColor(assignment.submission_status)}`}>
                        {assignment.submission_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                      >
                        {assignment.submission_status === "submitted" || assignment.submission_status === "evaluated" ? "View" : "Work"}
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
