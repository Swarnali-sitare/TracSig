from flask import Flask

from app.routes.admin import admin_bp
from app.routes.auth import auth_bp
from app.routes.health import health_bp
from app.routes.notifications import notifications_bp
from app.routes.staff import staff_bp
from app.routes.student import student_bp


def register_blueprints(app: Flask) -> None:
    from app.routes import admin_student_data  # noqa: F401 — register /batch and /student routes on admin_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
