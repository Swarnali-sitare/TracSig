from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth_jwt import decode_token, issue_tokens, normalize_role, refresh_access_token, revoke_refresh_jti
from app.decorators import require_auth
from app.errors import ApiError
from app.extensions import db
from app.models import Batch, Student, User

auth_bp = Blueprint("auth", __name__)


def _students_table_exists() -> bool:
    try:
        return bool(sa_inspect(db.engine).has_table("students"))
    except Exception:
        return False


def _email_already_registered(email: str) -> bool:
    if User.query.filter_by(email=email).first():
        return True
    if _students_table_exists():
        return Student.query.filter_by(email=email).first() is not None
    return False


def _user_public(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.full_name,
        "email": u.email,
        "role": normalize_role(u.role),
    }


def _user_me(u: User) -> dict:
    batch_label = None
    if u.batch_id and u.batch:
        batch_label = u.batch.year_label
    return {
        "id": u.id,
        "name": u.full_name,
        "email": u.email,
        "role": normalize_role(u.role),
        "department": u.department,
        "batch_id": u.batch_id,
        "batch_label": batch_label,
    }


@auth_bp.get("/batches")
def public_batches():
    """List batches for student self-registration (no auth)."""
    rows = Batch.query.order_by(Batch.id.asc()).all()
    return jsonify(
        {
            "items": [
                {
                    "id": b.id,
                    "name": b.name,
                    "year_label": b.year_label,
                    "label": b.year_label,
                    "start_date": b.start_date.isoformat() if b.start_date else None,
                    "end_date": b.end_date.isoformat() if b.end_date else None,
                }
                for b in rows
            ]
        }
    )


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role_raw = (data.get("role") or "Student").strip()
    rk = role_raw.lower()
    if rk in ("student",):
        role = "Student"
    elif rk in ("staff", "faculty", "teacher"):
        role = "Staff"
    elif rk in ("admin", "administrator"):
        role = "Admin"
    elif role_raw in ("Student", "Staff", "Admin"):
        role = role_raw
    else:
        role = ""

    if not name or not email or not password:
        raise ApiError("VALIDATION_ERROR", "name, email, and password are required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password must be at least 6 characters", 422)
    if role not in ("Student", "Staff", "Admin"):
        raise ApiError(
            "VALIDATION_ERROR",
            "role must be Student, Staff, or Admin",
            422,
            [{"field": "role", "issue": "invalid"}],
        )

    if _email_already_registered(email):
        raise ApiError("VALIDATION_ERROR", "Email already registered", 409, [{"field": "email", "issue": "already_exists"}])

    batch_id = data.get("batch_id")
    if role == "Student":
        if not batch_id:
            raise ApiError("VALIDATION_ERROR", "batch_id is required for students", 422)
        b = db.session.get(Batch, int(batch_id))
        if not b:
            raise ApiError("VALIDATION_ERROR", "Invalid batch_id", 422)

    tl_raw = data.get("teaching_load_hours") if role == "Staff" else None
    teaching_load_hours = None
    if tl_raw is not None and tl_raw != "":
        try:
            teaching_load_hours = int(tl_raw)
        except (TypeError, ValueError):
            teaching_load_hours = None

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        full_name=name,
        role=role,
        batch_id=int(batch_id) if role == "Student" else None,
        department=(data.get("department") or None) if role == "Staff" else None,
        teaching_load_hours=teaching_load_hours,
    )
    try:
        db.session.add(user)
        db.session.flush()
        if role == "Student":
            if not _students_table_exists():
                db.session.rollback()
                raise ApiError(
                    "VALIDATION_ERROR",
                    "Student registration requires database schema with a students table. Run `flask init-db` or apply migrations.",
                    503,
                )
            sid = f"REG{user.id}"
            st = Student(
                id=sid,
                name=name,
                email=email,
                password_hash=user.password_hash,
                batch_id=int(batch_id),
            )
            db.session.add(st)
            user.student_record_id = sid
        db.session.commit()
    except IntegrityError as err:
        db.session.rollback()
        orig = str(getattr(err, "orig", err) or err)
        low = orig.lower()
        if "email" in low or "unique" in low:
            raise ApiError("VALIDATION_ERROR", "Email already registered", 409) from err
        if "ck_users_role" in low or ("role" in low and "check" in low):
            raise ApiError(
                "VALIDATION_ERROR",
                "This database does not allow the Admin role yet. Run: ./venv/bin/flask sync-schema",
                400,
            ) from err
        raise ApiError("VALIDATION_ERROR", "Registration could not be completed", 400) from err
    except (OperationalError, ProgrammingError) as err:
        db.session.rollback()
        raise ApiError(
            "VALIDATION_ERROR",
            "Database schema is out of date. From the backend folder run: ./venv/bin/flask sync-schema",
            503,
        ) from err

    user = db.session.get(User, user.id)
    if user is None:
        raise ApiError("VALIDATION_ERROR", "Registration could not be completed", 500)

    try:
        access, refresh, expires_in = issue_tokens(user)
    except (IntegrityError, OperationalError, ProgrammingError) as err:
        db.session.rollback()
        raise ApiError(
            "VALIDATION_ERROR",
            "Could not issue session tokens. From the backend folder run: ./venv/bin/flask sync-schema",
            503,
        ) from err

    return (
        jsonify(
            {
                "user": _user_public(user),
                "access_token": access,
                "refresh_token": refresh,
                "expires_in": expires_in,
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        raise ApiError("VALIDATION_ERROR", "email and password are required", 422)

    def _ok(u: User):
        access, refresh, expires_in = issue_tokens(u)
        return jsonify(
            {
                "user": _user_public(u),
                "access_token": access,
                "refresh_token": refresh,
                "expires_in": expires_in,
            }
        )

    user = User.query.filter_by(email=email).first()
    if user:
        if user.role in ("Admin", "Staff"):
            if check_password_hash(user.password_hash, password):
                return _ok(user)
            raise ApiError("UNAUTHORIZED", "Invalid email or password", 401)
        if user.role == "Student":
            st = None
            if user.student_record_id and _students_table_exists():
                st = db.session.get(Student, user.student_record_id)
            if st and check_password_hash(st.password_hash, password):
                return _ok(user)
            if check_password_hash(user.password_hash, password):
                return _ok(user)
            raise ApiError("UNAUTHORIZED", "Invalid email or password", 401)

    if _students_table_exists():
        st = Student.query.filter_by(email=email).first()
        if st and check_password_hash(st.password_hash, password):
            u = User.query.filter_by(student_record_id=st.id).first()
            if u:
                return _ok(u)

    raise ApiError("UNAUTHORIZED", "Invalid email or password", 401)


@auth_bp.post("/logout")
def logout():
    data = request.get_json(silent=True) or {}
    rt = data.get("refresh_token")
    if rt:
        try:
            payload = decode_token(rt, expected_type="refresh")
            jti = payload.get("jti")
            if jti:
                revoke_refresh_jti(jti)
        except ApiError:
            pass
    return "", 204


@auth_bp.post("/refresh")
def refresh():
    data = request.get_json(silent=True) or {}
    rt = data.get("refresh_token")
    if not rt:
        raise ApiError("VALIDATION_ERROR", "refresh_token is required", 422)
    access, new_refresh, expires_in = refresh_access_token(rt)
    return jsonify(
        {
            "access_token": access,
            "refresh_token": new_refresh,
            "expires_in": expires_in,
        }
    )


@auth_bp.get("/me")
@require_auth
def me():
    u = g.current_user
    db.session.refresh(u)
    return jsonify(_user_me(u))


@auth_bp.patch("/me")
@require_auth
def patch_me():
    u = g.current_user
    data = request.get_json(silent=True) or {}
    if "name" in data and data["name"]:
        u.full_name = str(data["name"]).strip()
    if "department" in data:
        u.department = str(data["department"]).strip() if data.get("department") else None
    db.session.commit()
    return jsonify(_user_me(u))


@auth_bp.put("/password")
@require_auth
def put_password():
    u = g.current_user
    data = request.get_json(silent=True) or {}
    current = data.get("current_password") or ""
    new_pw = data.get("new_password") or ""
    if not check_password_hash(u.password_hash, current):
        raise ApiError("VALIDATION_ERROR", "Current password is incorrect", 422)
    if len(new_pw) < 6:
        raise ApiError("VALIDATION_ERROR", "New password must be at least 6 characters", 422)
    u.password_hash = generate_password_hash(new_pw)
    if u.student_record_id:
        st = db.session.get(Student, u.student_record_id)
        if st:
            st.password_hash = u.password_hash
    db.session.commit()
    return jsonify({"ok": True})
