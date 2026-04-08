from __future__ import annotations

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from app.decorators import require_roles
from app.errors import ApiError
from app.extensions import db
from app.models import Assignment, Batch, BatchCourse, Course, Student, Submission, User
from app.services.assignment_helpers import assignments_for_student, record_status
from app.services.dashboards import admin_dashboard

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


@admin_bp.get("/dashboard")
@require_roles("Admin")
def dashboard():
    return jsonify(admin_dashboard())


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
                "department": u.department,
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
    department = (data.get("department") or "").strip() or None
    if not name or not email or not password or batch_id is None:
        raise ApiError("VALIDATION_ERROR", "name, email, password, batch_id required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password too short", 422)
    if User.query.filter_by(email=email).first() or Student.query.filter_by(email=email).first():
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
        department=department,
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
            "department": u.department,
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
                "department": u.department,
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
    department = (data.get("department") or "").strip() or None
    tl = data.get("teaching_load_hours")
    if not name or not email or not password:
        raise ApiError("VALIDATION_ERROR", "name, email, password required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password too short", 422)
    if User.query.filter_by(email=email).first():
        raise ApiError("CONFLICT", "Email exists", 409)
    tl_int = int(tl) if tl is not None else None
    if tl_int is not None and (tl_int < 1 or tl_int > 20):
        raise ApiError("VALIDATION_ERROR", "teaching_load_hours 1-20", 422)
    u = User(
        email=email,
        password_hash=generate_password_hash(password),
        full_name=name,
        role="Staff",
        department=department,
        teaching_load_hours=tl_int,
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
            "department": u.department,
            "courses": codes,
            "teaching_load_hours": u.teaching_load_hours,
        }
    )


@admin_bp.delete("/staff/<int:uid>")
@require_roles("Admin")
def delete_staff(uid: int):
    u = User.query.filter_by(id=uid, role="Staff").first()
    if not u:
        raise ApiError("NOT_FOUND", "Staff not found", 404)
    if Course.query.filter_by(staff_id=u.id).first():
        raise ApiError("CONFLICT", "Staff still assigned to courses", 409)
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
        for bc in BatchCourse.query.filter_by(course_id=c.id).all():
            enrolled += User.query.filter_by(role="Student", batch_id=bc.batch_id).count()
        items.append(
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "department": c.department,
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
    department = (data.get("department") or "").strip()
    credits = data.get("credits")
    staff_id = data.get("staff_id")
    if not code or not name or not department or credits is None or staff_id is None:
        raise ApiError("VALIDATION_ERROR", "code, name, department, credits, staff_id required", 422)
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
    c = Course(code=code, name=name, department=department, credits=cr, staff_id=st.id)
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
    for bc in BatchCourse.query.filter_by(course_id=c.id).all():
        enrolled += User.query.filter_by(role="Student", batch_id=bc.batch_id).count()
    return jsonify(
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "department": c.department,
            "credits": c.credits,
            "enrolled_students": enrolled,
            "instructor_name": inst.full_name if inst else "",
            "instructor_id": c.staff_id,
        }
    )


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
        db.session.add(BatchCourse(batch_id=b.id, course_id=int(cid)))
    db.session.commit()
    return jsonify({"id": b.id}), 201
