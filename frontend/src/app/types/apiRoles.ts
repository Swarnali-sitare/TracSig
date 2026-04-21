/**
 * API sends Student | Staff | Admin; routes/UI use student | faculty | admin. Map here.
 */

export type BackendUserRole = "Student" | "Staff" | "Admin";

export type AppUserRole = "student" | "faculty" | "admin";

export function toBackendRole(role: AppUserRole): BackendUserRole {
  const map: Record<AppUserRole, BackendUserRole> = {
    student: "Student",
    faculty: "Staff",
    admin: "Admin",
  };
  return map[role];
}

/** JWT role → app role (Teacher/Staff → faculty). */
export function fromBackendRole(role: string): AppUserRole {
  switch (role) {
    case "Student":
      return "student";
    case "Teacher":
    case "Staff":
      return "faculty";
    case "Admin":
      return "admin";
    default:
      return "student";
  }
}

/** Default landing path; admin → student-data. */
export function homePathForRole(role: AppUserRole): string {
  if (role === "admin") return "/admin/student-data";
  return `/${role}/dashboard`;
}
