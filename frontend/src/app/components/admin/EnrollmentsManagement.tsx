import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  fetchAdminBatchSummaries,
  fetchAdminCourses,
  fetchAdminEnrollments,
  type AdminEnrollmentRow,
} from "../../services/tracsigApi";
import { HoverSelect } from "../ui/hover-select";

type CourseOption = { id: number; code: string; name: string };

export const EnrollmentsManagement = () => {
  const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [rows, setRows] = useState<AdminEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const batchSelectOptions = useMemo(
    () => [
      { value: "", label: "Select batch" },
      ...batches.map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [batches],
  );

  const courseSelectOptions = useMemo(
    () => [
      { value: "", label: "Select course" },
      ...courses.map((c) => ({
        value: String(c.id),
        label: `${c.code} — ${c.name}`,
      })),
    ],
    [courses],
  );

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([fetchAdminBatchSummaries(), fetchAdminCourses()]);
      setBatches((bRes.items ?? []).map((b) => ({ id: b.id, name: b.name })));
      const cItems = (cRes.items as CourseOption[]) ?? [];
      setCourses(cItems.map((c) => ({ id: c.id, code: c.code, name: c.name })));
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load batches or courses");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetchAdminEnrollments();
      setRows(res.items ?? []);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load enrollments");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  const handleAssign = async () => {
    if (!batchId || !courseId) {
      toast.error("Select both a batch and a course");
      return;
    }
    setSubmitting(true);
    try {
      await createAdminEnrollment({
        batch_id: Number(batchId),
        course_id: Number(courseId),
      });
      toast.success("Course assigned to batch");
      setBatchId("");
      setCourseId("");
      await loadEnrollments();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEnrollment = async (id: number, batchName: string, courseName: string) => {
    if (
      !window.confirm(
        `Remove "${courseName}" from batch "${batchName}"? Students in that batch will no longer see this course's assignments.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteAdminEnrollment(id);
      toast.success("Enrollment removed");
      await loadEnrollments();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not remove enrollment");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && batches.length === 0 && courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-accent-primary">
          <Link2 className="h-5 w-5" />
        </div>
        <h1 className="text-foreground">Enrollments</h1>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-8">
        <h2 className="text-foreground mb-4" style={{ fontWeight: 600 }}>
          Assign course to batch
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          All students in the selected batch will have access to assignments for that course.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-foreground text-sm">Batch</label>
            <HoverSelect
              value={batchId}
              onChange={setBatchId}
              options={batchSelectOptions}
              placeholder="Select batch"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block mb-2 text-foreground text-sm">Course</label>
            <HoverSelect
              value={courseId}
              onChange={setCourseId}
              options={courseSelectOptions}
              placeholder="Select course"
              disabled={submitting}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={submitting || !batchId || !courseId}
          onClick={() => void handleAssign()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Assigning…" : "Assign"}
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-foreground" style={{ fontWeight: 600 }}>
            Current enrollments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch start
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch end
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading enrollments…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No enrollments yet. Assign a course to a batch above.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {r.batch_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{r.course_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{r.batch_start_date ?? "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{r.batch_end_date ?? "—"}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void handleRemoveEnrollment(r.id, r.batch_name, r.course_name)}
                        disabled={deletingId === r.id || submitting}
                        className="p-2 hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove enrollment"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
