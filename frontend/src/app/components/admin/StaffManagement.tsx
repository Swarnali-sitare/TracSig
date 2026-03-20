import { useState, useEffect } from "react";
import { Search, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

export const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", department: "" });

  const fetchStaff = () => {
    api.get("/admin/staff")
      .then((res) => setStaff(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/staff/${id}`);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      toast.success("Staff member removed successfully");
    } catch {
      toast.error("Failed to delete staff member");
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const { data } = await api.post("/admin/staff", newStaff);
      setStaff((prev) => [...prev, data.data]);
      toast.success("Staff member added successfully");
      setShowAddStaff(false);
      setNewStaff({ name: "", email: "", department: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add staff";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Staff Management</h1>
        <button
          onClick={() => setShowAddStaff(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff..."
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
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Name</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Email</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Department</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No staff members found.
                  </td>
                </tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>{member.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{member.department ?? "—"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete staff"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Staff Members</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>{staff.length}</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Departments</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {new Set(staff.map((s) => s.department).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Staff Member</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Department</label>
                <select
                  value={newStaff.department}
                  onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
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
                onClick={() => setShowAddStaff(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
