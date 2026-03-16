import { useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

export const StudentProgress = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const students = [
    {
      id: 1,
      name: "Alice Johnson",
      batch: "2023",
      course: "CS201",
      assignmentsSubmitted: 18,
      totalAssignments: 20,
      completionRate: 90,
      lastActivity: "2026-03-14",
      trend: "up",
    },
    {
      id: 2,
      name: "Bob Smith",
      batch: "2023",
      course: "CS201",
      assignmentsSubmitted: 15,
      totalAssignments: 20,
      completionRate: 75,
      lastActivity: "2026-03-13",
      trend: "up",
    },
    {
      id: 3,
      name: "Charlie Brown",
      batch: "2023",
      course: "CS301",
      assignmentsSubmitted: 12,
      totalAssignments: 20,
      completionRate: 60,
      lastActivity: "2026-03-12",
      trend: "down",
    },
    {
      id: 4,
      name: "Diana Prince",
      batch: "2023",
      course: "CS201",
      assignmentsSubmitted: 19,
      totalAssignments: 20,
      completionRate: 95,
      lastActivity: "2026-03-15",
      trend: "up",
    },
    {
      id: 5,
      name: "Ethan Hunt",
      batch: "2023",
      course: "CS301",
      assignmentsSubmitted: 16,
      totalAssignments: 20,
      completionRate: 80,
      lastActivity: "2026-03-14",
      trend: "up",
    },
  ];

  const courses = ["CS201", "CS301", "CS401"];

  const filteredStudents = students
    .filter((s) => courseFilter === "all" || s.course === courseFilter)
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-[#22C55E]";
    if (rate >= 60) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-[#1F2937]">Student Progress</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Student Name
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Assignments Submitted
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Completion %
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Last Activity
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-6 py-4 text-[#1F2937]" style={{ fontWeight: 600 }}>
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">{student.batch}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#EEF2FF] text-[#2563EB] rounded-full text-sm">
                      {student.course}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">
                    {student.assignmentsSubmitted} / {student.totalAssignments}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-[#22C55E]"
                          style={{ width: `${student.completionRate}%` }}
                        ></div>
                      </div>
                      <span className={`${getCompletionColor(student.completionRate)}`} style={{ fontWeight: 600 }}>
                        {student.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">{student.lastActivity}</td>
                  <td className="px-6 py-4">
                    {student.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#EF4444]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Average Completion Rate</p>
          <p className="text-3xl text-[#22C55E]" style={{ fontWeight: 700 }}>
            80%
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Students Above 80%</p>
          <p className="text-3xl text-[#2563EB]" style={{ fontWeight: 700 }}>
            3 / 5
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Students Need Attention</p>
          <p className="text-3xl text-[#EF4444]" style={{ fontWeight: 700 }}>
            1
          </p>
        </div>
      </div>
    </div>
  );
};
