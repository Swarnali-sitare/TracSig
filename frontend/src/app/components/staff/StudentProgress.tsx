import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import api from "@/lib/api";

interface StudentProgressItem {
  student_id: string;
  student_name: string;
  email: string;
  department: string;
  batch_id: string | null;
  total_assignments: number;
  submitted: number;
  evaluated: number;
  average_marks: number | null;
}

export const StudentProgress = () => {
  const [students, setStudents] = useState<StudentProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api.get("/staff/students/progress")
      .then((res) => setStudents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter((s) =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompletionRate = (s: StudentProgressItem) =>
    s.total_assignments > 0 ? Math.round((s.submitted / s.total_assignments) * 100) : 0;

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-success";
    if (rate >= 60) return "text-warning";
    return "text-error";
  };

  const avgCompletion =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + getCompletionRate(s), 0) / students.length)
      : 0;
  const above80 = students.filter((s) => getCompletionRate(s) >= 80).length;
  const needAttention = students.filter((s) => getCompletionRate(s) < 60).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading student progress...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-foreground">Student Progress</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Student Name</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Email</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Department</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Submitted</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Completion %</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Avg Marks</th>
                <th className="px-6 py-4 text-left text-foreground" style={{ fontWeight: 600 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              ) : filteredStudents.map((student) => {
                const rate = getCompletionRate(student);
                return (
                  <tr key={student.student_id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground" style={{ fontWeight: 600 }}>
                      {student.student_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.department}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.submitted} / {student.total_assignments}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[100px] flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-success" style={{ width: `${rate}%` }} />
                        </div>
                        <span className={getCompletionColor(rate)} style={{ fontWeight: 600 }}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.average_marks != null ? student.average_marks : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {rate >= 60 ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-error" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Average Completion Rate</p>
          <p className="text-3xl text-success" style={{ fontWeight: 700 }}>{avgCompletion}%</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Students Above 80%</p>
          <p className="text-3xl text-accent-primary" style={{ fontWeight: 700 }}>
            {above80} / {students.length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <p className="text-muted-foreground mb-2">Students Need Attention</p>
          <p className="text-3xl text-error" style={{ fontWeight: 700 }}>{needAttention}</p>
        </div>
      </div>
    </div>
  );
};
