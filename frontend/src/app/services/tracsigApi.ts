/**
 * Typed wrappers for TracSig REST endpoints (see backend `app/routes/`).
 */

import { apiRequest } from "./api";

// ——— Auth ———

export type AuthUserPublic = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthMe = AuthUserPublic & {
  batch_id: number | null;
  batch_label: string | null;
};

export async function loginRequest(email: string, password: string) {
  return apiRequest<{
    user: AuthUserPublic;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutRequest(refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    /* best-effort */
  }
}

export async function fetchMe() {
  return apiRequest<AuthMe>("/api/auth/me");
}

// ——— Notifications ———

export type NotificationDto = {
  id: number;
  type: string;
  title: string;
  message: string;
  icon_key: string;
  is_read: boolean;
  created_at: string | null;
};

export async function fetchNotifications(unreadOnly?: boolean) {
  const q = unreadOnly ? "?unread_only=true" : "";
  return apiRequest<{ items: NotificationDto[] }>(`/api/notifications${q}`);
}

export async function markNotificationRead(id: number) {
  return apiRequest<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ ok: boolean }>("/api/notifications/read-all", { method: "PATCH" });
}

export async function deleteNotification(id: number) {
  await apiRequest(`/api/notifications/${id}`, { method: "DELETE" });
}

export async function deleteAllNotifications() {
  await apiRequest("/api/notifications", { method: "DELETE" });
}

// ——— Student ———

export async function fetchStudentDashboard() {
  return apiRequest<Record<string, unknown>>("/api/student/dashboard");
}

export async function fetchStudentAssignments(scope: "active" | "closed" | "all" = "active") {
  return apiRequest<{ items: unknown[] }>(`/api/student/assignments?scope=${scope}`);
}

export async function fetchStudentAssignmentDetail(id: number) {
  return apiRequest<Record<string, unknown>>(`/api/student/assignments/${id}`);
}

export async function saveStudentDraft(assignmentId: number, content: string) {
  return apiRequest<{ ok: boolean }>(`/api/student/assignments/${assignmentId}/draft`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function submitStudentAssignment(assignmentId: number, content: string) {
  return apiRequest<{ ok: boolean }>(`/api/student/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export type SubmissionAttachmentDto = {
  id: number;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string | null;
  submission_id?: number;
};

export async function uploadStudentAssignmentAttachment(assignmentId: number, file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return apiRequest<SubmissionAttachmentDto>(`/api/student/assignments/${assignmentId}/attachments`, {
    method: "POST",
    body: fd,
  });
}

export async function deleteStudentAssignmentAttachment(assignmentId: number, attachmentId: number) {
  await apiRequest(`/api/student/assignments/${assignmentId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

// ——— Staff ———

export async function fetchStaffDashboard() {
  return apiRequest<Record<string, unknown>>("/api/staff/dashboard");
}

export async function fetchStaffCourses() {
  return apiRequest<{ items: { id: number; code: string; name: string }[] }>("/api/staff/courses");
}

export async function createStaffAssignment(body: {
  title: string;
  description: string;
  course_id: number;
  due_date: string;
  attachments_enabled?: boolean;
  min_upload_bytes?: number | null;
  max_upload_bytes?: number | null;
}) {
  return apiRequest<{ id: number }>("/api/staff/assignments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchStaffSubmissions() {
  return apiRequest<{ items: unknown[] }>("/api/staff/submissions");
}

export type StaffSubmissionDetail = {
  id: number;
  assignment_id: number;
  assignment_title: string;
  course_code: string;
  due_date: string;
  student_id: number;
  student_name: string;
  submitted_on: string | null;
  evaluation_status: string;
  marks: number | null;
  feedback: string | null;
  content: string;
  attachments: SubmissionAttachmentDto[];
};

export async function fetchStaffSubmissionDetail(submissionId: number) {
  return apiRequest<StaffSubmissionDetail>(`/api/staff/submissions/${submissionId}`);
}

export async function evaluateSubmission(
  submissionId: number,
  body: { marks: number; feedback: string }
) {
  return apiRequest<{ ok: boolean }>(`/api/staff/submissions/${submissionId}/evaluate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchStaffStudentProgress(course?: string) {
  const q = course && course !== "all" ? `?course=${encodeURIComponent(course)}` : "";
  return apiRequest<{ items: unknown[]; summary: Record<string, number> }>(
    `/api/staff/students/progress${q}`
  );
}

// ——— Admin ———

export async function fetchAdminStudents(params: { batch?: string; search?: string }) {
  const sp = new URLSearchParams();
  if (params.batch && params.batch !== "all") sp.set("batch", params.batch);
  if (params.search) sp.set("search", params.search);
  const q = sp.toString();
  return apiRequest<{ items: unknown[] }>(`/api/admin/students${q ? `?${q}` : ""}`);
}

export async function createAdminStudent(body: {
  name: string;
  email: string;
  password: string;
  batch_id: number;
}) {
  return apiRequest<{ id: number }>("/api/admin/students", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminStudent(id: number) {
  await apiRequest(`/api/admin/students/${id}`, { method: "DELETE" });
}

export async function fetchAdminStaff() {
  return apiRequest<{ items: unknown[] }>("/api/admin/staff");
}

export async function createAdminStaff(body: {
  name: string;
  email: string;
  password: string;
  teaching_load_hours?: number | null;
}) {
  return apiRequest<{ id: number }>("/api/admin/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminStaff(
  id: number,
  body: {
    name?: string;
    email?: string;
    teaching_load_hours?: number | null;
    password?: string;
  }
) {
  return apiRequest<{ ok: boolean }>(`/api/admin/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminStaff(id: number) {
  await apiRequest(`/api/admin/staff/${id}`, { method: "DELETE" });
}

export async function fetchAdminCourses() {
  return apiRequest<{ items: unknown[] }>("/api/admin/courses");
}

export type AdminEnrollmentRow = {
  id: number;
  batch_name: string;
  course_name: string;
  batch_start_date: string | null;
  batch_end_date: string | null;
};

export async function fetchAdminEnrollments() {
  return apiRequest<{ items: AdminEnrollmentRow[] }>("/api/admin/enrollment");
}

export async function createAdminEnrollment(body: { batch_id: number; course_id: number }) {
  return apiRequest<{ id: number }>("/api/admin/enrollment", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminEnrollment(id: number) {
  await apiRequest(`/api/admin/enrollment/${id}`, { method: "DELETE" });
}

export async function createAdminCourse(body: {
  code: string;
  name: string;
  credits: number;
  staff_id: number;
}) {
  return apiRequest<{ id: number }>("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCourse(
  id: number,
  body: {
    code?: string;
    name?: string;
    credits?: number;
    staff_id?: number;
  }
) {
  return apiRequest<{ ok: boolean }>(`/api/admin/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCourse(id: number) {
  await apiRequest(`/api/admin/courses/${id}`, { method: "DELETE" });
}

export async function fetchAdminBatches() {
  return apiRequest<{ items: { id: number; name: string; year_label: string }[] }>("/api/admin/batches");
}

/** Admin batch & student management (dates + strength). */
export type AdminBatchSummary = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  strength: number;
};

export async function fetchAdminBatchSummaries() {
  return apiRequest<{ items: AdminBatchSummary[] }>("/api/admin/batch");
}

export async function createAdminBatchV2(body: { name: string; start_date: string; end_date: string }) {
  return apiRequest<{ id: number }>("/api/admin/batch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminBatchDetail(batchId: number) {
  return apiRequest<{
    batch: { id: number; name: string; start_date: string | null; end_date: string | null };
    students: { id: string; name: string; email: string }[];
  }>(`/api/admin/batch/${batchId}`);
}

export async function deleteAdminBatch(batchId: number) {
  return apiRequest<{ message: string }>(`/api/admin/batch/${batchId}`, {
    method: "DELETE",
  });
}

export async function createAdminManagedStudent(body: {
  id: string;
  name: string;
  email: string;
  password: string;
  batch_id: number;
}) {
  return apiRequest<{ id: string }>("/api/admin/student", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function bulkUploadAdminStudents(batchId: number, file: File) {
  const fd = new FormData();
  fd.set("batch_id", String(batchId));
  fd.set("file", file);
  return apiRequest<{ added: number; skipped: number }>("/api/admin/student/bulk", {
    method: "POST",
    body: fd,
  });
}

export async function deleteAdminManagedStudents(ids: string[]) {
  return apiRequest<{ deleted: number }>("/api/admin/student", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}
