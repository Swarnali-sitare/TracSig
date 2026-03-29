from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from flask import Blueprint, g, jsonify, request

from app.decorators import require_roles
from app.errors import ApiError
from app.extensions import db
from app.models import Assignment, BatchCourse, Course, Submission, User
from app.services.assignment_helpers import eligible_students_for_course, submitted_count_for_assignment
from app.services.dashboards import staff_dashboard
from app.services.notify import create_notification

staff_bp = Blueprint("staff", __name__)


@staff_bp.get("/courses")
@require_roles("Staff")
def my_courses():
    courses = Course.query.filter_by(staff_id=g.current_user.id).all()
    return jsonify(
        {
            "items": [
                {
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "department": c.department,
                    "credits": c.credits,
                }
                for c in courses
            ]
        }
    )


@staff_bp.post("/assignments")
@require_roles("Staff")
def create_assignment():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    course_id = data.get("course_id")
    due_raw = data.get("due_date") or ""
    if not title or not description or course_id is None or not due_raw:
        raise ApiError("VALIDATION_ERROR", "title, description, course_id, due_date are required", 422)
    try:
        due_date = date.fromisoformat(str(due_raw)[:10])
    except ValueError as e:
        raise ApiError("VALIDATION_ERROR", "Invalid due_date", 422) from e
    if due_date < date.today():
        raise ApiError("VALIDATION_ERROR", "Due date must be today or in the future", 422)
    course = db.session.get(Course, int(course_id))
    if not course or course.staff_id != g.current_user.id:
        raise ApiError("FORBIDDEN", "You can only create assignments for your own courses", 403)
    a = Assignment(
        title=title,
        description=description,
        course_id=course.id,
        staff_id=g.current_user.id,
        due_date=due_date,
    )
    db.session.add(a)
    db.session.flush()
    batch_ids = [r.batch_id for r in BatchCourse.query.filter_by(course_id=course.id).all()]
    for bid in batch_ids:
        for stu in User.query.filter_by(role="Student", batch_id=bid).all():
            create_notification(
                stu.id,
                "assignment",
                "New assignment",
                f"{title} posted in {course.code}",
                "bell",
            )
    db.session.commit()
    return jsonify({"id": a.id}), 201


@staff_bp.get("/assignments")
@require_roles("Staff")
def list_assignments():
    rows = Assignment.query.filter_by(staff_id=g.current_user.id).order_by(Assignment.due_date.desc()).all()
    return jsonify(
        {
            "items": [
                {
                    "id": a.id,
                    "title": a.title,
                    "course_id": a.course_id,
                    "course_code": a.course.code,
                    "due_date": a.due_date.isoformat(),
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in rows
            ]
        }
    )


@staff_bp.get("/assignments/<int:aid>")
@require_roles("Staff")
def get_assignment(aid: int):
    a = Assignment.query.filter_by(id=aid, staff_id=g.current_user.id).first()
    if not a:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    return jsonify(
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "course_id": a.course_id,
            "course_code": a.course.code,
            "due_date": a.due_date.isoformat(),
            "students": eligible_students_for_course(a.course_id),
            "submissions": submitted_count_for_assignment(a.id),
        }
    )


@staff_bp.put("/assignments/<int:aid>")
@require_roles("Staff")
def update_assignment(aid: int):
    a = Assignment.query.filter_by(id=aid, staff_id=g.current_user.id).first()
    if not a:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    data = request.get_json(silent=True) or {}
    if "course_id" in data and int(data["course_id"]) != a.course_id:
        if Submission.query.filter_by(assignment_id=a.id).first():
            raise ApiError("CONFLICT", "Cannot change course when submissions exist", 409)
    if "title" in data and data["title"]:
        a.title = str(data["title"]).strip()
    if "description" in data and data["description"] is not None:
        a.description = str(data["description"]).strip()
    if "course_id" in data:
        cid = int(data["course_id"])
        c = db.session.get(Course, cid)
        if not c or c.staff_id != g.current_user.id:
            raise ApiError("FORBIDDEN", "Invalid course", 403)
        a.course_id = cid
    if "due_date" in data and data["due_date"]:
        try:
            a.due_date = date.fromisoformat(str(data["due_date"])[:10])
        except ValueError as e:
            raise ApiError("VALIDATION_ERROR", "Invalid due_date", 422) from e
    db.session.commit()
    return jsonify({"ok": True})


@staff_bp.delete("/assignments/<int:aid>")
@require_roles("Staff")
def delete_assignment(aid: int):
    a = Assignment.query.filter_by(id=aid, staff_id=g.current_user.id).first()
    if not a:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    db.session.delete(a)
    db.session.commit()
    return "", 204


@staff_bp.get("/submissions")
@require_roles("Staff")
def list_submissions():
    aids = [a.id for a in Assignment.query.filter_by(staff_id=g.current_user.id).all()]
    if not aids:
        return jsonify({"items": []})
    subs = (
        Submission.query.filter(Submission.assignment_id.in_(aids), Submission.status != "draft")
        .order_by(Submission.submitted_at.desc().nulls_last())
        .all()
    )
    items = []
    for s in subs:
        stu = db.session.get(User, s.student_id)
        a = s.assignment
        items.append(
            {
                "id": s.id,
                "student_name": stu.full_name if stu else "",
                "assignment_title": a.title if a else "",
                "course_code": a.course.code if a and a.course else "",
                "submitted_on": s.submitted_at.date().isoformat() if s.submitted_at else None,
                "due_date": a.due_date.isoformat() if a else None,
                "evaluation_status": "evaluated" if s.status == "evaluated" else "pending",
                "marks": s.marks,
                "content": (s.content or "")[:2000],
            }
        )
    return jsonify({"items": items})


@staff_bp.post("/submissions/<int:sid>/evaluate")
@require_roles("Staff")
def evaluate_submission(sid: int):
    s = db.session.get(Submission, sid)
    if not s or s.status == "draft":
        raise ApiError("NOT_FOUND", "Submission not found", 404)
    a = s.assignment
    if not a or a.staff_id != g.current_user.id:
        raise ApiError("FORBIDDEN", "Not your assignment", 403)
    if date.today() < a.due_date:
        raise ApiError("FORBIDDEN", "Cannot evaluate before due date", 403)
    data = request.get_json(silent=True) or {}
    marks = data.get("marks")
    feedback = (data.get("feedback") or "").strip()
    try:
        marks_int = int(marks)
    except (TypeError, ValueError) as e:
        raise ApiError("VALIDATION_ERROR", "marks must be 0-100", 422) from e
    if marks_int < 0 or marks_int > 100 or not feedback:
        raise ApiError("VALIDATION_ERROR", "Valid marks (0-100) and feedback are required", 422)
    s.marks = marks_int
    s.feedback = feedback
    s.status = "evaluated"
    s.evaluated_at = datetime.now(timezone.utc)
    create_notification(
        s.student_id,
        "evaluation",
        "Assignment evaluated",
        f"Your submission for {a.title} has been evaluated",
        "check",
    )
    db.session.commit()
    return jsonify({"ok": True})


@staff_bp.get("/students/progress")
@require_roles("Staff")
def students_progress():
    course_filter = request.args.get("course") or "all"
    my_courses = Course.query.filter_by(staff_id=g.current_user.id).all()
    codes = {c.code: c for c in my_courses}
    if course_filter != "all" and course_filter not in codes:
        return jsonify({"items": [], "summary": _empty_summary()})
    target_courses = [codes[course_filter]] if course_filter != "all" else my_courses

    student_ids: set[int] = set()
    for c in target_courses:
        for bc in BatchCourse.query.filter_by(course_id=c.id).all():
            for u in User.query.filter_by(role="Student", batch_id=bc.batch_id).all():
                student_ids.add(u.id)

    items = []
    now = date.today()
    week_ago = now - timedelta(days=7)
    prev_start = now - timedelta(days=14)

    for uid in student_ids:
        stu = db.session.get(User, uid)
        if not stu:
            continue
        for c in target_courses:
            assignments = Assignment.query.filter_by(course_id=c.id).all()
            total = len(assignments)
            submitted = 0
            last_act = None
            recent = 0
            prev = 0
            for a in assignments:
                sub = Submission.query.filter_by(assignment_id=a.id, student_id=uid).first()
                if sub and sub.status in ("submitted", "evaluated"):
                    submitted += 1
                    if sub.submitted_at:
                        d = sub.submitted_at.date()
                        if last_act is None or d > last_act:
                            last_act = d
                        if d >= week_ago:
                            recent += 1
                        if prev_start <= d < week_ago:
                            prev += 1
            if total == 0:
                continue
            rate = round(100.0 * submitted / total)
            trend = "up" if recent >= prev else "down"
            batch_label = stu.batch.year_label if stu.batch else ""
            items.append(
                {
                    "student_id": stu.id,
                    "name": stu.full_name,
                    "batch": batch_label,
                    "course_code": c.code,
                    "assignments_submitted": submitted,
                    "total_assignments": total,
                    "completion_rate": rate,
                    "last_activity": last_act.isoformat() if last_act else "",
                    "trend": trend,
                }
            )

    summary = _progress_summary(items)
    return jsonify({"items": items, "summary": summary})


def _empty_summary():
    return {
        "average_completion_rate": 0,
        "students_above_80_percent": 0,
        "students_total": 0,
        "students_need_attention": 0,
    }


def _progress_summary(items: list) -> dict:
    if not items:
        return _empty_summary()
    rates = [i["completion_rate"] for i in items]
    avg = round(sum(rates) / len(rates)) if rates else 0
    above = sum(1 for r in rates if r >= 80)
    need = sum(1 for r in rates if r < 60)
    return {
        "average_completion_rate": avg,
        "students_above_80_percent": above,
        "students_total": len(set(i["student_id"] for i in items)),
        "students_need_attention": need,
    }


@staff_bp.get("/dashboard")
@require_roles("Staff")
def dashboard():
    return jsonify(staff_dashboard(g.current_user))
