import { useState } from "react";
import { Search, Eye, Edit, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const EvaluateAssignments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  const submissions = [
    {
      id: 1,
      studentName: "Alice Johnson",
      assignmentTitle: "Data Structures Project",
      course: "CS201",
      submittedOn: "2026-03-10",
      dueDate: "2026-03-10",
      status: "evaluated",
      marks: 85,
      content: "Implementation of binary search tree with complete documentation and test cases...",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      assignmentTitle: "Web Development Assignment",
      course: "CS301",
      submittedOn: "2026-03-12",
      dueDate: "2026-03-12",
      status: "pending",
      marks: null,
      content: "Created a responsive web application using React and Tailwind CSS...",
    },
    {
      id: 3,
      studentName: "Charlie Brown",
      assignmentTitle: "Algorithm Analysis",
      course: "CS201",
      submittedOn: "2026-03-14",
      dueDate: "2026-03-10",
      status: "pending",
      marks: null,
      content: "Analyzed time complexity of various sorting algorithms with examples...",
    },
  ];

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEvaluate = (submissionId: number) => {
    if (!marks || isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) {
      toast.error("Please enter valid marks (0-100)");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    toast.success("Assignment evaluated successfully!");
    setSelectedSubmission(null);
    setMarks("");
    setFeedback("");
  };

  const canEvaluate = (dueDate: string) => {
    const today = new Date("2026-03-15");
    const due = new Date(dueDate);
    return today >= due;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="mb-6 text-[#1F2937]">Evaluate Assignments</h1>

      {/* Search */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.1)] mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Student Name
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Assignment
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Course
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Submitted On
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Marks
                </th>
                <th className="px-6 py-4 text-left text-[#1F2937]" style={{ fontWeight: 600 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                const canEval = canEvaluate(submission.dueDate);
                return (
                  <tr
                    key={submission.id}
                    className="border-b border-[rgba(0,0,0,0.1)] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4 text-[#1F2937]" style={{ fontWeight: 600 }}>
                      {submission.studentName}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{submission.assignmentTitle}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#EEF2FF] text-[#2563EB] rounded-full text-sm">
                        {submission.course}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{submission.submittedOn}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          submission.status === "evaluated"
                            ? "bg-[#F0FDF4] text-[#22C55E]"
                            : "bg-[#FFFBEB] text-[#F59E0B]"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#1F2937]">
                      {submission.marks !== null ? `${submission.marks}/100` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission.id)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                          title="View submission"
                        >
                          <Eye className="w-4 h-4 text-[#2563EB]" />
                        </button>
                        {canEval ? (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission.id);
                              if (submission.marks !== null) {
                                setMarks(submission.marks.toString());
                              }
                            }}
                            className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                            title={submission.status === "evaluated" ? "Edit evaluation" : "Evaluate"}
                          >
                            {submission.status === "evaluated" ? (
                              <Edit className="w-4 h-4 text-[#F59E0B]" />
                            ) : (
                              <Check className="w-4 h-4 text-[#22C55E]" />
                            )}
                          </button>
                        ) : (
                          <div
                            className="p-2 text-[#6B7280]"
                            title="Cannot evaluate before due date"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal */}
      {selectedSubmission !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(0,0,0,0.1)]">
              <h2 className="text-[#1F2937]">Evaluate Submission</h2>
            </div>

            {(() => {
              const submission = submissions.find((s) => s.id === selectedSubmission);
              if (!submission) return null;

              return (
                <>
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="mb-2 text-[#1F2937]">{submission.assignmentTitle}</h3>
                      <div className="flex gap-4 text-sm text-[#6B7280]">
                        <span>Student: {submission.studentName}</span>
                        <span>Course: {submission.course}</span>
                        <span>Submitted: {submission.submittedOn}</span>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-lg mb-6">
                      <h4 className="mb-2 text-[#1F2937]">Submission Content</h4>
                      <p className="text-[#6B7280]">{submission.content}</p>
                    </div>

                    {canEvaluate(submission.dueDate) ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-[#1F2937]">
                            Marks (out of 100) <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
                            placeholder="Enter marks"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-[#1F2937]">
                            Feedback <span className="text-[#EF4444]">*</span>
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors resize-none"
                            placeholder="Provide detailed feedback..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[#F59E0B]" style={{ fontWeight: 600 }}>
                            Evaluation Not Available
                          </p>
                          <p className="text-sm text-[#92400E] mt-1">
                            You can only evaluate assignments after the due date has passed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-[rgba(0,0,0,0.1)] flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setSelectedSubmission(null);
                        setMarks("");
                        setFeedback("");
                      }}
                      className="px-6 py-3 bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                    >
                      Cancel
                    </button>
                    {canEvaluate(submission.dueDate) && (
                      <button
                        onClick={() => handleEvaluate(submission.id)}
                        className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
                      >
                        Submit Evaluation
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
