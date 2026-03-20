from flask import Blueprint, request, g

from ..extensions import db, bcrypt
from ..models.user import User
from ..models.course import Course, BatchCourse
from ..models.batch import Batch
from ..models.assignment import Assignment
from ..models.submission import Submission
from ..utils import success, error
from ..middleware.auth import role_required

admin_bp = Blueprint("admin", __name__)

# ── Students ──────────────────────────────────────────────────────────────────

@admin_bp.get("/students")
@role_required("admin")
def list_students():
    search = request.args.get("search", "").lower()
    batch_id = request.args.get("batch_id")
    query = User.query.filter_by(role="student")
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    students = query.order_by(User.name).all()
    result = [s.to_dict() for s in students]
    if search:
        result = [s for s in result if search in s["name"].lower() or search in s["email"].lower()]
    return success(result)


@admin_bp.post("/students")
@role_required("admin")
def add_student():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or "student123"
    department = (data.get("department") or "").strip()
    batch_id = data.get("batch_id")

    if not name or not email:
        return error("name and email are required", 400)
    if User.query.filter_by(email=email).first():
        return error("Email already registered", 409)

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        name=name, email=email, password_hash=pw_hash,
        role="student", department=department, batch_id=batch_id
    )
    db.session.add(user)
    db.session.commit()
    return success(user.to_dict(), "Student added", 201)


@admin_bp.get("/students/<string:student_id>")
@role_required("admin")
def get_student(student_id):
    user = User.query.filter_by(id=student_id, role="student").first()
    if not user:
        return error("Student not found", 404)
    return success(user.to_dict())


@admin_bp.delete("/students/<string:student_id>")
@role_required("admin")
def delete_student(student_id):
    user = User.query.filter_by(id=student_id, role="student").first()
    if not user:
        return error("Student not found", 404)
    db.session.delete(user)
    db.session.commit()
    return success(message="Student deleted")


# ── Staff ─────────────────────────────────────────────────────────────────────

@admin_bp.get("/staff")
@role_required("admin")
def list_staff():
    search = request.args.get("search", "").lower()
    staff_list = User.query.filter_by(role="staff").order_by(User.name).all()
    result = [s.to_dict() for s in staff_list]
    if search:
        result = [s for s in result if search in s["name"].lower() or search in s["email"].lower()]
    return success(result)


@admin_bp.post("/staff")
@role_required("admin")
def add_staff():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or "staff123"
    department = (data.get("department") or "").strip()

    if not name or not email:
        return error("name and email are required", 400)
    if User.query.filter_by(email=email).first():
        return error("Email already registered", 409)

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        name=name, email=email, password_hash=pw_hash,
        role="staff", department=department
    )
    db.session.add(user)
    db.session.commit()
    return success(user.to_dict(), "Staff added", 201)


@admin_bp.get("/staff/<string:staff_id>")
@role_required("admin")
def get_staff_member(staff_id):
    user = User.query.filter_by(id=staff_id, role="staff").first()
    if not user:
        return error("Staff member not found", 404)
    return success(user.to_dict())


@admin_bp.delete("/staff/<string:staff_id>")
@role_required("admin")
def delete_staff(staff_id):
    user = User.query.filter_by(id=staff_id, role="staff").first()
    if not user:
        return error("Staff member not found", 404)
    db.session.delete(user)
    db.session.commit()
    return success(message="Staff member deleted")


# ── Courses ───────────────────────────────────────────────────────────────────

@admin_bp.get("/courses")
@role_required("admin")
def list_courses():
    search = request.args.get("search", "").lower()
    courses = Course.query.order_by(Course.name).all()
    result = [c.to_dict() for c in courses]
    if search:
        result = [c for c in result if search in c["name"].lower() or search in c["code"].lower()]
    return success(result)


@admin_bp.post("/courses")
@role_required("admin")
def add_course():
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    name = (data.get("name") or "").strip()
    department = (data.get("department") or "").strip()
    credits = data.get("credits", 3)
    staff_id = data.get("staff_id")

    if not code or not name:
        return error("code and name are required", 400)
    if Course.query.filter_by(code=code).first():
        return error("Course code already exists", 409)

    course = Course(
        code=code, name=name, department=department,
        credits=int(credits), staff_id=staff_id
    )
    db.session.add(course)
    db.session.commit()
    return success(course.to_dict(), "Course added", 201)


@admin_bp.get("/courses/<string:course_id>")
@role_required("admin")
def get_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return error("Course not found", 404)
    return success(course.to_dict())


@admin_bp.delete("/courses/<string:course_id>")
@role_required("admin")
def delete_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return error("Course not found", 404)
    db.session.delete(course)
    db.session.commit()
    return success(message="Course deleted")


# ── Batches ───────────────────────────────────────────────────────────────────

@admin_bp.get("/batches")
@role_required("admin")
def list_batches():
    batches = Batch.query.order_by(Batch.year.desc()).all()
    return success([b.to_dict() for b in batches])


@admin_bp.post("/batches")
@role_required("admin")
def add_batch():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    year = data.get("year")

    if not name or not year:
        return error("name and year are required", 400)

    batch = Batch(name=name, year=int(year))
    db.session.add(batch)
    db.session.commit()
    return success(batch.to_dict(), "Batch added", 201)


# ── Dashboard ─────────────────────────────────────────────────────────────────

@admin_bp.get("/dashboard")
@role_required("admin")
def dashboard():
    total_students = User.query.filter_by(role="student").count()
    total_staff = User.query.filter_by(role="staff").count()
    total_courses = Course.query.count()
    total_batches = Batch.query.count()
    total_assignments = Assignment.query.count()
    total_submissions = Submission.query.count()

    # Enrollment per batch
    batches = Batch.query.all()
    enrollment_data = [
        {
            "batch": b.name,
            "students": User.query.filter_by(role="student", batch_id=b.id).count(),
        }
        for b in batches
    ]

    # Submission status distribution
    status_counts = {
        "draft": Submission.query.filter_by(status="draft").count(),
        "submitted": Submission.query.filter_by(status="submitted").count(),
        "evaluated": Submission.query.filter_by(status="evaluated").count(),
    }

    return success({
        "stats": {
            "total_students": total_students,
            "total_staff": total_staff,
            "total_courses": total_courses,
            "total_batches": total_batches,
            "total_assignments": total_assignments,
            "total_submissions": total_submissions,
        },
        "enrollment_data": enrollment_data,
        "submission_status": status_counts,
    })
