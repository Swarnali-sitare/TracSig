from datetime import datetime, timezone

from flask import Blueprint, request, g

from ..extensions import db
from ..models.assignment import Assignment
from ..models.submission import Submission
from ..models.course import Course, BatchCourse
from ..models.notification import Notification
from ..utils import success, error
from ..middleware.auth import role_required

student_bp = Blueprint("student", __name__)


def _get_student_assignments(student):
    """Return assignments for the student's batch courses."""
    batch_id = student.batch_id
    if not batch_id:
        # Fall back to all assignments for now
        assignments = Assignment.query.all()
    else:
        batch_course_ids = [
            bc.course_id
            for bc in BatchCourse.query.filter_by(batch_id=batch_id).all()
        ]
        assignments = Assignment.query.filter(
            Assignment.course_id.in_(batch_course_ids)
        ).all()
    return assignments


@student_bp.get("/assignments")
@role_required("student")
def list_assignments():
    student = g.current_user
    status_filter = request.args.get("status")

    assignments = _get_student_assignments(student)

    result = []
    for a in assignments:
        sub = Submission.query.filter_by(
            assignment_id=a.id, student_id=student.id
        ).first()
        item = a.to_dict()
        item["submission_status"] = sub.status if sub else "not_started"
        item["marks"] = sub.marks if sub else None
        item["submission_id"] = sub.id if sub else None
        if status_filter and item["submission_status"] != status_filter:
            continue
        result.append(item)

    return success(result)


@student_bp.get("/assignments/<string:assignment_id>")
@role_required("student")
def get_assignment(assignment_id):
    student = g.current_user
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return error("Assignment not found", 404)

    sub = Submission.query.filter_by(
        assignment_id=assignment_id, student_id=student.id
    ).first()

    data = assignment.to_dict()
    data["submission"] = sub.to_dict() if sub else None
    return success(data)


@student_bp.post("/assignments/<string:assignment_id>/draft")
@role_required("student")
def save_draft(assignment_id):
    student = g.current_user
    data = request.get_json() or {}
    content = data.get("content", "")

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return error("Assignment not found", 404)

    sub = Submission.query.filter_by(
        assignment_id=assignment_id, student_id=student.id
    ).first()

    if sub and sub.status == "submitted":
        return error("Already submitted, cannot save as draft", 400)
    if sub and sub.status == "evaluated":
        return error("Already evaluated, cannot modify", 400)

    if not sub:
        sub = Submission(
            assignment_id=assignment_id,
            student_id=student.id,
            content=content,
            status="draft",
        )
        db.session.add(sub)
    else:
        sub.content = content
        sub.updated_at = datetime.now(timezone.utc)

    db.session.commit()
    return success(sub.to_dict(), "Draft saved")


@student_bp.post("/assignments/<string:assignment_id>/submit")
@role_required("student")
def submit_assignment(assignment_id):
    student = g.current_user
    data = request.get_json() or {}
    content = data.get("content", "")

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return error("Assignment not found", 404)

    now = datetime.now(timezone.utc)

    sub = Submission.query.filter_by(
        assignment_id=assignment_id, student_id=student.id
    ).first()

    if sub and sub.status in ("submitted", "evaluated"):
        return error("Assignment already submitted", 400)

    if not sub:
        sub = Submission(
            assignment_id=assignment_id,
            student_id=student.id,
            content=content,
            status="submitted",
            submitted_at=now,
        )
        db.session.add(sub)
    else:
        sub.content = content
        sub.status = "submitted"
        sub.submitted_at = now

    # Notify the staff
    notif = Notification(
        user_id=assignment.staff_id,
        type="submitted",
        title="New Submission",
        message=f"{student.name} submitted '{assignment.title}'",
        icon_key="Send",
    )
    db.session.add(notif)
    db.session.commit()
    return success(sub.to_dict(), "Assignment submitted successfully")


@student_bp.get("/submissions")
@role_required("student")
def list_submissions():
    student = g.current_user
    subs = (
        Submission.query.filter_by(student_id=student.id)
        .order_by(Submission.created_at.desc())
        .all()
    )
    return success([s.to_dict() for s in subs])


@student_bp.get("/dashboard")
@role_required("student")
def dashboard():
    student = g.current_user
    assignments = _get_student_assignments(student)
    assignment_ids = [a.id for a in assignments]

    submissions = Submission.query.filter(
        Submission.student_id == student.id,
        Submission.assignment_id.in_(assignment_ids),
    ).all()

    total = len(assignments)
    submitted_count = sum(1 for s in submissions if s.status in ("submitted", "evaluated"))
    evaluated_count = sum(1 for s in submissions if s.status == "evaluated")
    pending_count = total - submitted_count

    marks_list = [s.marks for s in submissions if s.marks is not None]
    avg_marks = round(sum(marks_list) / len(marks_list), 1) if marks_list else 0

    # Monthly submission data for chart (last 6 months)
    from collections import defaultdict
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    monthly = defaultdict(lambda: {"submitted": 0, "evaluated": 0})
    for s in submissions:
        if s.submitted_at:
            month_key = s.submitted_at.strftime("%b")
            if s.status == "evaluated":
                monthly[month_key]["evaluated"] += 1
            else:
                monthly[month_key]["submitted"] += 1

    months = []
    for i in range(5, -1, -1):
        m = (now.replace(day=1) - timedelta(days=i * 28))
        key = m.strftime("%b")
        months.append({"month": key, **monthly.get(key, {"submitted": 0, "evaluated": 0})})

    return success({
        "stats": {
            "total_assignments": total,
            "submitted": submitted_count,
            "evaluated": evaluated_count,
            "pending": pending_count,
            "average_marks": avg_marks,
        },
        "chart_data": months,
        "recent_submissions": [s.to_dict() for s in sorted(submissions, key=lambda x: x.created_at, reverse=True)[:5]],
    })
