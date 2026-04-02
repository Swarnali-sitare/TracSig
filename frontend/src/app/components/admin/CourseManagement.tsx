import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  fetchAdminStaff,
} from "../../services/tracsigApi";

type CourseRow = {
  id: number;
  code: string;
  name: string;
  department: string;
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
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    name: "",
    department: "",
    credits: "4",
    staff_id: "",
  });

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
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAddCourse = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.department.trim() || !form.staff_id) {
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
        department: form.department.trim(),
        credits: cr,
        staff_id: Number(form.staff_id),
      });
      toast.success("Course added successfully");
      setShowAddCourse(false);
      setForm({ code: "", name: "", department: "", credits: "4", staff_id: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not create course");
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + c.enrolled_students, 0);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

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

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
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
                  Course Code
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Department
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
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
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
                    <td className="px-6 py-4 text-muted-foreground">{course.department}</td>
                    <td className="px-6 py-4 text-muted-foreground">{course.credits}</td>
                    <td className="px-6 py-4 text-muted-foreground">{course.enrolled_students}</td>
                    <td className="px-6 py-4 text-muted-foreground">{course.instructor_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded-lg transition-colors opacity-50 cursor-not-allowed"
                          title="Edit not available via API"
                          disabled
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-accent-primary" />
            <p className="text-muted-foreground">Total Courses</p>
          </div>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {courses.length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Enrolled (sum)</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {totalStudents}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Avg. Students/Course</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {courses.length ? Math.round(totalStudents / courses.length) : 0}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Credits</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {totalCredits}
          </p>
        </div>
      </div>

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
                <label className="block mb-2 text-foreground">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Department"
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
                <select
                  value={form.staff_id}
                  onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select instructor</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
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
