from __future__ import annotations

from datetime import date, datetime, timezone

from app.models import Assignment, Submission


def record_status(sub: Submission | None) -> str:
    if sub is None or sub.status == "draft":
        return "pending"
    return "completed"


def display_status(due: date, sub: Submission | None) -> str:
    st = sub.status if sub else None
    if st in ("submitted", "evaluated"):
        return "Completed"
    today = date.today()
    if due >= today:
        return "Pending"
    return "Incomplete"


def student_course_ids(batch_id: int | None) -> list[int]:
    if not batch_id:
        return []
    from app.models import Enrollment

    rows = Enrollment.query.filter_by(batch_id=batch_id).all()
    return [r.course_id for r in rows]


def assignments_for_student(batch_id: int | None) -> list[Assignment]:
    cids = student_course_ids(batch_id)
    if not cids:
        return []
    return Assignment.query.filter(Assignment.course_id.in_(cids)).order_by(Assignment.due_date.asc()).all()


def ensure_past_due_auto_submit(a: Assignment, student_id: int) -> Submission | None:
    """
    After due date: draft submissions become submitted as-is with auto_submitted=True.
    No row => still None (Incomplete). Already submitted/evaluated => unchanged.
    """
    from app.extensions import db

    if a.due_date >= date.today():
        return Submission.query.filter_by(assignment_id=a.id, student_id=student_id).first()

    sub = Submission.query.filter_by(assignment_id=a.id, student_id=student_id).first()
    if sub is None:
        return None
    if sub.status in ("submitted", "evaluated"):
        return sub
    if sub.status == "draft":
        sub.status = "submitted"
        sub.submitted_at = datetime.now(timezone.utc)
        sub.auto_submitted = True
        db.session.flush()
    return sub


def get_or_create_submission(assignment_id: int, student_id: int) -> Submission:
    from app.extensions import db

    sub = Submission.query.filter_by(assignment_id=assignment_id, student_id=student_id).first()
    if sub is None:
        sub = Submission(assignment_id=assignment_id, student_id=student_id, status="draft", content="")
        db.session.add(sub)
        db.session.flush()
    return sub


def eligible_students_for_course(course_id: int) -> int:
    from sqlalchemy import func, select

    from app.extensions import db
    from app.models import Enrollment, User

    batch_ids = db.session.scalars(select(Enrollment.batch_id).where(Enrollment.course_id == course_id)).all()
    if not batch_ids:
        return 0
    return (
        db.session.scalar(
            select(func.count()).select_from(User).where(User.role == "Student", User.batch_id.in_(batch_ids))
        )
        or 0
    )


def submitted_count_for_assignment(assignment_id: int) -> int:
    from sqlalchemy import func, select

    from app.extensions import db
    from app.models import Submission

    return (
        db.session.scalar(
            select(func.count()).where(
                Submission.assignment_id == assignment_id,
                Submission.status.in_(("submitted", "evaluated")),
            )
        )
        or 0
    )


def serialize_student_assignment_row(a: Assignment, sub: Submission | None) -> dict:
    course = a.course
    rs = record_status(sub)
    ds = display_status(a.due_date, sub)
    submitted_on = None
    if sub and sub.submitted_at:
        submitted_on = sub.submitted_at.date().isoformat()
    return {
        "id": a.id,
        "title": a.title,
        "course_code": course.code if course else "",
        "due_date": a.due_date.isoformat(),
        "record_status": rs,
        "submitted_on": submitted_on,
        "description": a.description,
        "display_status": ds,
        "submission_status": sub.status if sub else None,
        "auto_submitted": bool(sub and getattr(sub, "auto_submitted", False)),
        "attachments_enabled": bool(getattr(a, "attachments_enabled", False)),
        "min_upload_bytes": a.min_upload_bytes,
        "max_upload_bytes": a.max_upload_bytes,
    }
