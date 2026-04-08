import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { fetchStaffCourses, fetchStaffStudentProgress } from "../../services/tracsigApi";
import { HoverSelect } from "../ui/hover-select";

type ProgressRow = {
  student_id: number;
  name: string;
  batch: string;
  course_code: string;
  assignments_submitted: number;
  total_assignments: number;
  completion_rate: number;
  last_activity: string;
  trend: string;
};

export const StudentProgress = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courses, setCourses] = useState<{ id: number; code: string; name: string }[]>([]);
  const [items, setItems] = useState<ProgressRow[]>([]);
  const [summary, setSummary] = useState({
    average_completion_rate: 0,
    students_above_80_percent: 0,
    students_total: 0,
    students_need_attention: 0,
  });
  const [loading, setLoading] = useState(true);

  const courseFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Courses" },
      ...courses.map((c) => ({ value: c.code, label: c.code })),
    ],
    [courses],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await fetchStaffCourses();
        if (!cancelled) setCourses(c.items);
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchStaffStudentProgress(courseFilter === "all" ? undefined : courseFilter);
        if (cancelled) return;
        setItems((res.items as ProgressRow[]) ?? []);
        setSummary(
          res.summary ?? {
            average_completion_rate: 0,
            students_above_80_percent: 0,
            students_total: 0,
            students_need_attention: 0,
          }
        );
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError) toast.error(e.message);
          else toast.error("Could not load progress");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseFilter]);

  const filteredStudents = items.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-success";
    if (rate >= 60) return "text-warning";
    return "text-error";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading progress…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Student Progress</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <HoverSelect
            value={courseFilter}
            onChange={setCourseFilter}
            options={courseFilterOptions}
            placeholder="All Courses"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Student Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Assignments Submitted
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Completion %
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Last Activity
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No progress data for this filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={`${student.student_id}-${student.course_code}`}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.batch}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full text-sm">
                        {student.course_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.assignments_submitted} / {student.total_assignments}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[100px] flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-success"
                            style={{ width: `${student.completion_rate}%` }}
                          ></div>
                        </div>
                        <span className={`${getCompletionColor(student.completion_rate)}`} style={{ fontWeight: 600 }}>
                          {student.completion_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.last_activity || "—"}</td>
                    <td className="px-6 py-4">
                      {student.trend === "up" ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-error" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Average Completion Rate</p>
          <p className="text-3xl text-success" style={{ fontWeight: 700 }}>
            {summary.average_completion_rate}%
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Students Above 80%</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {summary.students_above_80_percent} / {summary.students_total || "—"}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Students Need Attention</p>
          <p className="text-3xl text-error" style={{ fontWeight: 700 }}>
            {summary.students_need_attention}
          </p>
        </div>
      </div>
    </div>
  );
};
