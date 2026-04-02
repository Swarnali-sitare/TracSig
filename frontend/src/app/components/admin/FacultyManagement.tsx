import { useCallback, useEffect, useState } from "react";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { createAdminStaff, deleteAdminStaff, fetchAdminStaff } from "../../services/tracsigApi";

type StaffRow = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  courses: string[];
  teaching_load_hours: number | null;
};

export const FacultyManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [facultyMembers, setFacultyMembers] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    teachingLoad: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminStaff();
      setFacultyMembers((res.items as StaffRow[]) ?? []);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load faculty");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredFaculty = facultyMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.department ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteFaculty = async (id: number) => {
    try {
      await deleteAdminStaff(id);
      toast.success("Faculty member removed successfully");
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Delete failed");
    }
  };

  const handleAddFaculty = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Fill name, email, and password");
      return;
    }
    try {
      await createAdminStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim() || null,
        teaching_load_hours:
          form.teachingLoad.trim() !== "" ? Number(form.teachingLoad) : undefined,
      });
      toast.success("Faculty member added successfully");
      setShowAddFaculty(false);
      setForm({ name: "", email: "", password: "", department: "", teachingLoad: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not create faculty");
    }
  };

  if (loading && facultyMembers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading faculty…</p>
      </div>
    );
  }

  const withLoad = facultyMembers.filter((s) => s.teaching_load_hours != null);
  const avgLoad =
    withLoad.length > 0
      ? (withLoad.reduce((acc, s) => acc + (s.teaching_load_hours ?? 0), 0) / withLoad.length).toFixed(1)
      : "0";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Faculty Management</h1>
        <button
          type="button"
          onClick={() => setShowAddFaculty(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Faculty
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search faculty..."
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
                  Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Department
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Teaching Load
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No faculty found.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{member.department ?? "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {member.courses?.length ? (
                          member.courses.map((course) => (
                            <span
                              key={course}
                              className="px-2 py-1 bg-primary/10 text-accent-primary rounded text-xs"
                            >
                              {course}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {member.teaching_load_hours != null ? `${member.teaching_load_hours} hours/week` : "—"}
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
                          type="button"
                          onClick={() => handleDeleteFaculty(member.id)}
                          className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete faculty member"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Faculty Members</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {facultyMembers.length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Average Teaching Load</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {avgLoad} hrs
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Departments</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {new Set(facultyMembers.map((s) => s.department ?? "")).size}
          </p>
        </div>
      </div>

      {showAddFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Faculty Member</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter name"
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
              <div>
                <label className="block mb-2 text-foreground">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Department (optional)</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Department"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Teaching Load (hours/week, optional)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.teachingLoad}
                  onChange={(e) => setForm((f) => ({ ...f, teachingLoad: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="1–20"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddFaculty(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFaculty}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
