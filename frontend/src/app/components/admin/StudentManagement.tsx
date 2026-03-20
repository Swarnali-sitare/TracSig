import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Student {
  id: string;
  name: string;
  email: string;
  batch_id: string | null;
  department: string | null;
}

interface Batch {
  id: string;
  name: string;
  year: number;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "", email: "", department: "", batch_id: "",
  });

  const fetchStudents = () => {
    api.get("/admin/students")
      .then((res) => setStudents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    api.get("/admin/batches")
      .then((res) => setBatches(res.data.data))
      .catch(console.error);
  }, []);

  const filteredStudents = students
    .filter((s) => batchFilter === "all" || s.batch_id === batchFilter)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student removed successfully");
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const { data } = await api.post("/admin/students", newStudent);
      setStudents((prev) => [...prev, data.data]);
      toast.success("Student added successfully");
      setShowAddStudent(false);
      setNewStudent({ name: "", email: "", department: "", batch_id: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add student";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading students...</div>
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
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Name</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Email</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Batch</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Department</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              ) : filteredStudents.map((student) => {
                const batchName = batches.find((b) => b.id === student.batch_id)?.name ?? "—";
                return (
                  <tr key={student.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>{student.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full text-sm">
                        {batchName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.department ?? "—"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Batch</label>
                <select
                  value={newStudent.batch_id}
                  onChange={(e) => setNewStudent({ ...newStudent, batch_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-foreground">Department</label>
                <select
                  value={newStudent.department}
                  onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
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
