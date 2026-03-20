import { useState, useEffect } from "react";
import { Search, Eye, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Submission {
  id: string;
  student_name: string;
  assignment_title: string;
  submitted_at: string | null;
  status: string;
  marks: number | null;
  feedback: string | null;
  content: string | null;
}

export const EvaluateAssignments = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  const fetchSubmissions = () => {
    api.get("/staff/submissions")
      .then((res) => setSubmissions(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignment_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEvaluate = async (submissionId: string) => {
    const marksNum = Number(marks);
    if (!marks || isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error("Please enter valid marks (0-100)");
      return;
    }
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    setEvaluating(true);
    try {
      await api.post(`/staff/submissions/${submissionId}/evaluate`, {
        marks: marksNum,
        feedback: feedback.trim(),
      });
      toast.success("Assignment evaluated successfully!");
      setSelectedSubmission(null);
      setMarks("");
      setFeedback("");
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Evaluation failed";
      toast.error(msg);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading submissions...</div>
      </div>
    );
  }

  const activeSubmission = submissions.find((s) => s.id === selectedSubmission);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Evaluate Assignments</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search submissions..."
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
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Student</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Assignment</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Submitted On</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Status</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Marks</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No submissions yet.
                  </td>
                </tr>
              ) : filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                    {submission.student_name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{submission.assignment_title}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                      submission.status === "evaluated"
                        ? "bg-success/10 text-success"
                        : submission.status === "submitted"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {submission.marks != null ? `${submission.marks}/100` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission.id);
                          setMarks(submission.marks != null ? String(submission.marks) : "");
                          setFeedback(submission.feedback ?? "");
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={submission.status === "submitted" ? "Evaluate" : "View"}
                      >
                        {submission.status === "submitted" ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Eye className="w-4 h-4 text-accent-primary" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission !== null && activeSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Evaluate Submission</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="mb-2 text-foreground">{activeSubmission.assignment_title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Student: {activeSubmission.student_name}</span>
                  {activeSubmission.submitted_at && (
                    <span>Submitted: {new Date(activeSubmission.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <h4 className="mb-2 text-foreground">Submission Content</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {activeSubmission.content || "No content provided"}
                </p>
              </div>

              {activeSubmission.status === "evaluated" && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
                  <p className="text-success" style={{ fontWeight: 600 }}>Already Evaluated</p>
                  <p className="text-foreground mt-1">Marks: {activeSubmission.marks}/100</p>
                  {activeSubmission.feedback && (
                    <p className="text-muted-foreground mt-1">Feedback: {activeSubmission.feedback}</p>
                  )}
                </div>
              )}

              {activeSubmission.status === "submitted" && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-foreground">
                      Marks (out of 100) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                      placeholder="Enter marks"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-foreground">
                      Feedback <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Provide detailed feedback..."
                    />
                  </div>
                </div>
              )}

              {activeSubmission.status === "draft" && (
                <div className="bg-warning/10 border border-warning/40 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-warning text-sm">This submission is still a draft and has not been submitted yet.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setMarks("");
                  setFeedback("");
                }}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              {activeSubmission.status === "submitted" && (
                <button
                  onClick={() => handleEvaluate(activeSubmission.id)}
                  disabled={evaluating}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {evaluating ? "Submitting..." : "Submit Evaluation"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
