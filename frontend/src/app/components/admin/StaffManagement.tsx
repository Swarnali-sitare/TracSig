import { useState } from "react";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);

  const staff = [
    {
      id: 1,
      name: "Dr. John Doe",
      email: "john.doe@example.com",
      department: "Computer Science",
      courses: ["CS101", "CS201"],
      teachingLoad: 6,
    },
    {
      id: 2,
      name: "Dr. Jane Smith",
      email: "jane.smith@example.com",
      department: "Information Technology",
      courses: ["CS301", "CS401"],
      teachingLoad: 5,
    },
    {
      id: 3,
      name: "Prof. Michael Brown",
      email: "michael.brown@example.com",
      department: "Computer Science",
      courses: ["CS202", "CS302"],
      teachingLoad: 7,
    },
    {
      id: 4,
      name: "Dr. Sarah Wilson",
      email: "sarah.wilson@example.com",
      department: "Electronics",
      courses: ["EC101", "EC201"],
      teachingLoad: 4,
    },
  ];

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteStaff = (id: number) => {
    toast.success("Staff member removed successfully");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#1F2937]">Staff Management</h1>
        <button
          onClick={() => setShowAddStaff(true)}
          className="px-4 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)] mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Staff Table */}
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
                  Department
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Teaching Load
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-6 py-4 text-[#1F2937]" style={{ fontWeight: 600 }}>
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">{member.email}</td>
                  <td className="px-6 py-4 text-[#6B7280]">{member.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {member.courses.map((course) => (
                        <span
                          key={course}
                          className="px-2 py-1 bg-[#EEF2FF] text-[#2563EB] rounded text-xs"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280]">{member.teachingLoad} hours/week</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                        title="Edit staff"
                      >
                        <Edit className="w-4 h-4 text-[#2563EB]" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        title="Delete staff"
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Total Staff Members</p>
          <p className="text-3xl text-[#2563EB]" style={{ fontWeight: 700 }}>
            {staff.length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Average Teaching Load</p>
          <p className="text-3xl text-[#14B8A6]" style={{ fontWeight: 700 }}>
            {(staff.reduce((acc, s) => acc + s.teachingLoad, 0) / staff.length).toFixed(1)} hrs
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)]">
          <p className="text-[#6B7280] mb-2">Departments</p>
          <p className="text-3xl text-[#F59E0B]" style={{ fontWeight: 700 }}>
            {new Set(staff.map((s) => s.department)).size}
          </p>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
              <h2 className="text-[#1F2937]">Add New Staff Member</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-[#1F2937]">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                  placeholder="Enter staff name"
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
                <label className="block mb-2 text-[#1F2937]">Department</label>
                <select className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors">
                  <option value="">Select department</option>
                  <option value="cs">Computer Science</option>
                  <option value="it">Information Technology</option>
                  <option value="ec">Electronics</option>
                  <option value="me">Mechanical</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-[#1F2937]">Teaching Load (hours/week)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                  placeholder="Enter teaching load"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(0,0,0,0.1)] flex justify-end gap-3">
              <button
                onClick={() => setShowAddStaff(false)}
                className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Staff member added successfully");
                  setShowAddStaff(false);
                }}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
