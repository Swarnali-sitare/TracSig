import React, { useCallback, useEffect, useState } from "react";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  createAdminStaff,
  deleteAdminStaff,
  fetchAdminStaff,
  updateAdminStaff,
} from "../../services/tracsigApi";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { PasswordInputWithToggle } from "../common/PasswordInputWithToggle";

type StaffRow = {
  id: number;
  name: string;
  email: string;
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
    teachingLoad: "",
  });

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    teachingLoad: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleConfirmDeleteFaculty = async () => {
    if (deleteTarget == null) return;
    setDeleteSubmitting(true);
    try {
      await deleteAdminStaff(deleteTarget.id);
      toast.success("Faculty member removed successfully");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Delete failed");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openEdit = (member: StaffRow) => {
    setEditId(member.id);
    setEditForm({
      name: member.name,
      email: member.email,
      password: "",
      teachingLoad:
        member.teaching_load_hours != null
          ? String(member.teaching_load_hours)
          : "",
    });
  };

  const handleSaveEdit = async () => {
    if (editId == null) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    let teaching_load_hours: number | null;
    if (editForm.teachingLoad.trim() === "") {
      teaching_load_hours = null;
    } else {
      const n = Number(editForm.teachingLoad);
      if (!Number.isFinite(n) || n < 1 || n > 20) {
        toast.error("Teaching load must be between 1 and 20, or leave empty");
        return;
      }
      teaching_load_hours = n;
    }
    setEditSubmitting(true);
    try {
      const body: Parameters<typeof updateAdminStaff>[1] = {
        name,
        email,
        teaching_load_hours,
      };
      if (editForm.password.trim()) {
        body.password = editForm.password;
      }
      await updateAdminStaff(editId, body);
      toast.success("Faculty updated");
      setEditId(null);
      setEditForm({
        name: "",
        email: "",
        password: "",
        teachingLoad: "",
      });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not update faculty");
    } finally {
      setEditSubmitting(false);
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
        teaching_load_hours:
          form.teachingLoad.trim() !== ""
            ? Number(form.teachingLoad)
            : undefined,
      });
      toast.success("Faculty member added successfully");
      setShowAddFaculty(false);
      setForm({
        name: "",
        email: "",
        password: "",
        teachingLoad: "",
      });
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

      <div className="bg-card rounded-lg border border-border px-3 py-2.5 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search faculty..."
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
                <th
                  className="px-6 py-4 text-left text-foreground"
                  style={{ fontWeight: 600 }}
                >
                  Name
                </th>
                <th
                  className="px-6 py-4 text-left text-foreground"
                  style={{ fontWeight: 600 }}
                >
                  Email
                </th>
                <th
                  className="px-6 py-4 text-left text-foreground"
                  style={{ fontWeight: 600 }}
                >
                  Courses
                </th>
                <th
                  className="px-6 py-4 text-left text-foreground"
                  style={{ fontWeight: 600 }}
                >
                  Teaching Load
                </th>
                <th
                  className="px-6 py-4 text-left text-foreground"
                  style={{ fontWeight: 600 }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No faculty found.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td
                      className="px-6 py-4 text-foreground"
                      style={{ fontWeight: 600 }}
                    >
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {member.email}
                    </td>
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
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {member.teaching_load_hours != null
                        ? `${member.teaching_load_hours} hours/week`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(member)}
                          disabled={editSubmitting || deleteSubmitting}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Edit faculty member"
                        >
                          <Edit className="w-4 h-4 text-accent-primary" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              id: member.id,
                              name: member.name,
                              email: member.email,
                            })
                          }
                          disabled={deleteSubmitting}
                          className="p-2 hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
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

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o && !deleteSubmitting) setDeleteTarget(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => deleteSubmitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Remove faculty member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.name}
            </span>{" "}
            ({deleteTarget?.email}) and revoke their access. This cannot be
            undone.
          </p>
          <DialogFooter>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-hover-bg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => void handleConfirmDeleteFaculty()}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {deleteSubmitting ? "Removing…" : "Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Edit Faculty Member</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <PasswordInputWithToggle
                id="faculty-edit-password"
                label="New password (optional)"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, password: e.target.value }))
                }
                disabled={editSubmitting}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              <div>
                <label className="block mb-2 text-foreground">
                  Teaching load (hours/week, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editForm.teachingLoad}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, teachingLoad: e.target.value }))
                  }
                  disabled={editSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Clear to remove"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                disabled={editSubmitting}
                onClick={() => setEditId(null)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSubmitting}
                onClick={() => void handleSaveEdit()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {editSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <PasswordInputWithToggle
                id="faculty-add-password"
                label="Password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              <div>
                <label className="block mb-2 text-foreground">
                  Teaching Load (hours/week, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.teachingLoad}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teachingLoad: e.target.value }))
                  }
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
