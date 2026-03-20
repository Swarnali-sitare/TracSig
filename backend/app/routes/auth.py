from flask import Blueprint, request, g
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from ..extensions import db, bcrypt
from ..models.user import User
from ..utils import success, error
from ..middleware.auth import jwt_required_custom

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "student").lower()
    department = (data.get("department") or "").strip()
    batch_id = data.get("batch_id")

    if not name or not email or not password:
        return error("name, email and password are required", 400)
    if role not in ("student", "staff", "admin"):
        return error("role must be student, staff or admin", 400)
    if len(password) < 6:
        return error("password must be at least 6 characters", 400)
    if User.query.filter_by(email=email).first():
        return error("Email already registered", 409)

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        name=name,
        email=email,
        password_hash=pw_hash,
        role=role,
        department=department,
        batch_id=batch_id if role == "student" else None,
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    resp = success(
        {"user": user.to_dict(), "access_token": access_token},
        "Registration successful",
        201,
    )
    set_refresh_cookies(resp[0], refresh_token)
    return resp


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error("email and password are required", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return error("Invalid email or password", 401)

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    resp = success(
        {"user": user.to_dict(), "access_token": access_token},
        "Login successful",
    )
    set_refresh_cookies(resp[0], refresh_token)
    return resp


@auth_bp.post("/logout")
def logout():
    resp = success(message="Logged out successfully")
    unset_jwt_cookies(resp[0])
    return resp


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return error("User not found", 401)
    access_token = create_access_token(identity=user_id)
    return success({"access_token": access_token}, "Token refreshed")


@auth_bp.get("/me")
@jwt_required_custom
def me():
    return success({"user": g.current_user.to_dict()})


@auth_bp.put("/profile")
@jwt_required_custom
def update_profile():
    data = request.get_json() or {}
    user = g.current_user

    if "name" in data:
        user.name = data["name"].strip()
    if "department" in data:
        user.department = data["department"].strip()
    if "password" in data and data["password"]:
        if len(data["password"]) < 6:
            return error("password must be at least 6 characters", 400)
        user.password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    db.session.commit()
    return success({"user": user.to_dict()}, "Profile updated")
