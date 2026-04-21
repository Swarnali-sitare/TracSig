import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, UserPlus, Edit, Trash2 } from "lucide-react";
import { PasswordInputWithToggle } from "../common/PasswordInputWithToggle";
import { HoverSelect } from "../ui/hover-select";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  createAdminStudent,
  deleteAdminStudent,
  fetchAdminBatches,
  fetchAdminStudents,
} from "../../services/tracsigApi";

type StudentRow = {
  id: number;
  name: string;
  email: string;
  batch: string;
  progress_percent: number;
};

export const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [batches, setBatches] = useState<{ id: number; name: string; year_label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const batchFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Batches" },
      ...batches.map((b) => ({
        value: b.year_label,
        label: `${b.name} (${b.year_label})`,
      })),
    ],
    [batches],
  );

  const addStudentBatchOptions = useMemo(
    () => [
      { value: "", label: "Select batch" },
      ...batches.map((b) => ({
        value: String(b.id),
        label: `${b.name} (${b.year_label})`,
      })),
    ],
    [batches],
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    batch_id: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stRes, bRes] = await Promise.all([
        fetchAdminStudents({
          batch: batchFilter === "all" ? undefined : batchFilter,
          search: searchTerm.trim() || undefined,
        }),
        fetchAdminBatches(),
      ]);
      setStudents((stRes.items as StudentRow[]) ?? []);
      setBatches(bRes.items ?? []);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load students");
    } finally {
      setLoading(false);
    }
  }, [batchFilter, searchTerm]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(t);
  }, [batchFilter, searchTerm, load]);

  const handleDeleteStudent = async (id: number) => {
    try {
      await deleteAdminStudent(id);
      toast.success("Student removed successfully");
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Delete failed");
    }
  };

  const handleAddStudent = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.batch_id) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      await createAdminStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        batch_id: Number(form.batch_id),
      });
      toast.success("Student added successfully");
      setShowAddStudent(false);
      setForm({ name: "", email: "", password: "", batch_id: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not create student");
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading students…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Student Management</h1>
        <button
          onClick={() => setShowAddStudent(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border px-3 py-2.5 shadow-sm mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <HoverSelect
              value={batchFilter}
              onChange={setBatchFilter}
              options={batchFilterOptions}
              placeholder="All Batches"
              triggerClassName="pl-9 h-9 min-h-9 py-2 px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No students match your filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full text-sm">
                        {student.batch}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[100px] flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-success"
                            style={{ width: `${student.progress_percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{student.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded-lg transition-colors opacity-50 cursor-not-allowed"
                          disabled
                          title="Edit not available via API"
                        >
                          <Edit className="w-4 h-4 text-accent-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Student</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <PasswordInputWithToggle
                id="admin-student-password"
                label="Password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
              />
              <div>
                <label className="block mb-2 text-foreground">Batch</label>
                <HoverSelect
                  value={form.batch_id}
                  onChange={(v) => setForm((f) => ({ ...f, batch_id: v }))}
                  options={addStudentBatchOptions}
                  placeholder="Select batch"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowAddStudent(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
