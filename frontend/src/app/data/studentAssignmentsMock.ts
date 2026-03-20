import {
  addDays,
  formatYmd,
  getStudentAssignmentDisplayStatus,
  type SubmissionRecordStatus,
} from "../utils/assignmentStatus";

export type StudentAssignmentRecord = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: SubmissionRecordStatus;
  /** Set when status is completed — for "recent submissions" display */
  submittedOn?: string;
  /** Optional — detail page falls back to a default blurb */
  description?: string;
};

let cached: StudentAssignmentRecord[] | null = null;

/** Stable mock list for the session so dashboards and lists stay in sync. */
export function getMockStudentAssignments(): StudentAssignmentRecord[] {
  if (cached) return cached;
  const t = new Date();
  const defaultDesc =
    "Follow the course instructions and submit your work before the due date. Include any required reports or attachments.";

  cached = [
    {
      id: 1,
      title: "Data Structures Project",
      course: "CS201",
      dueDate: formatYmd(addDays(t, 6)),
      status: "pending",
      description:
        "Implement a binary search tree with insert, delete, and search operations. Include documentation and test cases. Submit code with a report on approach and time complexity.",
    },
    {
      id: 2,
      title: "Web Development Assignment",
      course: "CS301",
      dueDate: formatYmd(addDays(t, 12)),
      status: "pending",
      description: defaultDesc,
    },
    {
      id: 3,
      title: "Database Design",
      course: "CS202",
      dueDate: formatYmd(addDays(t, 3)),
      status: "completed",
      submittedOn: formatYmd(addDays(t, -1)),
      description: defaultDesc,
    },
    {
      id: 4,
      title: "Algorithm Analysis",
      course: "CS201",
      dueDate: formatYmd(addDays(t, -5)),
      status: "completed",
      submittedOn: formatYmd(addDays(t, -6)),
      description: defaultDesc,
    },
    {
      id: 5,
      title: "UI/UX Design",
      course: "CS301",
      dueDate: formatYmd(addDays(t, -3)),
      status: "completed",
      submittedOn: formatYmd(addDays(t, -4)),
      description: defaultDesc,
    },
    {
      id: 6,
      title: "Machine Learning Report",
      course: "CS401",
      dueDate: formatYmd(addDays(t, -8)),
      status: "pending",
      description: defaultDesc,
    },
  ];
  return cached;
}

export function countAssignmentStats(assignments: StudentAssignmentRecord[]) {
  const total = assignments.length;
  let completed = 0;
  let pending = 0;
  let incomplete = 0;
  for (const a of assignments) {
    const d = getStudentAssignmentDisplayStatus(a);
    if (d === "Completed") completed += 1;
    else if (d === "Pending") pending += 1;
    else incomplete += 1;
  }
  return { total, completed, pending, incomplete };
}
