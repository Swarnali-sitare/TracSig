import type { StudentAssignmentRecord } from "../types/studentAssignment";
import type { SubmissionRecordStatus } from "./assignmentStatus";

/** Map API list row → StudentAssignmentRecord. */
export function apiListRowToStudentAssignment(row: {
  id: number;
  title: string;
  course_code: string;
  due_date: string;
  record_status: string;
  submitted_on?: string | null;
  description?: string | null;
  auto_submitted?: boolean | null;
}): StudentAssignmentRecord {
  const status: SubmissionRecordStatus = row.record_status === "completed" ? "completed" : "pending";
  return {
    id: row.id,
    title: row.title,
    course: row.course_code,
    dueDate: row.due_date.slice(0, 10),
    status,
    submittedOn: row.submitted_on ?? undefined,
    description: row.description ?? undefined,
    autoSubmitted: Boolean(row.auto_submitted),
  };
}
