import type { SubmissionRecordStatus } from "../utils/assignmentStatus";

/** Student assignment row for list/detail views. */
export type StudentAssignmentRecord = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: SubmissionRecordStatus;
  submittedOn?: string;
  description?: string;
  /** Draft auto-submitted after due date. */
  autoSubmitted?: boolean;
};
