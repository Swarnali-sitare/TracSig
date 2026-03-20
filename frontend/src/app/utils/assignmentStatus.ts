/** Calendar-day comparison in local time (YYYY-MM-DD). */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** True if the due date is strictly before today (yesterday or earlier). Due today is not passed. */
export function isDueDatePassed(dueYmd: string): boolean {
  const due = startOfDay(parseLocalYmd(dueYmd));
  const today = startOfDay(new Date());
  return due < today;
}

export type SubmissionRecordStatus = "pending" | "completed";

export type StudentAssignmentDisplayStatus = "Pending" | "Completed" | "Incomplete";

/**
 * Pending = not submitted, due date not passed.
 * Completed = submitted.
 * Incomplete = not submitted, due date passed.
 */
export function getStudentAssignmentDisplayStatus(assignment: {
  dueDate: string;
  status: SubmissionRecordStatus;
}): StudentAssignmentDisplayStatus {
  if (assignment.status === "completed") return "Completed";
  if (!isDueDatePassed(assignment.dueDate)) return "Pending";
  return "Incomplete";
}

export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function daysFromToday(dueYmd: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(parseLocalYmd(dueYmd));
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDisplayStatusBadgeClass(status: StudentAssignmentDisplayStatus): string {
  switch (status) {
    case "Pending":
      return "bg-warning/10 text-warning border-warning/40";
    case "Completed":
      return "bg-success/10 text-success border-success/40";
    case "Incomplete":
      return "bg-error/10 text-error border-error/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
