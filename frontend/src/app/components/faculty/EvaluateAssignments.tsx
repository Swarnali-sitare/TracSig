import { useCallback, useEffect, useState } from "react";
import { Search, Eye, Edit, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { evaluateSubmission, fetchStaffSubmissions } from "../../services/tracsigApi";
import { parseLocalYmd, startOfDay } from "../../utils/assignmentStatus";

type SubmissionRow = {
  id: number;
  student_name: string;
  assignment_title: string;
  course_code: string;
  submitted_on: string | null;
  due_date: string | null;
  evaluation_status: string;
  marks: number | null;
  content: string;
};

function canEvaluateAfterDue(dueYmd: string | null): boolean {
  if (!dueYmd) return false;
  const due = startOfDay(parseLocalYmd(dueYmd.slice(0, 10)));
  const today = startOfDay(new Date());
  return today >= due;
}

export const EvaluateAssignments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStaffSubmissions();
      setSubmissions((res.items as SubmissionRow[]) ?? []);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not load submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignment_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEvaluate = async (submissionId: number) => {
    if (!marks || isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) {
      toast.error("Please enter valid marks (0-100)");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    try {
      await evaluateSubmission(submissionId, {
        marks: Number(marks),
        feedback: feedback.trim(),
      });
      toast.success("Assignment evaluated successfully!");
      setSelectedSubmission(null);
      setMarks("");
      setFeedback("");
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Evaluation failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading submissions…</p>
      </div>
    );
  }

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
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Student Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Assignment
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Submitted On
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Marks
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No submissions to evaluate.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => {
                  const canEval = canEvaluateAfterDue(submission.due_date);
                  const statusLabel =
                    submission.evaluation_status === "evaluated" ? "evaluated" : "pending";
                  return (
                    <tr
                      key={submission.id}
                      className="border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                        {submission.student_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{submission.assignment_title}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full text-sm">
                          {submission.course_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{submission.submitted_on ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusLabel === "evaluated"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {submission.marks !== null && submission.marks !== undefined
                          ? `${submission.marks}/100`
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedSubmission(submission.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="View submission"
                          >
                            <Eye className="w-4 h-4 text-accent-primary" />
                          </button>
                          {canEval ? (
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission.id);
                                if (submission.marks !== null && submission.marks !== undefined) {
                                  setMarks(String(submission.marks));
                                } else {
                                  setMarks("");
                                }
                                setFeedback("");
                              }}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title={statusLabel === "evaluated" ? "Edit evaluation" : "Evaluate"}
                            >
                              {statusLabel === "evaluated" ? (
                                <Edit className="w-4 h-4 text-warning" />
                              ) : (
                                <Check className="w-4 h-4 text-success" />
                              )}
                            </button>
                          ) : (
                            <div
                              className="p-2 text-muted-foreground"
                              title="Cannot evaluate before due date"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Evaluate Submission</h2>
            </div>

            {(() => {
              const submission = submissions.find((s) => s.id === selectedSubmission);
              if (!submission) return null;

              const canEval = canEvaluateAfterDue(submission.due_date);

              return (
                <>
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="mb-2 text-foreground">{submission.assignment_title}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>Student: {submission.student_name}</span>
                        <span>Course: {submission.course_code}</span>
                        <span>Submitted: {submission.submitted_on ?? "—"}</span>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <h4 className="mb-2 text-foreground">Submission Content</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{submission.content}</p>
                    </div>

                    {canEval ? (
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
                    ) : (
                      <div className="bg-warning/10 border border-warning/40 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-warning" style={{ fontWeight: 600 }}>
                            Evaluation Not Available
                          </p>
                          <p className="mt-1 text-sm text-warning">
                            You can only evaluate assignments on or after the due date.
                          </p>
                        </div>
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
                    {canEval && (
                      <button
                        onClick={() => handleEvaluate(submission.id)}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                      >
                        Submit Evaluation
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
