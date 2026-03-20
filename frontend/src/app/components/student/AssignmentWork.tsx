import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Save, Send, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface AssignmentDetail {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  description: string;
  due_date: string;
  submission: {
    id: string;
    content: string;
    status: string;
    marks: number | null;
    feedback: string | null;
  } | null;
}

export const AssignmentWork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/student/assignments/${id}`)
      .then((res) => {
        const data = res.data.data as AssignmentDetail;
        setAssignment(data);
        if (data.submission?.content) {
          setSubmissionText(data.submission.content);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const getDaysUntilDue = () => {
    if (!assignment) return 0;
    const due = new Date(assignment.due_date);
    const diffTime = due.getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilDue();
  const isReadonly = assignment?.submission?.status === "submitted" || assignment?.submission?.status === "evaluated";

  const handleSaveDraft = async () => {
    if (!submissionText.trim()) {
      toast.error("Please enter some content before saving");
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/student/assignments/${id}/draft`, { content: submissionText });
      toast.success("Draft saved successfully!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save draft";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error("Please enter your submission");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/student/assignments/${id}/submit`, { content: submissionText });
      toast.success("Assignment submitted successfully!");
      setShowConfirmation(false);
      navigate("/student/assignments");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to submit";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Assignment not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/student/assignments")}
        className="flex items-center gap-2 text-accent-primary hover:text-accent-hover mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <h1 className="mb-2 text-foreground">{assignment.title}</h1>
        <p className="text-muted-foreground mb-4">{assignment.course_code} — {assignment.course_name}</p>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </span>
          </div>
          {daysLeft > 0 && !isReadonly && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              daysLeft <= 2 ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{daysLeft} {daysLeft === 1 ? "day" : "days"} left</span>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="mb-2 text-foreground">Description</h3>
          <p className="text-muted-foreground leading-relaxed">{assignment.description}</p>
        </div>
      </div>

      {assignment.submission?.status === "evaluated" && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-6 mb-6">
          <h3 className="text-success mb-2">Evaluated</h3>
          <p className="text-foreground">
            <span style={{ fontWeight: 600 }}>Marks:</span> {assignment.submission.marks ?? "—"}/100
          </p>
          {assignment.submission.feedback && (
            <p className="text-muted-foreground mt-2">
              <span style={{ fontWeight: 600 }}>Feedback:</span> {assignment.submission.feedback}
            </p>
          )}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground">Your Submission</h2>
          {!isReadonly && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span>Autosave enabled</span>
            </div>
          )}
        </div>

        <textarea
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          disabled={isReadonly}
          placeholder={isReadonly ? "Submission locked." : "Write your submission here..."}
          className="w-full h-96 px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {!isReadonly && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">{submissionText.length} characters</p>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Assignment
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="mb-2 text-foreground">Confirm Submission</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to submit this assignment? You won't be able to edit it after submission.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
