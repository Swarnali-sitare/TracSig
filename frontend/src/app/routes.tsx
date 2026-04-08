import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Login } from "./components/auth/Login";

// Student Pages
import { StudentDashboard } from "./components/student/StudentDashboard";
import { StudentAssignments } from "./components/student/StudentAssignments";
import { AssignmentWork } from "./components/student/AssignmentWork";
// Faculty Pages
import { FacultyDashboard } from "./components/faculty/FacultyDashboard";
import { GiveAssignment } from "./components/faculty/GiveAssignment";
import { StudentProgress } from "./components/faculty/StudentProgress";
import { EvaluateAssignments } from "./components/faculty/EvaluateAssignments";

// Admin Pages
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentData } from "./components/admin/StudentData";
import { BatchStudentRemovePage } from "./components/admin/BatchStudentRemovePage";
import { FacultyManagement } from "./components/admin/FacultyManagement";
import { CourseManagement } from "./components/admin/CourseManagement";

/** Old `/staff/*` URLs → `/faculty/*` */
function RedirectStaffRoutesToFaculty() {
  const { pathname } = useLocation();
  const suffix = pathname.replace(/^\/staff/, "") || "/dashboard";
  return <Navigate to={`/faculty${suffix}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          { index: true, Component: Login },
          { path: "login", Component: Login },
        ],
      },
      {
        path: "student",
        Component: DashboardLayout,
        children: [
          { index: true, Component: StudentDashboard },
          { path: "dashboard", Component: StudentDashboard },
          { path: "assignments", element: <Navigate to="/student/assignments/active" replace /> },
          { path: "assignments/active", Component: StudentAssignments },
          { path: "assignments/closed", Component: StudentAssignments },
          { path: "assignments/:id", Component: AssignmentWork },
        ],
      },
      {
        path: "staff/*",
        element: <RedirectStaffRoutesToFaculty />,
      },
      {
        path: "faculty",
        Component: DashboardLayout,
        children: [
          { index: true, Component: FacultyDashboard },
          { path: "dashboard", Component: FacultyDashboard },
          { path: "give-assignment", Component: GiveAssignment },
          { path: "student-progress", Component: StudentProgress },
          { path: "evaluate", Component: EvaluateAssignments },
        ],
      },
      {
        path: "admin",
        Component: DashboardLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "dashboard", Component: AdminDashboard },
          { path: "student-data", Component: StudentData },
          { path: "student-data/batch/:batchId/remove", Component: BatchStudentRemovePage },
          { path: "students", element: <Navigate to="/admin/student-data" replace /> },
          { path: "staff", element: <Navigate to="/admin/faculty" replace /> },
          { path: "faculty", Component: FacultyManagement },
          { path: "courses", Component: CourseManagement },
        ],
      },
    ],
  },
]);
