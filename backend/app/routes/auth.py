from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth_jwt import decode_token, issue_tokens, normalize_role, refresh_access_token, revoke_refresh_jti
from app.decorators import require_auth
from app.errors import ApiError
from app.extensions import db
from app.models import Batch, User

auth_bp = Blueprint("auth", __name__)


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
    elif role_raw in ("Student", "Staff"):
        role = role_raw
    else:
        role = ""

    if not name or not email or not password:
        raise ApiError("VALIDATION_ERROR", "name, email, and password are required", 422)
    if len(password) < 6:
        raise ApiError("VALIDATION_ERROR", "Password must be at least 6 characters", 422)
    if role == "Admin":
        raise ApiError("FORBIDDEN", "Admin self-registration is not allowed", 403)
    if role not in ("Student", "Staff"):
        raise ApiError("VALIDATION_ERROR", "role must be Student or Staff", 422, [{"field": "role", "issue": "invalid"}])

    if User.query.filter_by(email=email).first():
        raise ApiError("VALIDATION_ERROR", "Email already registered", 409, [{"field": "email", "issue": "already_exists"}])

    batch_id = data.get("batch_id")
    if role == "Student":
        if not batch_id:
            raise ApiError("VALIDATION_ERROR", "batch_id is required for students", 422)
        b = db.session.get(Batch, int(batch_id))
        if not b:
            raise ApiError("VALIDATION_ERROR", "Invalid batch_id", 422)

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        full_name=name,
        role=role,
        batch_id=int(batch_id) if role == "Student" else None,
        department=(data.get("department") or None) if role == "Staff" else None,
        teaching_load_hours=data.get("teaching_load_hours") if role == "Staff" else None,
    )
    db.session.add(user)
    db.session.commit()

    access, refresh, expires_in = issue_tokens(user)
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
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        raise ApiError("UNAUTHORIZED", "Invalid email or password", 401)
    access, refresh, expires_in = issue_tokens(user)
    return jsonify(
        {
            "user": _user_public(user),
            "access_token": access,
            "refresh_token": refresh,
            "expires_in": expires_in,
        }
    )


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
    db.session.commit()
    return jsonify({"ok": True})
