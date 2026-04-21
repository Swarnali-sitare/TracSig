from __future__ import annotations

import secrets

from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth_jwt import ENV_ADMIN_SUB, decode_token, issue_tokens, issue_tokens_env_admin, normalize_role, refresh_access_token, revoke_refresh_jti
from app.decorators import require_auth
from app.errors import ApiError
from app.extensions import db
from app.models import Faculty, Student, User

auth_bp = Blueprint("auth", __name__)


def _env_admin_password_ok_account(acc: dict, password: str) -> bool:
    pwd_hash = acc.get("password_hash") or ""
    if pwd_hash:
        return check_password_hash(pwd_hash, password)
    plain = acc.get("password")
    if plain is None or plain == "":
        return False
    try:
        return secrets.compare_digest(password.encode("utf-8"), str(plain).encode("utf-8"))
    except Exception:
        return False


def _match_env_admin(email: str, password: str) -> str | None:
    """Env admin email if password matches an ADMIN_ACCOUNTS entry, else None."""
    for acc in current_app.config.get("ADMIN_ACCOUNTS") or []:
        if acc.get("email") != email:
            continue
        if _env_admin_password_ok_account(acc, password):
            return acc["email"]
    return None


def _user_public(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.full_name,
        "email": u.email,
        "role": normalize_role(u.role),
    }


def _env_admin_public(admin_email: str) -> dict:
    return {
        "id": 0,
        "name": "Administrator",
        "email": admin_email,
        "role": "Admin",
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
        "batch_id": u.batch_id,
        "batch_label": batch_label,
    }


def _env_admin_me() -> dict:
    email = (getattr(g, "env_admin_email", None) or "").strip() or (current_app.config.get("ADMIN_EMAIL") or "").strip()
    return {
        "id": 0,
        "name": "Administrator",
        "email": email,
        "role": "Admin",
        "batch_id": None,
        "batch_label": None,
    }


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        raise ApiError("VALIDATION_ERROR", "email and password are required", 422)

    def _invalid():
        raise ApiError("UNAUTHORIZED", "Invalid credentials", 401)

    env_admin = _match_env_admin(email, password)
    if env_admin:
        access, refresh, expires_in = issue_tokens_env_admin(env_admin)
        return jsonify(
            {
                "user": _env_admin_public(env_admin),
                "access_token": access,
                "refresh_token": refresh,
                "expires_in": expires_in,
            }
        )

    st = Student.query.filter_by(email=email).first()
    if st and check_password_hash(st.password_hash, password):
        u = User.query.filter_by(student_record_id=st.id).first()
        if u:
            access, refresh, expires_in = issue_tokens(u)
            return jsonify(
                {
                    "user": _user_public(u),
                    "access_token": access,
                    "refresh_token": refresh,
                    "expires_in": expires_in,
                }
            )

    fac = Faculty.query.filter_by(email=email).first()
    if fac and check_password_hash(fac.password_hash, password):
        u = User.query.filter_by(faculty_record_id=fac.id).first()
        if u:
            access, refresh, expires_in = issue_tokens(u)
            return jsonify(
                {
                    "user": _user_public(u),
                    "access_token": access,
                    "refresh_token": refresh,
                    "expires_in": expires_in,
                }
            )

    _invalid()


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
    if getattr(g, "env_admin", False):
        return jsonify(_env_admin_me())
    u = g.current_user
    db.session.refresh(u)
    return jsonify(_user_me(u))


@auth_bp.patch("/me")
@require_auth
def patch_me():
    if getattr(g, "env_admin", False):
        raise ApiError("FORBIDDEN", "Profile cannot be changed for this account", 403)
    u = g.current_user
    data = request.get_json(silent=True) or {}
    if "name" in data and data["name"]:
        u.full_name = str(data["name"]).strip()
    db.session.commit()
    return jsonify(_user_me(u))


@auth_bp.put("/password")
@require_auth
def put_password():
    if getattr(g, "env_admin", False):
        raise ApiError("FORBIDDEN", "Password cannot be changed for this account", 403)
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
    if u.faculty_record_id:
        fac = db.session.get(Faculty, u.faculty_record_id)
        if fac:
            fac.password_hash = u.password_hash
    db.session.commit()
    return jsonify({"ok": True})
