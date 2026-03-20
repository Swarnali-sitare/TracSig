/**
 * Backend auth contract (Express `/api/auth`): signup and JWT payloads use
 * `Teacher` | `Student` | `Admin` (see `backend/src/types/index.ts` when present).
 *
 * The SPA uses `student` | `faculty` | `admin` for routes and UI. **Faculty maps to `Teacher`**
 * on the API — the backend role has always been "Teacher", not a separate "Staff" value.
 * Use these helpers at the API boundary so backend validation (`VALID_ROLES`) stays satisfied.
 */

export type BackendUserRole = "Teacher" | "Student" | "Admin";

export type AppUserRole = "student" | "faculty" | "admin";

export function toBackendRole(role: AppUserRole): BackendUserRole {
  const map: Record<AppUserRole, BackendUserRole> = {
    student: "Student",
    faculty: "Teacher",
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
