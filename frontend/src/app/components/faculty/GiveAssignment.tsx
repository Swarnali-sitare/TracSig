import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { createStaffAssignment, fetchStaffCourses } from "../../services/tracsigApi";
import { bytesFromAmount, formatBytes } from "../../utils/formatBytes";
import { HoverSelect } from "../ui/hover-select";

export const GiveAssignment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    dueDate: "",
    attachmentsEnabled: false,
    minSize: 1,
    minUnit: "KB" as "KB" | "MB",
    maxSize: 10,
    maxUnit: "MB" as "KB" | "MB",
  });
  const [courses, setCourses] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchStaffCourses();
        if (!cancelled) setCourses(res.items);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError) toast.error(e.message);
          else toast.error("Could not load courses");
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const courseOptions = useMemo(
    () => [
      { value: "", label: "Select a course" },
      ...courses.map((c) => ({
        value: String(c.id),
        label: `${c.code} — ${c.name}`,
      })),
    ],
    [courses],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.course || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      toast.error("Due date must be today or in the future");
      return;
    }

    const minBytes = bytesFromAmount(formData.minSize, formData.minUnit);
    const maxBytes = bytesFromAmount(formData.maxSize, formData.maxUnit);
    const cap50 = 50 * 1024 * 1024;
    if (formData.attachmentsEnabled) {
      if (minBytes < 1024) {
        toast.error("Minimum file size must be at least 1 KB");
        return;
      }
      if (maxBytes > cap50) {
        toast.error("Maximum file size cannot exceed 50 MB");
        return;
      }
      if (minBytes > maxBytes) {
        toast.error("Minimum size cannot be greater than maximum size");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createStaffAssignment({
        title: formData.title.trim(),
        description: formData.description.trim(),
        course_id: Number(formData.course),
        due_date: formData.dueDate,
        attachments_enabled: formData.attachmentsEnabled,
        min_upload_bytes: formData.attachmentsEnabled ? minBytes : null,
        max_upload_bytes: formData.attachmentsEnabled ? maxBytes : null,
      });
      toast.success("Assignment created successfully!");
      navigate("/faculty/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) toast.error(err.message);
      else toast.error("Could not create assignment");
    }
    setIsSubmitting(false);
  };

  const isFormValid = formData.title && formData.description && formData.course && formData.dueDate;
  const selectedCourse = courses.find((c) => String(c.id) === formData.course);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-foreground">Create New Assignment</h1>

      {loadingCourses ? (
        <p className="text-muted-foreground">Loading courses…</p>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground">You have no courses assigned. Contact an administrator.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block mb-2 text-foreground">
                  Assignment Title <span className="text-error">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter assignment title"
                />
              </div>

              <div>
                <label htmlFor="course" className="block mb-2 text-foreground">
                  Course <span className="text-error">*</span>
                </label>
                <HoverSelect
                  id="course"
                  value={formData.course}
                  onChange={(v) => setFormData((f) => ({ ...f, course: v }))}
                  options={courseOptions}
                  placeholder="Select a course"
                />
              </div>

              <div>
                <label htmlFor="description" className="block mb-2 text-foreground">
                  Description <span className="text-error">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Enter assignment description, requirements, and instructions..."
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block mb-2 text-foreground">
                  Due Date <span className="text-error">*</span>
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="rounded-lg border border-border p-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attachmentsEnabled}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, attachmentsEnabled: e.target.checked }))
                    }
                    className="mt-1 rounded border-border"
                  />
                  <span>
                    <span className="text-foreground font-medium">Allow file uploads</span>
                    <span className="block text-sm text-muted-foreground mt-1">
                      Students can attach images, PDFs, documents, or videos (when enabled). Set per-file size limits
                      between 1 KB and 50 MB.
                    </span>
                  </span>
                </label>
                {formData.attachmentsEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-8">
                    <div>
                      <span className="block text-sm text-foreground mb-2">Minimum file size</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={formData.minSize}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, minSize: Math.max(1, Number(e.target.value) || 1) }))
                          }
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
                        />
                        <select
                          value={formData.minUnit}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, minUnit: e.target.value as "KB" | "MB" }))
                          }
                          className="px-3 py-2 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
                        >
                          <option value="KB">KB</option>
                          <option value="MB">MB</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <span className="block text-sm text-foreground mb-2">Maximum file size</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={formData.maxSize}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, maxSize: Math.max(1, Number(e.target.value) || 1) }))
                          }
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
                        />
                        <select
                          value={formData.maxUnit}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, maxUnit: e.target.value as "KB" | "MB" }))
                          }
                          className="px-3 py-2 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none"
                        >
                          <option value="KB">KB</option>
                          <option value="MB">MB</option>
                        </select>
                      </div>
                    </div>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Allowed range for this assignment:{" "}
                      <strong className="text-foreground">
                        {formatBytes(bytesFromAmount(formData.minSize, formData.minUnit))} –{" "}
                        {formatBytes(bytesFromAmount(formData.maxSize, formData.maxUnit))}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/faculty/dashboard")}
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!isFormValid}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </button>
            </div>
          </div>
        </form>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Assignment Preview</h2>
            </div>
            <div className="p-6">
              <h3 className="text-2xl mb-2 text-foreground" style={{ fontWeight: 600 }}>
                {formData.title || "Untitled Assignment"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedCourse ? `${selectedCourse.code} — ${selectedCourse.name}` : "No course selected"}
              </p>
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Due Date: </span>
                <span className="text-foreground">{formData.dueDate || "Not set"}</span>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="mb-2 text-foreground">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {formData.description || "No description provided"}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
