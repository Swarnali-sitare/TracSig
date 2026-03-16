import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  UserCheck,
  TrendingUp,
  Bell,
  Settings,
  PlusCircle,
  ClipboardCheck,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const studentMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
    { icon: FileText, label: "Assignments", path: "/student/assignments" },
    { icon: Bell, label: "Notifications", path: "/student/notifications" },
  ];

  const staffMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/staff/dashboard" },
    { icon: PlusCircle, label: "Give Assignment", path: "/staff/give-assignment" },
    { icon: TrendingUp, label: "Student Progress", path: "/staff/student-progress" },
    { icon: ClipboardCheck, label: "Evaluate", path: "/staff/evaluate" },
  ];

  const adminMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Students", path: "/admin/students" },
    { icon: UserCheck, label: "Staff", path: "/admin/staff" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
  ];

  const getMenu = () => {
    switch (user?.role) {
      case "student":
        return studentMenu;
      case "staff":
        return staffMenu;
      case "admin":
        return adminMenu;
      default:
        return [];
    }
  };

  const menu = getMenu();

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-[rgba(0,0,0,0.1)] transition-all duration-300 z-40 ${
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
      }`}
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "text-[#1F2937] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
