import { useState } from "react";
import { Search, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const CourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCourse, setShowAddCourse] = useState(false);

  const courses = [
    {
      id: 1,
      code: "CS101",
      name: "Introduction to Programming",
      department: "Computer Science",
      credits: 4,
      students: 156,
      instructor: "Dr. John Doe",
    },
    {
      id: 2,
      code: "CS201",
      name: "Data Structures",
      department: "Computer Science",
      credits: 4,
      students: 142,
      instructor: "Dr. John Doe",
    },
    {
      id: 3,
      code: "CS301",
      name: "Web Development",
      department: "Computer Science",
      credits: 3,
      students: 128,
      instructor: "Dr. Jane Smith",
    },
    {
      id: 4,
      code: "CS401",
      name: "Machine Learning",
      department: "Computer Science",
      credits: 4,
      students: 98,
      instructor: "Dr. Jane Smith",
    },
    {
      id: 5,
      code: "IT201",
      name: "Database Systems",
      department: "Information Technology",
      credits: 4,
      students: 134,
      instructor: "Prof. Michael Brown",
    },
  ];

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCourse = (id: number) => {
    toast.success("Course deleted successfully");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground">Course Management</h1>
        <button
          onClick={() => setShowAddCourse(true)}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course Code
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Course Name
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Department
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Credits
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Enrolled Students
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Faculty (Instructor)
                </th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-primary/10 text-accent-primary rounded-full">
                      {course.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                    {course.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{course.department}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.credits}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.students}</td>
                  <td className="px-6 py-4 text-muted-foreground">{course.instructor}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit className="w-4 h-4 text-accent-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete course"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-accent-primary" />
            <p className="text-muted-foreground">Total Courses</p>
          </div>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {courses.length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Students</p>
          <p className="text-3xl text-info" style={{ fontWeight: 700 }}>
            {courses.reduce((acc, c) => acc + c.students, 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Avg. Students/Course</p>
          <p className="text-3xl text-warning" style={{ fontWeight: 700 }}>
            {Math.round(courses.reduce((acc, c) => acc + c.students, 0) / courses.length)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Total Credits</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {courses.reduce((acc, c) => acc + c.credits, 0)}
          </p>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-foreground">Add New Course</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Course Code</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Course Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter course name"
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
                <label className="block mb-2 text-foreground">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter credits"
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Instructor</label>
                <select className="w-full px-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors">
                  <option value="">Select instructor</option>
                  <option value="1">Dr. John Doe</option>
                  <option value="2">Dr. Jane Smith</option>
                  <option value="3">Prof. Michael Brown</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowAddCourse(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Course added successfully");
                  setShowAddCourse(false);
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
