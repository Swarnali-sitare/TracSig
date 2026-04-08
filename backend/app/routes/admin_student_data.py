"""Admin batch & student management (spec: /api/admin/batch, /api/admin/student)."""

from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime

from flask import jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from app.decorators import require_roles
from app.errors import ApiError
from app.extensions import db
from app.models import Batch, Faculty, Student, User
from app.routes.admin import admin_bp

_STUDENT_ID_RE = re.compile(r"^[\w.-]{1,64}$")


def _parse_date(val) -> date:
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    s = (str(val) or "").strip()
    if not s:
        raise ValueError("empty date")
    if "T" in s:
        s = s.split("T", 1)[0]
    return date.fromisoformat(s)


def _batch_year_label_for(name: str, start: date) -> str:
    y = str(start.year)
    base = y
    n = 0
    while Batch.query.filter_by(name=name, year_label=base).first():
        n += 1
        base = f"{y}-{n}"
    return base


def _create_shadow_user_for_student(st: Student) -> User:
    u = User(
        email=st.email,
        password_hash=st.password_hash,
        full_name=st.name,
        role="Student",
        batch_id=st.batch_id,
        department=None,
        student_record_id=st.id,
    )
    db.session.add(u)
    return u


@admin_bp.post("/batch")
@require_roles("Admin")
def admin_create_batch():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("VALIDATION_ERROR", "name is required", 422)
    try:
        sd = _parse_date(data.get("start_date"))
        ed = _parse_date(data.get("end_date"))
    except (ValueError, TypeError) as e:
        raise ApiError("VALIDATION_ERROR", "start_date and end_date must be valid dates", 422) from e
    if ed < sd:
        raise ApiError("VALIDATION_ERROR", "end_date must be on or after start_date", 422)
    yl = _batch_year_label_for(name, sd)
    b = Batch(name=name, year_label=yl, start_date=sd, end_date=ed)
    db.session.add(b)
    db.session.commit()
    return jsonify({"id": b.id}), 201


@admin_bp.get("/batch")
@require_roles("Admin")
def admin_list_batches_with_strength():
    rows = Batch.query.order_by(Batch.id.asc()).all()
    out = []
    for b in rows:
        strength = Student.query.filter_by(batch_id=b.id).count()
        out.append(
            {
                "id": b.id,
                "name": b.name,
                "start_date": b.start_date.isoformat() if b.start_date else None,
                "end_date": b.end_date.isoformat() if b.end_date else None,
                "strength": strength,
            }
        )
    return jsonify({"items": out})


@admin_bp.get("/batch/<int:batch_id>")
@require_roles("Admin")
def admin_batch_students(batch_id: int):
    b = db.session.get(Batch, batch_id)
    if not b:
        raise ApiError("NOT_FOUND", "Batch not found", 404)
    rows = Student.query.filter_by(batch_id=batch_id).order_by(Student.id.asc()).all()
    return jsonify(
        {
            "batch": {
                "id": b.id,
                "name": b.name,
                "start_date": b.start_date.isoformat() if b.start_date else None,
                "end_date": b.end_date.isoformat() if b.end_date else None,
            },
            "students": [{"id": s.id, "name": s.name, "email": s.email} for s in rows],
        }
    )


@admin_bp.post("/student")
@require_roles("Admin")
def admin_create_managed_student():
    data = request.get_json(silent=True) or {}
    sid = (data.get("id") or data.get("ID") or "").strip()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    batch_id = data.get("batch_id")
    if not sid or not name or not email or not password or batch_id is None:
        raise ApiError("VALIDATION_ERROR", "id, name, email, password, and batch_id are required", 422)
    if not _STUDENT_ID_RE.match(sid):
        raise ApiError(
            "VALIDATION_ERROR",
            "id must be 1–64 characters: letters, digits, underscore, hyphen, or dot",
            422,
        )
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password must be at least 6 characters", 422)
    if db.session.get(Student, sid):
        raise ApiError("CONFLICT", "Student ID already exists", 409)
    if (
        Student.query.filter_by(email=email).first()
        or User.query.filter_by(email=email).first()
        or Faculty.query.filter_by(email=email).first()
    ):
        raise ApiError("VALIDATION_ERROR", "Email already in use", 409)
    b = db.session.get(Batch, int(batch_id))
    if not b:
        raise ApiError("VALIDATION_ERROR", "Invalid batch_id", 422)
    ph = generate_password_hash(password)
    st = Student(id=sid, name=name, email=email, password_hash=ph, batch_id=b.id)
    db.session.add(st)
    db.session.flush()
    _create_shadow_user_for_student(st)
    db.session.commit()
    return jsonify({"id": st.id}), 201


@admin_bp.post("/student/bulk")
@require_roles("Admin")
def admin_bulk_students():
    batch_id_raw = request.form.get("batch_id")
    if batch_id_raw is None or str(batch_id_raw).strip() == "":
        raise ApiError("VALIDATION_ERROR", "batch_id is required", 422)
    try:
        batch_id = int(batch_id_raw)
    except (TypeError, ValueError) as e:
        raise ApiError("VALIDATION_ERROR", "batch_id must be an integer", 422) from e
    b = db.session.get(Batch, batch_id)
    if not b:
        raise ApiError("VALIDATION_ERROR", "Invalid batch_id", 422)
    f = request.files.get("file")
    if not f or not f.filename:
        raise ApiError("VALIDATION_ERROR", "file is required", 422)
    raw = f.read()
    if len(raw) > 2 * 1024 * 1024:
        raise ApiError("VALIDATION_ERROR", "File too large (max 2MB)", 422)
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as e:
        raise ApiError("VALIDATION_ERROR", "File must be UTF-8 encoded", 422) from e
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ApiError("VALIDATION_ERROR", "CSV has no header row", 422)
    headers = [(n or "").strip() for n in reader.fieldnames if n]
    lower_map = {h.lower(): h for h in headers}
    required = {"id", "name", "email", "password"}
    if not required.issubset(set(lower_map)):
        raise ApiError("VALIDATION_ERROR", "CSV must include columns: ID, Name, Email, Password", 422)

    def pick(row: dict, key: str) -> str:
        h = lower_map.get(key)
        if not h:
            return ""
        return (row.get(h) or "").strip()

    added = 0
    skipped = 0
    max_rows = 5000
    for i, row in enumerate(reader):
        if i >= max_rows:
            break
        if not row:
            continue
        sid = pick(row, "id")
        name = pick(row, "name")
        email = pick(row, "email").lower()
        password = pick(row, "password")
        if not sid or not name or not email or not password:
            skipped += 1
            continue
        if not _STUDENT_ID_RE.match(sid):
            skipped += 1
            continue
        if len(password) < 6:
            skipped += 1
            continue
        if db.session.get(Student, sid):
            skipped += 1
            continue
        if (
            Student.query.filter_by(email=email).first()
            or User.query.filter_by(email=email).first()
            or Faculty.query.filter_by(email=email).first()
        ):
            skipped += 1
            continue
        try:
            with db.session.begin_nested():
                ph = generate_password_hash(password)
                st = Student(id=sid, name=name, email=email, password_hash=ph, batch_id=batch_id)
                db.session.add(st)
                db.session.flush()
                _create_shadow_user_for_student(st)
            added += 1
        except IntegrityError:
            skipped += 1

    db.session.commit()
    return jsonify({"added": added, "skipped": skipped})


@admin_bp.delete("/student")
@require_roles("Admin")
def admin_delete_students_bulk():
    data = request.get_json(silent=True) or {}
    ids = data.get("ids") or data.get("student_ids")
    if not isinstance(ids, list) or not ids:
        raise ApiError("VALIDATION_ERROR", "ids must be a non-empty list", 422)
    cleaned = []
    for x in ids:
        s = str(x).strip()
        if s:
            cleaned.append(s)
    if not cleaned:
        raise ApiError("VALIDATION_ERROR", "ids must be a non-empty list", 422)
    deleted = 0
    for sid in cleaned:
        st = db.session.get(Student, sid)
        if st:
            db.session.delete(st)
            deleted += 1
    db.session.commit()
    return jsonify({"deleted": deleted})
