import React, { useEffect, useState } from "react";
import { FileText, Users, CheckCircle, ClipboardPenLine } from "lucide-react";
import { SubmissionStatusPieChart } from "../charts/SubmissionStatusPieChart";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { fetchStaffDashboard } from "../../services/tracsigApi";

type StaffDash = {
  assignments_created: number;
  total_students: number;
  submissions_count: number;
  pending_evaluation_count: number;
  avg_assignment_submission_rate_percent: number | null;
  completion_data: { name: string; value: number; color: string }[];
  recent_assignments: {
    id: number;
    title: string;
    course: string;
    students: number;
    submitted: number;
    due_date: string;
  }[];
};

export const FacultyDashboard = () => {
  const [data, setData] = useState<StaffDash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = (await fetchStaffDashboard()) as StaffDash;
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiRequestError) toast.error(e.message);
          else toast.error("Could not load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  const stats = [
    {
      icon: FileText,
      label: "Assignments Created",
      value: String(data.assignments_created),
      color: "var(--accent-primary)",
      bgColor: "color-mix(in srgb, var(--accent-primary) 16%, transparent)",
    },
    {
      icon: Users,
      label: "Total Students",
      value: String(data.total_students),
      color: "var(--accent-hover)",
      bgColor: "color-mix(in srgb, var(--accent-hover) 16%, transparent)",
    },
    {
      icon: CheckCircle,
      label: "Submissions",
      value: String(data.submissions_count),
      color: "var(--success)",
      bgColor: "color-mix(in srgb, var(--success) 16%, transparent)",
    },
    {
      icon: ClipboardPenLine,
      label: "Pending Evaluation",
      value: String(data.pending_evaluation_count ?? 0),
      color: "var(--warning)",
      bgColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
  ];

  const completionData = data.completion_data?.length
    ? data.completion_data
    : [
        { name: "Completed", value: 0, color: "var(--success)" },
        { name: "Pending", value: 0, color: "var(--warning)" },
        { name: "Incomplete", value: 0, color: "var(--error)" },
      ];

  const recentAssignments = data.recent_assignments;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Faculty Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-3xl mb-1" style={{ fontWeight: 700, color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="mb-4 text-foreground">Submission Status</h2>
          {completionData.every((d) => d.value === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No submission data yet.</p>
          ) : (
            <SubmissionStatusPieChart data={completionData} />
          )}
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="mb-4 text-foreground">Submission Rate</h2>
          <div className="flex min-h-[220px] flex-col items-center justify-center py-6">
            {data.avg_assignment_submission_rate_percent != null ? (
              <>
                <p className="text-3xl tabular-nums text-foreground" style={{ fontWeight: 500 }}>
                  {data.avg_assignment_submission_rate_percent}% Assignments Submitted
                </p>
                <p className="mt-3 text-center text-xl text-muted-foreground">
                  (Out of {data.assignments_created} assignment(s) given)
                </p>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No assignments with enrolled students yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-foreground">Recent Assignments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Assignment Title
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Students
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Submissions
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No assignments yet.
                  </td>
                </tr>
              ) : (
                recentAssignments.map((assignment) => {
                  const progress =
                    assignment.students > 0
                      ? Math.round((assignment.submitted / assignment.students) * 100)
                      : 0;
                  return (
                    <tr
                      key={assignment.id}
                      className="border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                        {assignment.title}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{assignment.course}</td>
                      <td className="px-6 py-4 text-muted-foreground">{assignment.students}</td>
                      <td className="px-6 py-4 text-muted-foreground">{assignment.submitted}</td>
                      <td className="px-6 py-4 text-muted-foreground">{assignment.due_date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-success" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
