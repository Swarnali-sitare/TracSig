import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  UserCheck,
  TrendingUp,
  PlusCircle,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CheckCircle2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const ASSIGNMENTS_BASE = "/student/assignments";

function isStudentAssignmentDetail(pathname: string): boolean {
  if (!pathname.startsWith(`${ASSIGNMENTS_BASE}/`)) return false;
  const rest = pathname.slice(`${ASSIGNMENTS_BASE}/`.length);
  if (!rest || rest.includes("/")) return false;
  return rest !== "active" && rest !== "closed";
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAssignmentsSection = location.pathname.startsWith(`${ASSIGNMENTS_BASE}/`);
  const [assignmentsOpen, setAssignmentsOpen] = useState(
    () => isAssignmentsSection
  );

  useEffect(() => {
    if (isAssignmentsSection) {
      setAssignmentsOpen(true);
    }
  }, [isAssignmentsSection]);

  const studentMenu = [{ icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" }];

  const facultyMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/faculty/dashboard" },
    { icon: PlusCircle, label: "Give Assignment", path: "/faculty/give-assignment" },
    { icon: TrendingUp, label: "Student Progress", path: "/faculty/student-progress" },
    { icon: ClipboardCheck, label: "Evaluate", path: "/faculty/evaluate" },
  ];

  const adminMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Students", path: "/admin/students" },
    { icon: UserCheck, label: "Faculty", path: "/admin/faculty" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
  ];

  const getMenu = () => {
    switch (user?.role) {
      case "student":
        return studentMenu;
      case "faculty":
        return facultyMenu;
      case "admin":
        return adminMenu;
      default:
        return [];
    }
  };

  const menu = getMenu();

  const assignmentsActivePath = `${ASSIGNMENTS_BASE}/active`;
  const assignmentsClosedPath = `${ASSIGNMENTS_BASE}/closed`;

  const fromList = (location.state as { fromList?: "active" | "closed" } | null)?.fromList;
  const onAssignmentDetail = isStudentAssignmentDetail(location.pathname);
  const isActiveSub =
    location.pathname === assignmentsActivePath ||
    (onAssignmentDetail && fromList === "active");
  const isClosedSub =
    location.pathname === assignmentsClosedPath ||
    (onAssignmentDetail && fromList === "closed");

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-card transition-all duration-300 ${
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
      }`}
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {user?.role === "student" ? (
            <>
              {studentMenu.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-hover-bg"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={() => setAssignmentsOpen((o) => !o)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    assignmentsOpen ? "bg-muted/60 text-foreground" : "text-foreground hover:bg-hover-bg"
                  }`}
                >
                  <FileText className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left font-medium">Assignments</span>
                  {assignmentsOpen ? (
                    <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                  )}
                </button>
                {assignmentsOpen && (
                  <ul className="mt-1 space-y-0.5 border-l border-border/80 pl-3 ml-4">
                    <li>
                      <button
                        type="button"
                        onClick={() => navigate(assignmentsActivePath)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActiveSub
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-hover-bg"
                        }`}
                      >
                        <CircleDot className="w-4 h-4 shrink-0" />
                        Active
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => navigate(assignmentsClosedPath)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isClosedSub
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-hover-bg"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Closed
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            </>
          ) : (
            menu.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-hover-bg"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </nav>
    </aside>
  );
};
