from datetime import datetime, timezone

from flask import Blueprint, request, g

from ..extensions import db
from ..models.assignment import Assignment
from ..models.submission import Submission
from ..models.user import User
from ..models.notification import Notification
from ..utils import success, error
from ..middleware.auth import role_required

staff_bp = Blueprint("staff", __name__)


@staff_bp.get("/courses")
@role_required("staff")
def list_courses():
    from ..models.course import Course
    staff = g.current_user
    courses = Course.query.filter_by(staff_id=staff.id).all()
    return success([c.to_dict() for c in courses])


@staff_bp.post("/assignments")
@role_required("staff")
def create_assignment():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    course_id = data.get("course_id")
    due_date_str = data.get("due_date")

    if not title or not description or not course_id or not due_date_str:
        return error("title, description, course_id and due_date are required", 400)

    try:
        due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return error("Invalid due_date format. Use ISO 8601.", 400)

    staff = g.current_user
    assignment = Assignment(
        title=title,
        description=description,
        course_id=course_id,
        staff_id=staff.id,
        due_date=due_date,
    )
    db.session.add(assignment)
    db.session.commit()

    # Notify students in the batch associated with this course
    from ..models.course import BatchCourse
    from ..models.batch import Batch

    batch_ids = [bc.batch_id for bc in BatchCourse.query.filter_by(course_id=course_id).all()]
    students = User.query.filter(
        User.role == "student", User.batch_id.in_(batch_ids)
    ).all()
    for student in students:
        notif = Notification(
            user_id=student.id,
            type="assignment",
            title="New Assignment",
            message=f"New assignment '{title}' has been posted.",
            icon_key="BookOpen",
        )
        db.session.add(notif)
    db.session.commit()

    return success(assignment.to_dict(), "Assignment created", 201)


@staff_bp.get("/assignments")
@role_required("staff")
def list_assignments():
    staff = g.current_user
    assignments = Assignment.query.filter_by(staff_id=staff.id).order_by(Assignment.created_at.desc()).all()
    result = []
    for a in assignments:
        item = a.to_dict()
        item["submission_count"] = Submission.query.filter_by(assignment_id=a.id).count()
        result.append(item)
    return success(result)


@staff_bp.get("/assignments/<string:assignment_id>")
@role_required("staff")
def get_assignment(assignment_id):
    staff = g.current_user
    assignment = Assignment.query.filter_by(id=assignment_id, staff_id=staff.id).first()
    if not assignment:
        return error("Assignment not found", 404)
    data = assignment.to_dict()
    data["submissions"] = [s.to_dict() for s in assignment.submissions]
    return success(data)


@staff_bp.put("/assignments/<string:assignment_id>")
@role_required("staff")
def update_assignment(assignment_id):
    staff = g.current_user
    assignment = Assignment.query.filter_by(id=assignment_id, staff_id=staff.id).first()
    if not assignment:
        return error("Assignment not found", 404)

    data = request.get_json() or {}
    if "title" in data:
        assignment.title = data["title"].strip()
    if "description" in data:
        assignment.description = data["description"].strip()
    if "due_date" in data:
        try:
            assignment.due_date = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return error("Invalid due_date format", 400)

    db.session.commit()
    return success(assignment.to_dict(), "Assignment updated")


@staff_bp.delete("/assignments/<string:assignment_id>")
@role_required("staff")
def delete_assignment(assignment_id):
    staff = g.current_user
    assignment = Assignment.query.filter_by(id=assignment_id, staff_id=staff.id).first()
    if not assignment:
        return error("Assignment not found", 404)
    db.session.delete(assignment)
    db.session.commit()
    return success(message="Assignment deleted")


@staff_bp.get("/submissions")
@role_required("staff")
def list_submissions():
    staff = g.current_user
    assignment_ids = [a.id for a in Assignment.query.filter_by(staff_id=staff.id).all()]
    status_filter = request.args.get("status")

    query = Submission.query.filter(Submission.assignment_id.in_(assignment_ids))
    if status_filter:
        query = query.filter_by(status=status_filter)

    submissions = query.order_by(Submission.created_at.desc()).all()
    return success([s.to_dict() for s in submissions])


@staff_bp.post("/submissions/<string:submission_id>/evaluate")
@role_required("staff")
def evaluate_submission(submission_id):
    staff = g.current_user
    submission = Submission.query.get(submission_id)
    if not submission:
        return error("Submission not found", 404)

    # Verify this submission belongs to one of staff's assignments
    assignment = Assignment.query.filter_by(
        id=submission.assignment_id, staff_id=staff.id
    ).first()
    if not assignment:
        return error("Forbidden", 403)

    data = request.get_json() or {}
    marks = data.get("marks")
    feedback = (data.get("feedback") or "").strip()

    if marks is None:
        return error("marks is required", 400)
    try:
        marks = float(marks)
    except (ValueError, TypeError):
        return error("marks must be a number", 400)

    submission.marks = marks
    submission.feedback = feedback
    submission.status = "evaluated"
    submission.evaluated_at = datetime.now(timezone.utc)

    # Notify the student
    notif = Notification(
        user_id=submission.student_id,
        type="evaluated",
        title="Assignment Evaluated",
        message=f"Your submission for '{assignment.title}' has been evaluated. Marks: {marks}",
        icon_key="CheckCircle",
    )
    db.session.add(notif)
    db.session.commit()

    return success(submission.to_dict(), "Evaluation submitted")


@staff_bp.get("/students/progress")
@role_required("staff")
def student_progress():
    staff = g.current_user
    assignment_ids = [a.id for a in Assignment.query.filter_by(staff_id=staff.id).all()]

    # Get all students who have submissions for this staff's assignments
    from ..models.course import Course, BatchCourse

    course_ids = list({a.course_id for a in Assignment.query.filter_by(staff_id=staff.id).all()})
    batch_ids = list({bc.batch_id for bc in BatchCourse.query.filter(BatchCourse.course_id.in_(course_ids)).all()})
    students = User.query.filter(User.role == "student", User.batch_id.in_(batch_ids)).all()

    result = []
    for student in students:
        subs = Submission.query.filter(
            Submission.student_id == student.id,
            Submission.assignment_id.in_(assignment_ids),
        ).all()
        submitted = sum(1 for s in subs if s.status in ("submitted", "evaluated"))
        evaluated = sum(1 for s in subs if s.status == "evaluated")
        marks = [s.marks for s in subs if s.marks is not None]
        avg = round(sum(marks) / len(marks), 1) if marks else None

        result.append({
            "student_id": student.id,
            "student_name": student.name,
            "email": student.email,
            "department": student.department,
            "batch_id": student.batch_id,
            "total_assignments": len(assignment_ids),
            "submitted": submitted,
            "evaluated": evaluated,
            "average_marks": avg,
        })

    return success(result)


@staff_bp.get("/dashboard")
@role_required("staff")
def dashboard():
    staff = g.current_user
    assignments = Assignment.query.filter_by(staff_id=staff.id).all()
    assignment_ids = [a.id for a in assignments]

    submissions = Submission.query.filter(
        Submission.assignment_id.in_(assignment_ids)
    ).all()

    total_assignments = len(assignments)
    total_submissions = len(submissions)
    pending_eval = sum(1 for s in submissions if s.status == "submitted")
    evaluated = sum(1 for s in submissions if s.status == "evaluated")

    # Submissions per assignment for chart
    from collections import Counter
    sub_counts = Counter(s.assignment_id for s in submissions)
    chart_data = [
        {"assignment": a.title[:30], "submissions": sub_counts.get(a.id, 0)}
        for a in assignments[:10]
    ]

    # Status distribution pie
    status_dist = [
        {"name": "Draft", "value": sum(1 for s in submissions if s.status == "draft")},
        {"name": "Submitted", "value": sum(1 for s in submissions if s.status == "submitted")},
        {"name": "Evaluated", "value": evaluated},
    ]

    return success({
        "stats": {
            "total_assignments": total_assignments,
            "total_submissions": total_submissions,
            "pending_evaluation": pending_eval,
            "evaluated": evaluated,
        },
        "chart_data": chart_data,
        "status_distribution": status_dist,
    })
