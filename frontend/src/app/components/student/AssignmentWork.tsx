import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { Save, Send, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getMockStudentAssignments } from "../../data/studentAssignmentsMock";
import {
  clearAssignmentDraft,
  loadAssignmentDraft,
  saveAssignmentDraft,
} from "../../utils/assignmentDraftStorage";
import {
  daysFromToday,
  getDisplayStatusBadgeClass,
  getStudentAssignmentDisplayStatus,
} from "../../utils/assignmentStatus";
import { useAuth } from "../../context/AuthContext";

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
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assignment = useMemo(() => {
    const list = getMockStudentAssignments();
    const row = list.find((a) => String(a.id) === id) ?? list[0];
    return {
      ...row,
      description:
        row.description ??
        "Follow the course instructions and submit your work before the due date.",
    };
  }, [id]);

  const displayStatus = getStudentAssignmentDisplayStatus(assignment);
  const isSubmitted = assignment.status === "completed";
  const deltaDays = daysFromToday(assignment.dueDate);

  useEffect(() => {
    if (!id || isSubmitted) {
      setDraftHydrated(true);
      return;
    }
    if (!user?.id) return;
    const existing = loadAssignmentDraft(user.id, id);
    if (existing?.content) {
      setSubmissionText(existing.content);
      setLastSavedAt(new Date(existing.savedAt).getTime());
    }
    setDraftHydrated(true);
  }, [user?.id, id, isSubmitted]);

  useEffect(() => {
    if (!draftHydrated || !user?.id || !id || isSubmitted) return;
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
        /* saveAssignmentDraft swallows; quota issues are rare */
      }
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [submissionText, draftHydrated, user?.id, id, isSubmitted]);

  const handleSaveAsDraft = useCallback(async () => {
    if (!user?.id || !id) {
      toast.error("You must be signed in to save a draft.");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      saveAssignmentDraft(user.id, id, submissionText);
      if (submissionText.trim().length === 0) {
        setLastSavedAt(null);
        toast.success("Draft cleared from this device.");
      } else {
        setLastSavedAt(Date.now());
        toast.success("Draft saved — Pending until you submit. You can resume anytime.");
      }
    } catch {
      toast.error("Could not save draft. Try again or check browser storage.");
    }
    setIsSaving(false);
  }, [user?.id, id, submissionText]);

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error("Please enter your submission");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowConfirmation(false);
    if (user?.id && id) {
      clearAssignmentDraft(user.id, id);
    }
    toast.success("Assignment submitted successfully!");
    navigate(assignmentsListPath);
  };

  const lastSavedLabel =
    lastSavedAt !== null
      ? `Last saved ${new Date(lastSavedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}`
      : null;

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
          <span
            className={`px-3 py-1 rounded-full text-sm border shrink-0 ${getDisplayStatusBadgeClass(displayStatus)}`}
          >
            {displayStatus}
          </span>
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
          {!isSubmitted && (
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span>Autosave to this device ({Math.round(AUTOSAVE_MS / 1000)}s)</span>
              </div>
              {lastSavedLabel && <span className="text-xs">{lastSavedLabel}</span>}
            </div>
          )}
        </div>

        {isSubmitted ? (
          <p className="text-muted-foreground py-8 border border-border rounded-lg px-4 bg-muted/50">
            This assignment is marked as submitted. You can review your grade or feedback from your instructor when
            available.
          </p>
        ) : (
          <>
            {displayStatus === "Incomplete" && (
              <p className="mb-4 text-sm text-error border border-error/30 bg-error/5 rounded-lg px-4 py-3">
                The due date for this assignment has passed. You can still submit below if late submissions are allowed.
              </p>
            )}
            <p className="mb-3 text-xs text-muted-foreground">
              Drafts stay in <strong>Pending</strong> until you submit. They are stored on this browser for your account
              only.
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
        )}
      </div>

      {showConfirmation && !isSubmitted && (
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
