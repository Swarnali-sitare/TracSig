import type { SubmissionRecordStatus } from "../utils/assignmentStatus";

/** Normalized row for student assignment list/detail UI (matches former mock shape). */
export type StudentAssignmentRecord = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: SubmissionRecordStatus;
  submittedOn?: string;
  description?: string;
  /** Server: draft was auto-submitted when the due date passed. */
  autoSubmitted?: boolean;
};
