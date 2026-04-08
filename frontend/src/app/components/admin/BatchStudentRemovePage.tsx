import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  deleteAdminManagedStudents,
  fetchAdminBatchDetail,
} from "../../services/tracsigApi";

export const BatchStudentRemovePage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const bid = useMemo(() => Number(batchId), [batchId]);
  const [loading, setLoading] = useState(true);
  const [batchName, setBatchName] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!Number.isFinite(bid)) {
      toast.error("Invalid batch");
      navigate("/admin/student-data", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdminBatchDetail(bid);
      setBatchName(res.batch.name);
      setStudents(res.students);
      setSelected(new Set());
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load batch");
      navigate("/admin/student-data", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [bid, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  const handleRemove = async () => {
    if (selected.size === 0) return;
    try {
      const { deleted } = await deleteAdminManagedStudents([...selected]);
      toast.success(`Removed ${deleted} student(s)`);
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Remove failed");
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-muted-foreground">Loading students…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => navigate("/admin/student-data")}
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Student Data
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-foreground">Remove students</h1>
          <p className="text-muted-foreground text-sm mt-1">{batchName}</p>
        </div>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => void handleRemove()}
          className="px-4 py-3 rounded-lg bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Remove selected
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selected.size === students.length}
                    onChange={toggleAll}
                    className="rounded border-border"
                    aria-label="Select all students"
                  />
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Student ID
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No students in this batch.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                        className="rounded border-border"
                        aria-label={`Select ${s.name}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono text-sm">{s.id}</td>
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.email}</td>
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
