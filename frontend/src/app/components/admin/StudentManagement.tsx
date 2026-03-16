import { useState } from "react";
import { Search, Filter, UserPlus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showAddStudent, setShowAddStudent] = useState(false);

  const students = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      batch: "2023",
      department: "Computer Science",
      progress: 90,
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      batch: "2023",
      department: "Information Technology",
      progress: 75,
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      batch: "2024",
      department: "Computer Science",
      progress: 85,
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      batch: "2023",
      department: "Electronics",
      progress: 92,
    },
    {
      id: 5,
      name: "Ethan Hunt",
      email: "ethan@example.com",
      batch: "2024",
      department: "Information Technology",
      progress: 88,
    },
  ];

  const batches = ["2023", "2024", "2025"];

  const filteredStudents = students
    .filter((s) => batchFilter === "all" || s.batch === batchFilter)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDeleteStudent = (id: number) => {
    toast.success("Student removed successfully");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#1F2937]">Student Management</h1>
        <button
          onClick={() => setShowAddStudent(true)}
          className="px-4 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

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
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Name
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Department
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Actions
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
                  <td className="px-6 py-4 text-[#6B7280]">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#EEF2FF] text-[#2563EB] rounded-full text-sm">
                      {student.batch}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">{student.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-[#22C55E]"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#6B7280]">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                        title="Edit student"
                      >
                        <Edit className="w-4 h-4 text-[#2563EB]" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-2 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4 text-[#EF4444]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
              <h2 className="text-[#1F2937]">Add New Student</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-[#1F2937]">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block mb-2 text-[#1F2937]">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block mb-2 text-[#1F2937]">Batch</label>
                <select className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors">
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-[#1F2937]">Department</label>
                <select className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors">
                  <option value="">Select department</option>
                  <option value="cs">Computer Science</option>
                  <option value="it">Information Technology</option>
                  <option value="ec">Electronics</option>
                  <option value="me">Mechanical</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(0,0,0,0.1)] flex justify-end gap-3">
              <button
                onClick={() => setShowAddStudent(false)}
                className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Student added successfully");
                  setShowAddStudent(false);
                }}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
