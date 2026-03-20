import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMockStudentAssignments } from "../../data/studentAssignmentsMock";
import { hasNonEmptyAssignmentDraft } from "../../utils/assignmentDraftStorage";
import {
  daysFromToday,
  getDisplayStatusBadgeClass,
  getStudentAssignmentDisplayStatus,
  isDueDatePassed,
} from "../../utils/assignmentStatus";

export const StudentAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const list = useMemo<"active" | "closed">(() => {
    if (location.pathname.endsWith("/closed")) return "closed";
    return "active";
  }, [location.pathname]);

  const assignments = useMemo(() => getMockStudentAssignments(), []);

  const [searchTerm, setSearchTerm] = useState("");
  const filteredAssignments = assignments
    .filter((a) =>
      list === "active" ? !isDueDatePassed(a.dueDate) : isDueDatePassed(a.dueDate)
    )
    .filter(
      (a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.course.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const heading = list === "active" ? "Active assignments" : "Closed assignments";
  const subheading =
    list === "active"
      ? "Due date has not passed yet — Pending or Completed work."
      : "Due date has passed — Incomplete or Completed work.";

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-1 text-foreground">{heading}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{subheading}</p>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

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
                const displayStatus = getStudentAssignmentDisplayStatus(assignment);
                const deltaDays = daysFromToday(assignment.dueDate);
                const isCompleted = assignment.status === "completed";
                const hasDraft =
                  Boolean(user) &&
                  !isCompleted &&
                  hasNonEmptyAssignmentDraft(user.id, assignment.id);

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
                        {list === "active" && !isCompleted && deltaDays > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {deltaDays} {deltaDays === 1 ? "day" : "days"} left
                          </p>
                        )}
                        {list === "active" && !isCompleted && deltaDays === 0 && (
                          <p className="text-xs text-warning mt-1">Due today</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm border ${getDisplayStatusBadgeClass(displayStatus)}`}
                        >
                          {displayStatus}
                        </span>
                        {hasDraft && displayStatus === "Pending" && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-md border border-primary/40 bg-primary/10 text-foreground"
                            title="Unsubmitted work saved on this device"
                          >
                            Draft
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/student/assignments/${assignment.id}`, {
                            state: { fromList: list },
                          })
                        }
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                      >
                        {isCompleted ? "View" : "Work"}
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
