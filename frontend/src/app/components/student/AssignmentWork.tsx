import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { Save, Send, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  clearAssignmentDraft,
  loadAssignmentDraft,
  saveAssignmentDraft,
} from "../../utils/assignmentDraftStorage";
import {
  daysFromToday,
  getDisplayStatusBadgeClass,
  getStudentAssignmentDisplayStatus,
  isDueDatePassed,
} from "../../utils/assignmentStatus";
import { useAuth } from "../../context/AuthContext";
import { ApiRequestError } from "../../services/api";
import {
  fetchStudentAssignmentDetail,
  saveStudentDraft,
  submitStudentAssignment,
} from "../../services/tracsigApi";
import type { StudentAssignmentRecord } from "../../types/studentAssignment";

const AUTOSAVE_MS = 2000;

export const AssignmentWork = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const assignmentsListPath = (() => {
    const from = (location.state as { fromList?: "active" | "closed" })?.fromList;
    if (from === "closed") return "/student/assignments/closed";
    return "/student/assignments/active";
  })();

  const [submissionText, setSubmissionText] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<StudentAssignmentRecord | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [marks, setMarks] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverDraftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const detail = await fetchStudentAssignmentDetail(Number(id));
        if (cancelled) return;
        const submitted = Boolean(detail.is_submitted);
        setIsSubmitted(submitted);
        setMarks(typeof detail.marks === "number" ? detail.marks : null);
        setFeedback(typeof detail.feedback === "string" ? detail.feedback : null);
        const row: StudentAssignmentRecord = {
          id: Number(detail.id),
          title: String(detail.title),
          course: String(detail.course_code),
          dueDate: String(detail.due_date).slice(0, 10),
          status: detail.record_status === "completed" ? "completed" : "pending",
          submittedOn: detail.submitted_on ? String(detail.submitted_on).slice(0, 10) : undefined,
          description: detail.description != null ? String(detail.description) : undefined,
          autoSubmitted: Boolean(detail.auto_submitted),
        };
        setAssignment(row);
        setAutoSubmitted(Boolean(detail.auto_submitted));
        const serverContent = typeof detail.content === "string" ? detail.content : "";
        if (!submitted && user?.id) {
          const local = loadAssignmentDraft(user.id, id);
          const merged = serverContent || local?.content || "";
          setSubmissionText(merged);
        } else if (submitted) {
          setSubmissionText(typeof detail.content === "string" ? detail.content : "");
        } else {
          setSubmissionText(serverContent);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError) toast.error(e.message);
          else toast.error("Could not load assignment");
          navigate(assignmentsListPath);
        }
      } finally {
        if (!cancelled) {
          setDraftHydrated(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id, navigate, assignmentsListPath]);

  const displayStatus = assignment
    ? getStudentAssignmentDisplayStatus(assignment)
    : "Pending";
  const deltaDays = assignment ? daysFromToday(assignment.dueDate) : 0;
  const duePassed = assignment ? isDueDatePassed(assignment.dueDate) : false;
  const canEdit = !isSubmitted && !duePassed;

  useEffect(() => {
    if (!draftHydrated || !user?.id || !id || isSubmitted || !canEdit) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      try {
        saveAssignmentDraft(user.id, id, submissionText);
        if (submissionText.trim().length > 0) {
          setLastSavedAt(Date.now());
        } else {
          setLastSavedAt(null);
        }
      } catch {
        /* local draft quota */
      }
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [submissionText, draftHydrated, user?.id, id, isSubmitted, canEdit]);

  // Debounced server draft sync (API integration)
  useEffect(() => {
    if (!draftHydrated || !id || isSubmitted || !canEdit) return;
    if (serverDraftSaveRef.current) clearTimeout(serverDraftSaveRef.current);
    serverDraftSaveRef.current = setTimeout(() => {
      void saveStudentDraft(Number(id), submissionText).catch(() => {
        /* offline or validation; local draft still works */
      });
    }, AUTOSAVE_MS);
    return () => {
      if (serverDraftSaveRef.current) clearTimeout(serverDraftSaveRef.current);
    };
  }, [submissionText, draftHydrated, id, isSubmitted, canEdit]);

  const handleSaveAsDraft = useCallback(async () => {
    if (!user?.id || !id) {
      toast.error("You must be signed in to save a draft.");
      return;
    }
    if (!canEdit) {
      toast.error("This assignment is closed.");
      return;
    }

    setIsSaving(true);
    try {
      await saveStudentDraft(Number(id), submissionText);
      saveAssignmentDraft(user.id, id, submissionText);
      if (submissionText.trim().length === 0) {
        setLastSavedAt(null);
        toast.success("Draft cleared from this device and server.");
      } else {
        setLastSavedAt(Date.now());
        toast.success("Draft saved — Pending until you submit.");
      }
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Could not save draft.");
    }
    setIsSaving(false);
  }, [user?.id, id, submissionText, canEdit]);

  const handleSubmit = async () => {
    if (!canEdit) {
      toast.error("This assignment is closed.");
      return;
    }
    if (!submissionText.trim()) {
      toast.error("Please enter your submission");
      return;
    }
    if (!id) return;

    setIsSubmitting(true);
    try {
      await submitStudentAssignment(Number(id), submissionText);
      if (user?.id && id) {
        clearAssignmentDraft(user.id, id);
      }
      toast.success("Assignment submitted successfully!");
      setShowConfirmation(false);
      navigate(assignmentsListPath);
    } catch (e) {
      if (e instanceof ApiRequestError) toast.error(e.message);
      else toast.error("Submit failed.");
    }
    setIsSubmitting(false);
  };

  const lastSavedLabel =
    lastSavedAt !== null
      ? `Last saved ${new Date(lastSavedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}`
      : null;

  if (loading || !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-muted-foreground">Loading assignment…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(assignmentsListPath)}
        className="flex items-center gap-2 text-accent-primary hover:text-accent-hover mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h1 className="text-foreground">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-sm border ${getDisplayStatusBadgeClass(displayStatus)}`}
            >
              {displayStatus}
            </span>
            {isSubmitted && autoSubmitted && (
              <span
                className="text-xs px-2 py-0.5 rounded-md border border-muted-foreground/50 text-muted-foreground uppercase tracking-wide"
                title="Submitted automatically when the due date passed"
              >
                auto
              </span>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-4">{assignment.course}</p>

        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Due: {assignment.dueDate}</span>
          </div>
          {!isSubmitted && deltaDays > 0 && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                deltaDays <= 2 ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {deltaDays} {deltaDays === 1 ? "day" : "days"} left
              </span>
            </div>
          )}
          {!isSubmitted && deltaDays === 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Due today</span>
            </div>
          )}
          {!isSubmitted && deltaDays < 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 text-error">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Due date has passed</span>
            </div>
          )}
          {isSubmitted && assignment.submittedOn && (
            <p className="text-sm text-muted-foreground">Submitted on {assignment.submittedOn}</p>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="mb-2 text-foreground">Description</h3>
          <p className="text-muted-foreground leading-relaxed">{assignment.description}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-foreground">Your Submission</h2>
          {!isSubmitted && canEdit && (
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span>Autosave to device &amp; server ({Math.round(AUTOSAVE_MS / 1000)}s)</span>
              </div>
              {lastSavedLabel && <span className="text-xs">{lastSavedLabel}</span>}
            </div>
          )}
        </div>

        {isSubmitted ? (
          <div className="space-y-4">
            {autoSubmitted && (
              <p className="text-xs text-muted-foreground border border-border/60 rounded-lg px-3 py-2 bg-muted/30">
                This submission was saved automatically when the due date passed (draft content as submitted).
              </p>
            )}
            <p className="text-muted-foreground py-4 border border-border rounded-lg px-4 bg-muted/50 whitespace-pre-wrap">
              {submissionText || "—"}
            </p>
            {(marks != null || feedback) && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                {marks != null && (
                  <p className="text-foreground">
                    <span className="font-semibold">Marks:</span> {marks}/100
                  </p>
                )}
                {feedback && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                    <span className="font-semibold text-foreground">Feedback:</span> {feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : canEdit ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Drafts stay in <strong>Pending</strong> until you submit. Local and server drafts are kept in sync when
              online.
            </p>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Write your submission here..."
              className="w-full h-96 px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-muted-foreground">{submissionText.length} characters</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(true)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Assignment
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground border border-border rounded-lg px-4 py-6 bg-muted/30">
            The due date has passed
            {displayStatus === "Incomplete"
              ? " and you had no submitted work. This assignment is marked Incomplete."
              : "."}
            {" "}You cannot edit or submit anymore.
          </p>
        )}
      </div>

      {showConfirmation && !isSubmitted && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="mb-2 text-foreground">Confirm Submission</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to submit this assignment? You won&apos;t be able to edit it after submission.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
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
