import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  bulkUploadAdminStudents,
  createAdminBatchV2,
  createAdminManagedStudent,
  fetchAdminBatchDetail,
  fetchAdminBatchSummaries,
  type AdminBatchSummary,
} from "../../services/tracsigApi";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function downloadStudentCsvTemplate() {
  const header = "ID,Name,Email,Password\n";
  const blob = new Blob([header], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const StudentData = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<AdminBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", start_date: "", end_date: "" });

  const [viewBatchId, setViewBatchId] = useState<number | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewStudents, setViewStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [viewTitle, setViewTitle] = useState("");

  const [bulkBatchId, setBulkBatchId] = useState<number | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [addBatchId, setAddBatchId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ id: "", name: "", email: "", password: "" });
  const [addSubmitting, setAddSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminBatchSummaries();
      setBatches(res.items ?? []);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openView = async (batchId: number) => {
    setViewBatchId(batchId);
    setViewLoading(true);
    setViewStudents([]);
    try {
      const res = await fetchAdminBatchDetail(batchId);
      setViewTitle(res.batch.name);
      setViewStudents(res.students);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load batch");
      setViewBatchId(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    const name = createForm.name.trim();
    if (!name || !createForm.start_date || !createForm.end_date) {
      toast.error("Fill batch name and dates");
      return;
    }
    try {
      await createAdminBatchV2({
        name,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
      });
      toast.success("Batch created");
      setCreateOpen(false);
      setCreateForm({ name: "", start_date: "", end_date: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not create batch");
    }
  };

  const handleBulkUpload = async () => {
    if (bulkBatchId == null || !bulkFile) {
      toast.error("Choose a CSV file");
      return;
    }
    setBulkSubmitting(true);
    try {
      const { added, skipped } = await bulkUploadAdminStudents(bulkBatchId, bulkFile);
      toast.success(`Added ${added}, skipped ${skipped}`);
      setBulkBatchId(null);
      setBulkFile(null);
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Upload failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleAddStudent = async () => {
    if (addBatchId == null) return;
    const id = addForm.id.trim();
    const name = addForm.name.trim();
    const email = addForm.email.trim();
    const password = addForm.password;
    if (!id || !name || !email || !password) {
      toast.error("Fill all fields");
      return;
    }
    setAddSubmitting(true);
    try {
      await createAdminManagedStudent({
        id,
        name,
        email,
        password,
        batch_id: addBatchId,
      });
      toast.success("Student added");
      setAddBatchId(null);
      setAddForm({ id: "", name: "", email: "", password: "" });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error(e.message);
      } else {
        toast.error("Could not add student");
      }
    } finally {
      setAddSubmitting(false);
    }
  };

  if (loading && batches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Student Data</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create batch
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Batch Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Started On
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Ends On
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Strength
                </th>
                <th className="px-6 py-4 text-right text-foreground w-16" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No batches yet. Create a batch to get started.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {b.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDisplayDate(b.start_date)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDisplayDate(b.end_date)}</td>
                    <td className="px-6 py-4 text-foreground">{b.strength}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-hover-bg text-foreground inline-flex"
                            aria-label="Batch actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => void openView(b.id)}>View batch info</DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setBulkBatchId(b.id);
                              setBulkFile(null);
                            }}
                          >
                            Upload bulk student
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setAddBatchId(b.id);
                              setAddForm({ id: "", name: "", email: "", password: "" });
                            }}
                          >
                            Add student
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => navigate(`/admin/student-data/batch/${b.id}/remove`)}
                          >
                            Remove student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block mb-2 text-sm text-foreground">Batch name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
                placeholder="e.g. Spring 2026"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-foreground">Start date</label>
              <input
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-foreground">End date</label>
              <input
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleCreateBatch()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-accent-hover"
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewBatchId != null} onOpenChange={(o) => !o && setViewBatchId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch: {viewTitle}</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <p className="text-muted-foreground py-4">Loading students…</p>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Student ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {viewStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        No students in this batch.
                      </td>
                    </tr>
                  ) : (
                    viewStudents.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="px-4 py-2 font-mono">{s.id}</td>
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{s.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkBatchId != null} onOpenChange={(o) => !o && setBulkBatchId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload bulk students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              CSV columns: <span className="text-foreground font-medium">ID, Name, Email, Password</span>
            </p>
            <button
              type="button"
              onClick={downloadStudentCsvTemplate}
              className="text-sm text-primary hover:underline"
            >
              Download template
            </button>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-foreground"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setBulkBatchId(null)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkSubmitting}
              onClick={() => void handleBulkUpload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {bulkSubmitting ? "Uploading…" : "Upload"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addBatchId != null} onOpenChange={(o) => !o && setAddBatchId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block mb-2 text-sm text-foreground">Student ID</label>
              <input
                type="text"
                value={addForm.id}
                onChange={(e) => setAddForm((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-foreground">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-foreground">Email</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-foreground">Password</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAddBatchId(null)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={addSubmitting}
              onClick={() => void handleAddStudent()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {addSubmitting ? "Saving…" : "Add student"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
