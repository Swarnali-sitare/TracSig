import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  fetchAdminStaff,
  updateAdminCourse,
} from "../../services/tracsigApi";
import { HoverSelect } from "../ui/hover-select";

type CourseRow = {
  id: number;
  code: string;
  name: string;
  credits: number;
  enrolled_students: number;
  instructor_name: string;
  instructor_id: number;
};

type StaffOption = { id: number; name: string; email: string };

export const CourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  const instructorOptions = useMemo(
    () => [
      { value: "", label: "Select instructor" },
      ...staffList.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.email})`,
      })),
    ],
    [staffList],
  );
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: "4",
    staff_id: "",
  });

  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    credits: "4",
    staff_id: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([fetchAdminCourses(), fetchAdminStaff()]);
      setCourses((cRes.items as CourseRow[]) ?? []);
      const items = (sRes.items as { id: number; name: string; email: string }[]) ?? [];
      setStaffList(items.map((s) => ({ id: s.id, name: s.name, email: s.email })));
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCourse = async (id: number) => {
    try {
      await deleteAdminCourse(id);
      toast.success("Course deleted successfully");
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Delete failed");
    }
  };

  const openEditCourse = (course: CourseRow) => {
    setEditCourseId(course.id);
    setEditForm({
      code: course.code,
      name: course.name,
      credits: String(course.credits),
      staff_id: String(course.instructor_id),
    });
  };

  const handleUpdateCourse = async () => {
    if (editCourseId == null) return;
    if (!editForm.code.trim() || !editForm.name.trim() || !editForm.staff_id) {
      toast.error("Fill all required fields");
      return;
    }
    const cr = Number(editForm.credits);
    if (Number.isNaN(cr) || cr < 1 || cr > 6) {
      toast.error("Credits must be 1–6");
      return;
    }
    setEditSubmitting(true);
    try {
      await updateAdminCourse(editCourseId, {
        code: editForm.code.trim(),
        name: editForm.name.trim(),
        credits: cr,
        staff_id: Number(editForm.staff_id),
      });
      toast.success("Course updated successfully");
      setEditCourseId(null);
      setEditForm({ code: "", name: "", credits: "4", staff_id: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not update course");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddCourse = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.staff_id) {
      toast.error("Fill all required fields");
      return;
    }
    const cr = Number(form.credits);
    if (Number.isNaN(cr) || cr < 1 || cr > 6) {
      toast.error("Credits must be 1–6");
      return;
    }
    try {
      await createAdminCourse({
        code: form.code.trim(),
        name: form.name.trim(),
        credits: cr,
        staff_id: Number(form.staff_id),
      });
      toast.success("Course added successfully");
      setShowAddCourse(false);
      setForm({ code: "", name: "", credits: "4", staff_id: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not create course");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Course Management</h1>
        <button
          onClick={() => setShowAddCourse(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border px-3 py-2.5 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-md bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course Code
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Credits
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Enrolled Students
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Faculty (Instructor)
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {course.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{course.credits}</td>
                    <td className="px-6 py-4 text-muted-foreground">{course.enrolled_students}</td>
                    <td className="px-6 py-4 text-muted-foreground">{course.instructor_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCourse(course)}
                          disabled={editSubmitting}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Edit course"
                        >
                          <Edit className="w-4 h-4 text-accent-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete course"
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

      {editCourseId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Edit Course</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Course Code</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Course Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Credits (1–6)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={editForm.credits}
                  onChange={(e) => setEditForm((f) => ({ ...f, credits: e.target.value }))}
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Instructor</label>
                <HoverSelect
                  value={editForm.staff_id}
                  onChange={(v) => setEditForm((f) => ({ ...f, staff_id: v }))}
                  options={instructorOptions}
                  placeholder="Select instructor"
                  disabled={editSubmitting}
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                disabled={editSubmitting}
                onClick={() => setEditCourseId(null)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSubmitting}
                onClick={() => void handleUpdateCourse()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {editSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Course</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Course Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Course Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Credits (1–6)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.credits}
                  onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Instructor</label>
                <HoverSelect
                  value={form.staff_id}
                  onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))}
                  options={instructorOptions}
                  placeholder="Select instructor"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowAddCourse(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourse}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
