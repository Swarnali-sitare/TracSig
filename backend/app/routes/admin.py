from __future__ import annotations

import uuid

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from werkzeug.security import generate_password_hash

from app.decorators import require_roles
from app.errors import ApiError
from app.extensions import db
from app.models import Assignment, Batch, Course, Enrollment, Faculty, Student, Submission, User
from app.services.assignment_helpers import assignments_for_student, record_status
admin_bp = Blueprint("admin", __name__)


def _student_progress_percent(u: User) -> int:
    assigns = assignments_for_student(u.batch_id)
    if not assigns:
        return 0
    done = 0
    for a in assigns:
        sub = Submission.query.filter_by(assignment_id=a.id, student_id=u.id).first()
        if record_status(sub) == "completed":
            done += 1
    return round(100.0 * done / len(assigns))


@admin_bp.get("/students")
@require_roles("Admin")
def list_students():
    batch_q = request.args.get("batch") or "all"
    search = (request.args.get("search") or "").lower()
    q = User.query.filter_by(role="Student")
    if batch_q != "all":
        q = q.join(Batch, User.batch_id == Batch.id).filter(Batch.year_label == batch_q)
    rows = q.all()
    items = []
    for u in rows:
        if search and search not in u.full_name.lower() and search not in u.email.lower():
            continue
        batch_label = u.batch.year_label if u.batch else ""
        items.append(
            {
                "id": u.id,
                "name": u.full_name,
                "email": u.email,
                "batch": batch_label,
                "progress_percent": _student_progress_percent(u),
            }
        )
    return jsonify({"items": items})


@admin_bp.post("/students")
@require_roles("Admin")
def create_student():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    batch_id = data.get("batch_id")
    if not name or not email or not password or batch_id is None:
        raise ApiError("VALIDATION_ERROR", "name, email, password, batch_id required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password too short", 422)
    if (
        User.query.filter_by(email=email).first()
        or Student.query.filter_by(email=email).first()
        or Faculty.query.filter_by(email=email).first()
    ):
        raise ApiError("CONFLICT", "Email exists", 409)
    if not db.session.get(Batch, int(batch_id)):
        raise ApiError("VALIDATION_ERROR", "Invalid batch", 422)
    ph = generate_password_hash(password)
    u = User(
        email=email,
        password_hash=ph,
        full_name=name,
        role="Student",
        batch_id=int(batch_id),
    )
    db.session.add(u)
    db.session.flush()
    sid = f"USR{u.id}"
    st = Student(id=sid, name=name, email=email, password_hash=ph, batch_id=int(batch_id))
    db.session.add(st)
    u.student_record_id = sid
    db.session.commit()
    return jsonify({"id": u.id}), 201


@admin_bp.get("/students/<int:uid>")
@require_roles("Admin")
def get_student(uid: int):
    u = User.query.filter_by(id=uid, role="Student").first()
    if not u:
        raise ApiError("NOT_FOUND", "Student not found", 404)
    batch_label = u.batch.year_label if u.batch else ""
    return jsonify(
        {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "batch": batch_label,
            "batch_id": u.batch_id,
            "progress_percent": _student_progress_percent(u),
        }
    )


@admin_bp.delete("/students/<int:uid>")
@require_roles("Admin")
def delete_student(uid: int):
    u = User.query.filter_by(id=uid, role="Student").first()
    if not u:
        raise ApiError("NOT_FOUND", "Student not found", 404)
    if u.student_record_id:
        st = db.session.get(Student, u.student_record_id)
        if st:
            db.session.delete(st)
            db.session.commit()
            return "", 204
    db.session.delete(u)
    db.session.commit()
    return "", 204


@admin_bp.get("/staff")
@require_roles("Admin")
def list_staff():
    rows = User.query.filter_by(role="Staff").all()
    items = []
    for u in rows:
        codes = [c.code for c in Course.query.filter_by(staff_id=u.id).all()]
        items.append(
            {
                "id": u.id,
                "name": u.full_name,
                "email": u.email,
                "courses": codes,
                "teaching_load_hours": u.teaching_load_hours,
            }
        )
    return jsonify({"items": items})


@admin_bp.post("/staff")
@require_roles("Admin")
def create_staff():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    tl = data.get("teaching_load_hours")
    if not name or not email or not password:
        raise ApiError("VALIDATION_ERROR", "name, email, password required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password too short", 422)
    if (
        User.query.filter_by(email=email).first()
        or Student.query.filter_by(email=email).first()
        or Faculty.query.filter_by(email=email).first()
    ):
        raise ApiError("CONFLICT", "Email exists", 409)
    tl_int = int(tl) if tl is not None else None
    if tl_int is not None and (tl_int < 1 or tl_int > 20):
        raise ApiError("VALIDATION_ERROR", "teaching_load_hours 1-20", 422)
    ph = generate_password_hash(password)
    fac_id = f"FAC{uuid.uuid4().hex[:16]}"
    fac = Faculty(
        id=fac_id,
        email=email,
        password_hash=ph,
        full_name=name,
        teaching_load_hours=tl_int,
    )
    db.session.add(fac)
    db.session.flush()
    u = User(
        email=email,
        password_hash=ph,
        full_name=name,
        role="Staff",
        teaching_load_hours=tl_int,
        faculty_record_id=fac_id,
    )
    db.session.add(u)
    db.session.commit()
    return jsonify({"id": u.id}), 201


@admin_bp.get("/staff/<int:uid>")
@require_roles("Admin")
def get_staff(uid: int):
    u = User.query.filter_by(id=uid, role="Staff").first()
    if not u:
        raise ApiError("NOT_FOUND", "Staff not found", 404)
    codes = [c.code for c in Course.query.filter_by(staff_id=u.id).all()]
    return jsonify(
        {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "courses": codes,
            "teaching_load_hours": u.teaching_load_hours,
        }
    )


@admin_bp.patch("/staff/<int:uid>")
@require_roles("Admin")
def patch_staff(uid: int):
    u = User.query.filter_by(id=uid, role="Staff").first()
    if not u:
        raise ApiError("NOT_FOUND", "Staff not found", 404)
    data = request.get_json(silent=True) or {}
    allowed_keys = {"name", "email", "teaching_load_hours", "password"}
    if not (set(data.keys()) & allowed_keys):
        raise ApiError("VALIDATION_ERROR", "No fields to update", 422)
    fac = db.session.get(Faculty, u.faculty_record_id) if u.faculty_record_id else None

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            raise ApiError("VALIDATION_ERROR", "name cannot be empty", 422)
        u.full_name = name
        if fac:
            fac.full_name = name

    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email:
            raise ApiError("VALIDATION_ERROR", "email cannot be empty", 422)
        if User.query.filter(User.email == email, User.id != u.id).first():
            raise ApiError("CONFLICT", "Email already in use", 409)
        if Student.query.filter_by(email=email).first():
            raise ApiError("CONFLICT", "Email already in use", 409)
        fq = Faculty.query.filter_by(email=email)
        if u.faculty_record_id:
            fq = fq.filter(Faculty.id != u.faculty_record_id)
        if fq.first():
            raise ApiError("CONFLICT", "Email already in use", 409)
        u.email = email
        if fac:
            fac.email = email

    if "teaching_load_hours" in data:
        tl = data.get("teaching_load_hours")
        if tl is None or tl == "":
            u.teaching_load_hours = None
            if fac:
                fac.teaching_load_hours = None
        else:
            try:
                tl_int = int(tl)
            except (TypeError, ValueError) as e:
                raise ApiError("VALIDATION_ERROR", "teaching_load_hours must be an integer", 422) from e
            if tl_int < 1 or tl_int > 20:
                raise ApiError("VALIDATION_ERROR", "teaching_load_hours must be 1–20", 422)
            u.teaching_load_hours = tl_int
            if fac:
                fac.teaching_load_hours = tl_int

    if "password" in data:
        pw = data.get("password") or ""
        if pw:
            if len(pw) < 6:
                raise ApiError("VALIDATION_ERROR", "Password too short", 422)
            ph = generate_password_hash(pw)
            u.password_hash = ph
            if fac:
                fac.password_hash = ph

    db.session.commit()
    return jsonify({"ok": True})


@admin_bp.delete("/staff/<int:uid>")
@require_roles("Admin")
def delete_staff(uid: int):
    u = User.query.filter_by(id=uid, role="Staff").first()
    if not u:
        raise ApiError("NOT_FOUND", "Staff not found", 404)
    if Course.query.filter_by(staff_id=u.id).first():
        raise ApiError("CONFLICT", "Staff still assigned to courses", 409)
    if u.faculty_record_id:
        fac = db.session.get(Faculty, u.faculty_record_id)
        if fac:
            db.session.delete(fac)
            db.session.commit()
            return "", 204
    db.session.delete(u)
    db.session.commit()
    return "", 204


@admin_bp.get("/courses")
@require_roles("Admin")
def list_courses():
    rows = Course.query.all()
    items = []
    for c in rows:
        inst = db.session.get(User, c.staff_id)
        enrolled = 0
        for bc in Enrollment.query.filter_by(course_id=c.id).all():
            enrolled += User.query.filter_by(role="Student", batch_id=bc.batch_id).count()
        items.append(
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "description": c.description,
                "credits": c.credits,
                "enrolled_students": enrolled,
                "instructor_name": inst.full_name if inst else "",
                "instructor_id": c.staff_id,
            }
        )
    return jsonify({"items": items})


@admin_bp.post("/courses")
@require_roles("Admin")
def create_course():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()
    name = (data.get("name") or "").strip()
    credits = data.get("credits")
    staff_id = data.get("staff_id")
    if not code or not name or credits is None or staff_id is None:
        raise ApiError("VALIDATION_ERROR", "code, name, credits, staff_id required", 422)
    st = db.session.get(User, int(staff_id))
    if not st or st.role != "Staff":
        raise ApiError("VALIDATION_ERROR", "staff_id must be a Staff user", 422)
    try:
        cr = int(credits)
    except (TypeError, ValueError) as e:
        raise ApiError("VALIDATION_ERROR", "Invalid credits", 422) from e
    if cr < 1 or cr > 6:
        raise ApiError("VALIDATION_ERROR", "credits 1-6", 422)
    if Course.query.filter_by(code=code).first():
        raise ApiError("CONFLICT", "Course code exists", 409)
    desc_raw = data.get("description")
    if desc_raw is None or (isinstance(desc_raw, str) and not desc_raw.strip()):
        description = None
    else:
        description = str(desc_raw).strip() or None
    c = Course(code=code, name=name, description=description, credits=cr, staff_id=st.id)
    db.session.add(c)
    db.session.commit()
    return jsonify({"id": c.id}), 201


@admin_bp.get("/courses/<int:cid>")
@require_roles("Admin")
def get_course(cid: int):
    c = db.session.get(Course, cid)
    if not c:
        raise ApiError("NOT_FOUND", "Course not found", 404)
    inst = db.session.get(User, c.staff_id)
    enrolled = 0
    for bc in Enrollment.query.filter_by(course_id=c.id).all():
        enrolled += User.query.filter_by(role="Student", batch_id=bc.batch_id).count()
    return jsonify(
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "description": c.description,
            "credits": c.credits,
            "enrolled_students": enrolled,
            "instructor_name": inst.full_name if inst else "",
            "instructor_id": c.staff_id,
        }
    )


@admin_bp.patch("/courses/<int:cid>")
@require_roles("Admin")
def patch_course(cid: int):
    c = db.session.get(Course, cid)
    if not c:
        raise ApiError("NOT_FOUND", "Course not found", 404)
    data = request.get_json(silent=True) or {}
    allowed_keys = {"code", "name", "description", "credits", "staff_id"}
    if not (set(data.keys()) & allowed_keys):
        raise ApiError("VALIDATION_ERROR", "No fields to update", 422)

    if "code" in data:
        code = (data.get("code") or "").strip()
        if not code:
            raise ApiError("VALIDATION_ERROR", "code cannot be empty", 422)
        if Course.query.filter(Course.code == code, Course.id != c.id).first():
            raise ApiError("CONFLICT", "Course code exists", 409)
        c.code = code

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            raise ApiError("VALIDATION_ERROR", "name cannot be empty", 422)
        c.name = name

    if "description" in data:
        raw = data.get("description")
        c.description = (
            str(raw).strip() if raw is not None and str(raw).strip() != "" else None
        )

    if "credits" in data:
        try:
            cr = int(data.get("credits"))
        except (TypeError, ValueError) as e:
            raise ApiError("VALIDATION_ERROR", "Invalid credits", 422) from e
        if cr < 1 or cr > 6:
            raise ApiError("VALIDATION_ERROR", "credits 1-6", 422)
        c.credits = cr

    if "staff_id" in data:
        try:
            sid = int(data.get("staff_id"))
        except (TypeError, ValueError) as e:
            raise ApiError("VALIDATION_ERROR", "staff_id must be an integer", 422) from e
        st = db.session.get(User, sid)
        if not st or st.role != "Staff":
            raise ApiError("VALIDATION_ERROR", "staff_id must be a Staff user", 422)
        c.staff_id = st.id

    db.session.commit()
    return jsonify({"ok": True})


@admin_bp.delete("/courses/<int:cid>")
@require_roles("Admin")
def delete_course(cid: int):
    c = db.session.get(Course, cid)
    if not c:
        raise ApiError("NOT_FOUND", "Course not found", 404)
    if Assignment.query.filter_by(course_id=cid).first():
        raise ApiError("CONFLICT", "Course has assignments", 409)
    db.session.delete(c)
    db.session.commit()
    return "", 204


@admin_bp.get("/batches")
@require_roles("Admin")
def list_batches():
    rows = Batch.query.order_by(Batch.id.asc()).all()
    return jsonify({"items": [{"id": b.id, "name": b.name, "year_label": b.year_label} for b in rows]})


@admin_bp.post("/batches")
@require_roles("Admin")
def create_batch():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    year_label = (data.get("year_label") or "").strip()
    if not name or not year_label:
        raise ApiError("VALIDATION_ERROR", "name and year_label required", 422)
    b = Batch(name=name, year_label=year_label)
    db.session.add(b)
    db.session.flush()
    course_ids = data.get("course_ids") or []
    for cid in course_ids:
        db.session.add(Enrollment(batch_id=b.id, course_id=int(cid)))
    db.session.commit()
    return jsonify({"id": b.id}), 201


@admin_bp.post("/enrollment")
@require_roles("Admin")
def create_enrollment():
    data = request.get_json(silent=True) or {}
    batch_id = data.get("batch_id")
    course_id = data.get("course_id")
    if batch_id is None or course_id is None:
        raise ApiError("VALIDATION_ERROR", "batch_id and course_id are required", 422)
    try:
        bid = int(batch_id)
        cid = int(course_id)
    except (TypeError, ValueError) as e:
        raise ApiError("VALIDATION_ERROR", "batch_id and course_id must be integers", 422) from e
    if not db.session.get(Batch, bid):
        raise ApiError("VALIDATION_ERROR", "Batch not found", 422)
    if not db.session.get(Course, cid):
        raise ApiError("VALIDATION_ERROR", "Course not found", 422)
    if Enrollment.query.filter_by(batch_id=bid, course_id=cid).first():
        raise ApiError("CONFLICT", "Course is already assigned to this batch", 409)
    row = Enrollment(batch_id=bid, course_id=cid)
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("CONFLICT", "Course is already assigned to this batch", 409) from None
    return jsonify({"id": row.id}), 201


@admin_bp.get("/enrollment")
@require_roles("Admin")
def list_enrollments():
    rows = (
        Enrollment.query.options(joinedload(Enrollment.batch), joinedload(Enrollment.course))
        .order_by(Enrollment.id.asc())
        .all()
    )
    items = []
    for e in rows:
        b = e.batch
        c = e.course
        items.append(
            {
                "id": e.id,
                "batch_name": b.name if b else "",
                "course_name": c.name if c else "",
                "batch_start_date": b.start_date.isoformat() if b and b.start_date else None,
                "batch_end_date": b.end_date.isoformat() if b and b.end_date else None,
            }
        )
    return jsonify({"items": items})


@admin_bp.delete("/enrollment/<int:eid>")
@require_roles("Admin")
def delete_enrollment(eid: int):
    row = db.session.get(Enrollment, eid)
    if not row:
        raise ApiError("NOT_FOUND", "Enrollment not found", 404)
    db.session.delete(row)
    db.session.commit()
    return "", 204
