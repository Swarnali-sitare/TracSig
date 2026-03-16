import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";

// Student Pages
import { StudentDashboard } from "./components/student/StudentDashboard";
import { StudentAssignments } from "./components/student/StudentAssignments";
import { AssignmentWork } from "./components/student/AssignmentWork";
import { StudentNotifications } from "./components/student/StudentNotifications";

// Staff Pages
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { GiveAssignment } from "./components/staff/GiveAssignment";
import { StudentProgress } from "./components/staff/StudentProgress";
import { EvaluateAssignments } from "./components/staff/EvaluateAssignments";

// Admin Pages
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentManagement } from "./components/admin/StudentManagement";
import { StaffManagement } from "./components/admin/StaffManagement";
import { CourseManagement } from "./components/admin/CourseManagement";

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
          { path: "register", Component: Register },
        ],
      },
      {
        path: "student",
        Component: DashboardLayout,
        children: [
          { index: true, Component: StudentDashboard },
          { path: "dashboard", Component: StudentDashboard },
          { path: "assignments", Component: StudentAssignments },
          { path: "assignments/:id", Component: AssignmentWork },
          { path: "notifications", Component: StudentNotifications },
        ],
      },
      {
        path: "staff",
        Component: DashboardLayout,
        children: [
          { index: true, Component: StaffDashboard },
          { path: "dashboard", Component: StaffDashboard },
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
          { path: "students", Component: StudentManagement },
          { path: "staff", Component: StaffManagement },
          { path: "courses", Component: CourseManagement },
        ],
      },
    ],
  },
]);
