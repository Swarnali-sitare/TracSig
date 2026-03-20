/**
 * Persists in-progress assignment text per signed-in user and assignment.
 * Stored in localStorage (origin-scoped). Not a substitute for server-side storage in production.
 */

const PREFIX = "tracsig_assignment_draft_v1";

export type AssignmentDraftPayload = {
  version: 1;
  content: string;
  savedAt: string;
};

function storageKey(userId: string, assignmentId: string | number): string {
  return `${PREFIX}:${userId}:${assignmentId}`;
}

function safeParse(raw: string | null): AssignmentDraftPayload | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AssignmentDraftPayload;
    if (v?.version !== 1 || typeof v.content !== "string" || typeof v.savedAt !== "string") return null;
    return v;
  } catch {
    return null;
  }
}

export function loadAssignmentDraft(userId: string, assignmentId: string | number): AssignmentDraftPayload | null {
  return safeParse(localStorage.getItem(storageKey(userId, assignmentId)));
}

/**
 * Saves draft text. Trimming to empty removes the draft entry so storage stays minimal.
 */
export function saveAssignmentDraft(userId: string, assignmentId: string | number, content: string): void {
  const key = storageKey(userId, assignmentId);
  try {
    if (content.trim().length === 0) {
      localStorage.removeItem(key);
      return;
    }
    const payload: AssignmentDraftPayload = {
      version: 1,
      content,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // QuotaExceededError or private mode — caller may show a toast
  }
}

export function clearAssignmentDraft(userId: string, assignmentId: string | number): void {
  try {
    localStorage.removeItem(storageKey(userId, assignmentId));
  } catch {
    /* ignore */
  }
}

export function hasNonEmptyAssignmentDraft(userId: string, assignmentId: string | number): boolean {
  const d = loadAssignmentDraft(userId, assignmentId);
  return d !== null && d.content.trim().length > 0;
}
