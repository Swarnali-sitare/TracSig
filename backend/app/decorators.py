from __future__ import annotations

from functools import wraps

from flask import g, request

from app.auth_jwt import ENV_ADMIN_SUB, decode_token, normalize_role
from app.errors import ApiError
from app.extensions import db
from app.models import User


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise ApiError("UNAUTHORIZED", "Missing or invalid Authorization header", 401)
        token = auth[7:].strip()
        if not token:
            raise ApiError("UNAUTHORIZED", "Missing token", 401)
        payload = decode_token(token, expected_type="access")
        sub = payload.get("sub")
        if not sub:
            raise ApiError("UNAUTHORIZED", "Invalid token payload", 401)
        if sub == ENV_ADMIN_SUB:
            g.env_admin = True
            g.current_user = None
            g.token_role = "Admin"
            g.env_admin_email = (payload.get("env_admin_email") or "").strip().lower()
            return f(*args, **kwargs)
        try:
            uid = int(sub)
        except (TypeError, ValueError) as e:
            raise ApiError("UNAUTHORIZED", "Invalid token payload", 401) from e
        user = db.session.get(User, uid)
        if not user:
            raise ApiError("UNAUTHORIZED", "User not found", 401)
        g.env_admin = False
        g.env_admin_email = ""
        g.current_user = user
        g.token_role = normalize_role(payload.get("role", user.role))
        return f(*args, **kwargs)

    return decorated


def require_roles(*roles: str):
    def decorator(f):
        @wraps(f)
        @require_auth
        def wrapped(*args, **kwargs):
            allowed = {normalize_role(x) for x in roles}
            if getattr(g, "env_admin", False):
                if "Admin" in allowed:
                    return f(*args, **kwargs)
                raise ApiError("FORBIDDEN", "Insufficient permissions", 403)
            r = normalize_role(g.current_user.role)
            if r not in allowed:
                raise ApiError("FORBIDDEN", "Insufficient permissions", 403)
            return f(*args, **kwargs)

        return wrapped

    return decorator
