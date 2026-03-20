from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import g
from ..models.user import User
from ..utils import error


def jwt_required_custom(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user:
                return error("User not found", 401)
            g.current_user = user
        except Exception as e:
            return error(str(e), 401)
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required_custom
        def wrapper(*args, **kwargs):
            user = g.current_user
            if user.role not in roles:
                return error("Forbidden: insufficient permissions", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
