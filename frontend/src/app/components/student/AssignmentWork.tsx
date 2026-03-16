import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Save, Send, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const AssignmentWork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissionText, setSubmissionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Mock assignment data
  const assignment = {
    id: id,
    title: "Data Structures Project",
    course: "CS201",
    description:
      "Implement a binary search tree with insert, delete, and search operations. Include proper documentation and test cases. Submit your code along with a report explaining your approach and time complexity analysis.",
    dueDate: "2026-03-18",
    status: "pending",
  };

  const getDaysUntilDue = () => {
    const today = new Date("2026-03-15");
    const due = new Date(assignment.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDue();

  const handleSaveDraft = async () => {
    if (!submissionText.trim()) {
      toast.error("Please enter some content before saving");
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Draft saved successfully!");
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error("Please enter your submission");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowConfirmation(false);
    toast.success("Assignment submitted successfully!");
    navigate("/student/assignments");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/student/assignments")}
        className="flex items-center gap-2 text-[#2563EB] hover:text-[#1D4ED8] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] p-6 mb-6">
        <h1 className="mb-2 text-[#1F2937]">{assignment.title}</h1>
        <p className="text-[#6B7280] mb-4">{assignment.course}</p>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6B7280]" />
            <span className="text-[#6B7280]">Due: {assignment.dueDate}</span>
          </div>
          {daysLeft > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              daysLeft <= 2 ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#FFFBEB] text-[#F59E0B]"
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#F8FAFC] p-4 rounded-lg">
          <h3 className="mb-2 text-[#1F2937]">Description</h3>
          <p className="text-[#6B7280] leading-relaxed">{assignment.description}</p>
        </div>
      </div>

      {/* Submission Editor */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#1F2937]">Your Submission</h2>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
            <span>Autosave enabled</span>
          </div>
        </div>

        <textarea
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          placeholder="Write your submission here..."
          className="w-full h-96 px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors resize-none"
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6B7280]">{submissionText.length} characters</p>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => setShowConfirmation(true)}
              className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="mb-2 text-[#1F2937]">Confirm Submission</h3>
            <p className="text-[#6B7280] mb-6">
              Are you sure you want to submit this assignment? You won't be able to edit it after submission.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
