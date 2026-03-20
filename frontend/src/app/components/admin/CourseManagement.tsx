import { useState, useEffect } from "react";
import { Search, Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Course {
  id: string;
  code: string;
  name: string;
  department: string | null;
  credits: number;
  staff_name: string | null;
}

interface StaffOption {
  id: string;
  name: string;
}

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "", name: "", department: "", credits: "3", staff_id: "",
  });

  const fetchCourses = () => {
    api.get("/admin/courses")
      .then((res) => setCourses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
    api.get("/admin/staff")
      .then((res) => setStaffOptions(res.data.data))
      .catch(console.error);
  }, []);

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.department ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course deleted successfully");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.code || !newCourse.name) {
      toast.error("Course code and name are required");
      return;
    }
    try {
      const { data } = await api.post("/admin/courses", {
        ...newCourse,
        credits: Number(newCourse.credits),
        staff_id: newCourse.staff_id || null,
      });
      setCourses((prev) => [...prev, data.data]);
      toast.success("Course added successfully");
      setShowAddCourse(false);
      setNewCourse({ code: "", name: "", department: "", credits: "3", staff_id: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add course";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading courses...</div>
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
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Course Code</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Course Name</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Department</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Credits</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Instructor</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No courses found.
                  </td>
                </tr>
              ) : filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full">
                      {course.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>{course.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.department ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.credits}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.staff_name ?? "Unassigned"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-accent-primary" />
            <p className="text-muted-foreground">Total Courses</p>
          </div>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>{courses.length}</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Credits</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {courses.reduce((acc, c) => acc + c.credits, 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Departments</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {new Set(courses.map((c) => c.department).filter(Boolean)).size}
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
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Course Name</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Department</label>
                <select
                  value={newCourse.department}
                  onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-foreground">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newCourse.credits}
                  onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Instructor</label>
                <select
                  value={newCourse.staff_id}
                  onChange={(e) => setNewCourse({ ...newCourse, staff_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">No instructor assigned</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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
