import { useState } from "react";
import { useNavigate } from "react-router";
import { Save, Send, Eye } from "lucide-react";
import { toast } from "sonner";

export const GiveAssignment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    dueDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const courses = [
    { id: "cs101", name: "CS101 - Introduction to Programming" },
    { id: "cs201", name: "CS201 - Data Structures" },
    { id: "cs301", name: "CS301 - Web Development" },
    { id: "cs401", name: "CS401 - Machine Learning" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.course || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if due date is in the future
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    if (dueDate < today) {
      toast.error("Due date must be in the future");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    toast.success("Assignment created successfully!");
    navigate("/staff/dashboard");
  };

  const isFormValid = formData.title && formData.description && formData.course && formData.dueDate;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-[#1F2937]">Create New Assignment</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] p-6 mb-6">
          <div className="space-y-6">
            {/* Assignment Title */}
            <div>
              <label htmlFor="title" className="block mb-2 text-[#1F2937]">
                Assignment Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                placeholder="Enter assignment title"
              />
            </div>

            {/* Course Selection */}
            <div>
              <label htmlFor="course" className="block mb-2 text-[#1F2937]">
                Course <span className="text-[#EF4444]">*</span>
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block mb-2 text-[#1F2937]">
                Description <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors resize-none"
                placeholder="Enter assignment description, requirements, and instructions..."
              />
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block mb-2 text-[#1F2937]">
                Due Date <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/staff/dashboard")}
            className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!isFormValid}
              className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
              <h2 className="text-[#1F2937]">Assignment Preview</h2>
            </div>
            <div className="p-6">
              <h3 className="text-2xl mb-2 text-[#1F2937]" style={{ fontWeight: 600 }}>
                {formData.title || "Untitled Assignment"}
              </h3>
              <p className="text-[#6B7280] mb-4">
                {courses.find((c) => c.id === formData.course)?.name || "No course selected"}
              </p>
              <div className="mb-4">
                <span className="text-sm text-[#6B7280]">Due Date: </span>
                <span className="text-[#1F2937]">{formData.dueDate || "Not set"}</span>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-lg">
                <h4 className="mb-2 text-[#1F2937]">Description</h4>
                <p className="text-[#6B7280] whitespace-pre-wrap">
                  {formData.description || "No description provided"}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(0,0,0,0.1)] flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
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
