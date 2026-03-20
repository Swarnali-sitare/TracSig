import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Send, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Course {
  id: string;
  code: string;
  name: string;
}

export const GiveAssignment = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get("/staff/courses")
      .then((res) => setCourses(res.data.data))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.course_id || !formData.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const dueDate = new Date(formData.due_date);
    if (dueDate <= new Date()) {
      toast.error("Due date must be in the future");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/staff/assignments", {
        title: formData.title,
        description: formData.description,
        course_id: formData.course_id,
        due_date: new Date(formData.due_date).toISOString(),
      });
      toast.success("Assignment created successfully!");
      navigate("/staff/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create assignment";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.course_id && formData.due_date;
  const selectedCourse = courses.find((c) => c.id === formData.course_id);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-foreground">Create New Assignment</h1>

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
              <label htmlFor="course_id" className="block mb-2 text-foreground">
                Course <span className="text-error">*</span>
              </label>
              <select
                id="course_id"
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.name}
                  </option>
                ))}
              </select>
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
              <label htmlFor="due_date" className="block mb-2 text-foreground">
                Due Date <span className="text-error">*</span>
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/staff/dashboard")}
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
                <span className="text-foreground">{formData.due_date || "Not set"}</span>
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
