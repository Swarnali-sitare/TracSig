from __future__ import annotations

from datetime import date, datetime, timezone

from flask import Blueprint, g, jsonify, request

from sqlalchemy.orm import joinedload

from app.decorators import require_roles
from app.errors import ApiError
from app.extensions import db
from app.models import Assignment, Submission, SubmissionAttachment
from app.services.assignment_helpers import (
    assignments_for_student,
    display_status,
    ensure_past_due_auto_submit,
    get_or_create_submission,
    serialize_student_assignment_row,
)
from app.services.dashboards import student_dashboard
from app.services.notify import create_notification
from app.services.submission_attachments import (
    delete_submission_attachment_for_student,
    save_upload_for_submission,
    serialize_attachment,
)

student_bp = Blueprint("student", __name__)


@student_bp.get("/assignments")
@require_roles("Student")
def list_assignments():
    scope = (request.args.get("scope") or "active").lower()
    today = date.today()
    items = assignments_for_student(g.current_user.batch_id)
    for a in items:
        ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    out = []
    for a in items:
        if scope == "active" and a.due_date < today:
            continue
        if scope == "closed" and a.due_date >= today:
            continue
        sub = Submission.query.filter_by(assignment_id=a.id, student_id=g.current_user.id).first()
        out.append(serialize_student_assignment_row(a, sub))
    return jsonify({"items": out})


@student_bp.get("/assignments/<int:aid>")
@require_roles("Student")
def get_assignment(aid: int):
    items = {a.id: a for a in assignments_for_student(g.current_user.batch_id)}
    a = items.get(aid)
    if not a:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    sub = (
        Submission.query.options(joinedload(Submission.attachment_rows))
        .filter_by(assignment_id=aid, student_id=g.current_user.id)
        .first()
    )
    row = serialize_student_assignment_row(a, sub)
    content = ""
    if sub:
        if sub.status in ("submitted", "evaluated"):
            content = sub.content or ""
        else:
            content = sub.content or ""
    row["is_submitted"] = bool(sub and sub.status in ("submitted", "evaluated"))
    row["content"] = content
    row["marks"] = sub.marks if sub else None
    row["feedback"] = sub.feedback if sub else None
    row["attachments"] = (
        [serialize_attachment(x) for x in sub.attachment_rows]
        if sub
        else []
    )
    row["submission_id"] = sub.id if sub else None
    return jsonify(row)


@student_bp.post("/assignments/<int:aid>/draft")
@require_roles("Student")
def save_draft(aid: int):
    items = {a.id: a for a in assignments_for_student(g.current_user.batch_id)}
    if aid not in items:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    a = items[aid]
    ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    if a.due_date < date.today():
        raise ApiError("FORBIDDEN", "The due date has passed; this assignment is closed.", 403)
    data = request.get_json(silent=True) or {}
    content = data.get("content")
    if content is not None and len(str(content)) > 2 * 1024 * 1024:
        raise ApiError("VALIDATION_ERROR", "Content too large", 422)
    sub = get_or_create_submission(aid, g.current_user.id)
    if sub.status in ("submitted", "evaluated"):
        raise ApiError("CONFLICT", "Cannot modify draft after submit", 409)
    sub.status = "draft"
    sub.content = str(content) if content is not None else sub.content
    db.session.commit()
    return jsonify({"ok": True})


@student_bp.post("/assignments/<int:aid>/attachments")
@require_roles("Student")
def upload_assignment_attachment(aid: int):
    items = {a.id: a for a in assignments_for_student(g.current_user.batch_id)}
    if aid not in items:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    a = items[aid]
    ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    if a.due_date < date.today():
        raise ApiError("FORBIDDEN", "The due date has passed; this assignment is closed.", 403)
    if "file" not in request.files or not request.files["file"] or not request.files["file"].filename:
        raise ApiError("VALIDATION_ERROR", "file is required", 422)
    sub = get_or_create_submission(aid, g.current_user.id)
    att = save_upload_for_submission(assignment=a, submission=sub, file_storage=request.files["file"])
    db.session.commit()
    payload = serialize_attachment(att)
    payload["submission_id"] = sub.id
    return jsonify(payload), 201


@student_bp.delete("/assignments/<int:aid>/attachments/<int:att_id>")
@require_roles("Student")
def delete_assignment_attachment(aid: int, att_id: int):
    items = {a.id: a for a in assignments_for_student(g.current_user.batch_id)}
    if aid not in items:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    a = items[aid]
    ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    if a.due_date < date.today():
        raise ApiError("FORBIDDEN", "The due date has passed; this assignment is closed.", 403)
    sub = Submission.query.filter_by(assignment_id=aid, student_id=g.current_user.id).first()
    if not sub:
        raise ApiError("NOT_FOUND", "Attachment not found", 404)
    att = SubmissionAttachment.query.filter_by(id=att_id, submission_id=sub.id).first()
    if not att:
        raise ApiError("NOT_FOUND", "Attachment not found", 404)
    delete_submission_attachment_for_student(assignment=a, submission=sub, att=att)
    db.session.commit()
    return "", 204


@student_bp.post("/assignments/<int:aid>/submit")
@require_roles("Student")
def submit_assignment(aid: int):
    items = {a.id: a for a in assignments_for_student(g.current_user.batch_id)}
    if aid not in items:
        raise ApiError("NOT_FOUND", "Assignment not found", 404)
    a = items[aid]
    ensure_past_due_auto_submit(a, g.current_user.id)
    db.session.commit()
    if a.due_date < date.today():
        raise ApiError("FORBIDDEN", "The due date has passed; you cannot submit or edit this assignment.", 403)
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    sub = get_or_create_submission(aid, g.current_user.id)
    has_files = SubmissionAttachment.query.filter_by(submission_id=sub.id).count() > 0
    if not content and not (a.attachments_enabled and has_files):
        raise ApiError(
            "VALIDATION_ERROR",
            "Enter a written submission or upload at least one file, as required by this assignment.",
            422,
        )
    if len(content) > 2 * 1024 * 1024:
        raise ApiError("VALIDATION_ERROR", "Content too large", 422)
    if sub.status in ("submitted", "evaluated"):
        raise ApiError("CONFLICT", "Already submitted", 409)
    sub.content = content
    sub.status = "submitted"
    sub.submitted_at = datetime.now(timezone.utc)
    sub.auto_submitted = False
    a = db.session.get(Assignment, aid)
    if a:
        create_notification(
            a.staff_id,
            "submission",
            "New submission",
            f"{g.current_user.full_name} submitted {a.title}",
            "check",
        )
    db.session.commit()
    return jsonify({"ok": True})


@student_bp.get("/dashboard")
@require_roles("Student")
def dashboard():
    return jsonify(student_dashboard(g.current_user))


@student_bp.get("/submissions")
@require_roles("Student")
def submissions_history():
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    q = (
        Submission.query.filter(
            Submission.student_id == g.current_user.id,
            Submission.status.in_(("submitted", "evaluated")),
        )
        .order_by(Submission.submitted_at.desc().nullslast())
    )
    total = q.count()
    rows = q.offset(offset).limit(limit).all()
    items = []
    for s in rows:
        a = s.assignment
        items.append(
            {
                "id": s.id,
                "assignment_id": a.id if a else None,
                "title": a.title if a else "",
                "course_code": a.course.code if a and a.course else "",
                "submitted_on": s.submitted_at.date().isoformat() if s.submitted_at else None,
                "status": s.status,
                "marks": s.marks,
            }
        )
    return jsonify({"items": items, "total": total, "limit": limit, "offset": offset})
