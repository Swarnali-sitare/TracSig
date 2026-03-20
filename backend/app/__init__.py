import os
from flask import Flask
from dotenv import load_dotenv

from .config import config
from .extensions import db, jwt, bcrypt, cors, migrate

load_dotenv()


def create_app(config_name: str = None) -> Flask:
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}},
        supports_credentials=True,
    )

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.student import student_bp
    from .routes.staff import staff_bp
    from .routes.admin import admin_bp
    from .routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # Health check
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
