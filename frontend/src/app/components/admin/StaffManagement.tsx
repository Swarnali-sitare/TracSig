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
        <h1 className="text-foreground">Staff Management</h1>
        <button
          onClick={() => setShowAddStaff(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Department
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Teaching Load
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{member.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {member.courses.map((course) => (
                        <span
                          key={course}
                          className="px-2 py-1 bg-primary/10 text-accent-primary rounded text-xs"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{member.teachingLoad} hours/week</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Edit staff"
                      >
                        <Edit className="w-4 h-4 text-accent-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
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
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Staff Members</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {staff.length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Average Teaching Load</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {(staff.reduce((acc, s) => acc + s.teachingLoad, 0) / staff.length).toFixed(1)} hrs
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Departments</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {new Set(staff.map((s) => s.department)).size}
          </p>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Staff Member</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Department</label>
                <select className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors">
                  <option value="">Select department</option>
                  <option value="cs">Computer Science</option>
                  <option value="it">Information Technology</option>
                  <option value="ec">Electronics</option>
                  <option value="me">Mechanical</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-foreground">Teaching Load (hours/week)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter teaching load"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowAddStaff(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Staff member added successfully");
                  setShowAddStaff(false);
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
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
