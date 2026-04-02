/**
 * Flask API (`/api/auth`) returns JWT roles `Student` | `Staff` | `Admin` (see `backend/app/auth_jwt.py`).
 * The SPA uses `student` | `faculty` | `admin` for routes and UI — map at the API boundary with these helpers.
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

/** Maps API / stored JWT role strings into app roles. Accepts legacy `Staff` as faculty if ever present. */
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
