from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app

from app.extensions import db
from app.models import RefreshToken, User


def normalize_role(role: str) -> str:
    if role == "Teacher":
        return "Staff"
    return role


def issue_tokens(user: User) -> tuple[str, str, int]:
    now = datetime.now(timezone.utc)
    access_exp = int(current_app.config["ACCESS_TOKEN_EXPIRES"])
    refresh_days = int(current_app.config["REFRESH_TOKEN_EXPIRES_DAYS"])
    role = normalize_role(user.role)

    access_payload = {
        "sub": str(user.id),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=access_exp)).timestamp()),
    }
    jti = str(uuid.uuid4())
    refresh_exp = now + timedelta(days=refresh_days)
    refresh_payload = {
        "sub": str(user.id),
        "role": role,
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(refresh_exp.timestamp()),
    }
    secret = current_app.config["JWT_SECRET_KEY"]
    access_token = jwt.encode(access_payload, secret, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, secret, algorithm="HS256")

    rt = RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_exp)
    db.session.add(rt)
    db.session.commit()

    return access_token, refresh_token, access_exp


def decode_token(token: str, expected_type: str | None = None) -> dict:
    secret = current_app.config["JWT_SECRET_KEY"]
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as e:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Token expired", 401) from e
    except jwt.InvalidTokenError as e:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Invalid token", 401) from e
    if expected_type and payload.get("type") != expected_type:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Invalid token type", 401)
    return payload


def revoke_refresh_jti(jti: str) -> None:
    row = RefreshToken.query.filter_by(jti=jti, revoked_at=None).first()
    if row:
        row.revoked_at = datetime.now(timezone.utc)
        db.session.commit()


def refresh_access_token(refresh_token_str: str) -> tuple[str, str, int]:
    payload = decode_token(refresh_token_str, expected_type="refresh")
    jti = payload.get("jti")
    if not jti:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Invalid refresh token", 401)
    row = RefreshToken.query.filter_by(jti=jti).first()
    if not row or row.revoked_at is not None:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Refresh token revoked or invalid", 401)
    if row.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "Refresh token expired", 401)

    user = db.session.get(User, row.user_id)
    if not user:
        from app.errors import ApiError

        raise ApiError("UNAUTHORIZED", "User not found", 401)

    revoke_refresh_jti(jti)
    return issue_tokens(user)
