import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Edit, Check, AlertCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import {
  evaluateSubmission,
  fetchStaffSubmissionDetail,
  fetchStaffSubmissions,
  type StaffSubmissionDetail,
} from "../../services/tracsigApi";
import { AttachmentInlinePreview } from "../submission/AttachmentInlinePreview";
import { parseLocalYmd, startOfDay } from "../../utils/assignmentStatus";

type SubmissionRow = {
  id: number;
  assignment_id?: number | null;
  student_name: string;
  assignment_title: string;
  course_code: string;
  submitted_on: string | null;
  due_date: string | null;
  evaluation_status: string;
  marks: number | null;
  content: string;
  attachment_count?: number;
};

type AssignmentGroup = {
  assignmentId: number;
  assignmentTitle: string;
  courseCode: string;
  dueDate: string | null;
  rows: SubmissionRow[];
};

function canEvaluateAfterDue(dueYmd: string | null): boolean {
  if (!dueYmd) return false;
  const due = startOfDay(parseLocalYmd(dueYmd.slice(0, 10)));
  const today = startOfDay(new Date());
  return today >= due;
}

function groupSubmissionsByAssignment(rows: SubmissionRow[]): AssignmentGroup[] {
  const map = new Map<string, AssignmentGroup>();
  for (const s of rows) {
    const key =
      s.assignment_id != null && s.assignment_id !== undefined
        ? `id:${s.assignment_id}`
        : `title:${s.assignment_title}\0${s.course_code}`;
    let g = map.get(key);
    if (!g) {
      g = {
        assignmentId: s.assignment_id ?? 0,
        assignmentTitle: s.assignment_title,
        courseCode: s.course_code,
        dueDate: s.due_date,
        rows: [],
      };
      map.set(key, g);
    }
    g.rows.push(s);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.assignmentTitle.localeCompare(b.assignmentTitle, undefined, { sensitivity: "base" })
  );
}

export const EvaluateAssignments = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionDetail, setSubmissionDetail] = useState<StaffSubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  /** Collapsed when explicitly false; default open for each assignment. */
  const [panelOpen, setPanelOpen] = useState<Record<string, boolean>>({});

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

  const assignmentGroups = useMemo(() => groupSubmissionsByAssignment(submissions), [submissions]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedSubmission === null) {
      setSubmissionDetail(null);
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setSubmissionDetail(null);
    void fetchStaffSubmissionDetail(selectedSubmission)
      .then((d) => {
        if (cancelled) return;
        setSubmissionDetail(d);
        if (d.marks != null) setMarks(String(d.marks));
        else setMarks("");
        setFeedback((d.feedback && String(d.feedback).trim()) || "");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiRequestError) toast.error(e.message);
        else toast.error("Could not load submission");
        setSubmissionDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubmission]);

  const panelKey = (g: AssignmentGroup) =>
    g.assignmentId > 0 ? `id:${g.assignmentId}` : `t:${g.assignmentTitle}:${g.courseCode}`;

  const isPanelOpen = (g: AssignmentGroup) => panelOpen[panelKey(g)] !== false;

  const togglePanel = (g: AssignmentGroup) => {
    const k = panelKey(g);
    setPanelOpen((prev) => ({
      ...prev,
      [k]: prev[k] === false ? true : false,
    }));
  };

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
      setSubmissionDetail(null);
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

      {assignmentGroups.length === 0 ? (
        <div className="bg-card rounded-lg border border-border px-6 py-10 text-center text-muted-foreground shadow-sm">
          No submissions to evaluate.
        </div>
      ) : (
        <div className="space-y-4">
          {assignmentGroups.map((group) => {
            const open = isPanelOpen(group);
            return (
              <div
                key={panelKey(group)}
                className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => togglePanel(group)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="text-foreground text-lg" style={{ fontWeight: 600 }}>
                      {group.assignmentTitle || "Untitled assignment"}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-accent-primary text-xs font-medium">
                        {group.courseCode}
                      </span>
                      {group.dueDate && (
                        <span>Due {group.dueDate.slice(0, 10)}</span>
                      )}
                      <span>
                        {group.rows.length} submission{group.rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform mt-0.5 ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                {open && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-5 py-3 text-left text-foreground text-sm" style={{ fontWeight: 600 }}>
                            Student Name
                          </th>
                          <th className="px-5 py-3 text-left text-foreground text-sm" style={{ fontWeight: 600 }}>
                            Submitted On
                          </th>
                          <th className="px-5 py-3 text-left text-foreground text-sm" style={{ fontWeight: 600 }}>
                            Status
                          </th>
                          <th className="px-5 py-3 text-left text-foreground text-sm" style={{ fontWeight: 600 }}>
                            Marks
                          </th>
                          <th className="px-5 py-3 text-left text-foreground text-sm" style={{ fontWeight: 600 }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((submission) => {
                          const canEval = canEvaluateAfterDue(submission.due_date);
                          const statusLabel =
                            submission.evaluation_status === "evaluated" ? "evaluated" : "pending";
                          return (
                            <tr
                              key={submission.id}
                              className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-foreground text-sm" style={{ fontWeight: 600 }}>
                                <span className="inline-flex items-center gap-2 flex-wrap">
                                  {submission.student_name}
                                  {(submission.attachment_count ?? 0) > 0 && (
                                    <span
                                      className="text-xs font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                                      title="Has attachments"
                                    >
                                      {submission.attachment_count} file
                                      {(submission.attachment_count ?? 0) === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground text-sm">
                                {submission.submitted_on ?? "—"}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs ${
                                    statusLabel === "evaluated"
                                      ? "bg-success/10 text-success"
                                      : "bg-warning/10 text-warning"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-foreground text-sm">
                                {submission.marks !== null && submission.marks !== undefined
                                  ? `${submission.marks}/100`
                                  : "—"}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubmission(submission.id)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                    title="View submission"
                                  >
                                    <Eye className="w-4 h-4 text-accent-primary" />
                                  </button>
                                  {canEval ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmission(submission.id)}
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
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
              const bodyText = submissionDetail?.content ?? submission.content;
              const attachments = submissionDetail?.attachments ?? [];

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

                    {detailLoading && (
                      <p className="text-sm text-muted-foreground mb-4">Loading submission…</p>
                    )}

                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <h4 className="mb-2 text-foreground">Submission Content</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{bodyText || "—"}</p>
                    </div>

                    {attachments.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <h4 className="text-foreground text-sm font-medium">Attachments</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Expand a file to stream the preview in the app (no separate download step).
                        </p>
                        <div className="space-y-2 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
                          {attachments.map((att) => (
                            <AttachmentInlinePreview
                              key={att.id}
                              submissionId={submission.id}
                              attachment={{
                                id: att.id,
                                original_filename: att.original_filename,
                                mime_type: att.mime_type,
                                size_bytes: att.size_bytes,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

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
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(null);
                        setSubmissionDetail(null);
                        setMarks("");
                        setFeedback("");
                      }}
                      className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
                    >
                      Cancel
                    </button>
                    {canEval && (
                      <button
                        type="button"
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
