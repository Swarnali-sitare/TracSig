from __future__ import annotations

import os

import click
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import get_config_class
from app.errors import attach_error_handlers
from app.extensions import db
from app.routes import mount_blueprints


def create_app(config_class: type | None = None) -> Flask:
    app = Flask(__name__)
    cfg = config_class or get_config_class()
    app.config.from_object(cfg)
    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    attach_error_handlers(app)
    mount_blueprints(app)

    @app.get("/")
    def root():
        """JSON index for GET / (health and /api entry points)."""
        return jsonify(
            {
                "service": "TracSig API",
                "health": "/api/health",
                "auth": "/api/auth/login",
                "hint": "All HTTP API routes are under the /api prefix.",
            }
        )

    @app.get("/api/")
    def api_root():
        return jsonify(
            {
                "service": "TracSig API",
                "health": "/api/health",
                "auth": "/api/auth/login",
            }
        )

    if os.environ.get("TRUST_PROXY", "").lower() in ("1", "true", "yes"):
        from werkzeug.middleware.proxy_fix import ProxyFix

        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    @app.cli.command("init-db")
    def init_db():
        """Create all tables (db.create_all)."""
        db.create_all()
        click.echo("Tables created.")

    @app.cli.command("seed-demo")
    def seed_demo():
        """Seed demo faculty/student/course/assignment (see CLI output for credentials)."""
        from datetime import date, timedelta

        from werkzeug.security import generate_password_hash

        from app.models import Assignment, Batch, Course, Enrollment, Faculty, Student, User

        db.create_all()

        batch_years = ["2022", "2023", "2024", "2025"]
        batches = {}
        for year_label in batch_years:
            batch = Batch.query.filter_by(name="", year_label=year_label).first()
            if not batch:
                batch = Batch(name="", year_label=year_label)
                db.session.add(batch)
                db.session.flush()
            batches[year_label] = batch

        if User.query.filter_by(email="student@example.com").first():
            click.echo("Demo data already exists. Batches from 2022 to 2025 have been seeded.")
            db.session.commit()
            return

        batch = batches["2024"]
        fac_pw = generate_password_hash("faculty123")
        fac_id = "DEMO-FAC-1"
        fac = Faculty(
            id=fac_id,
            email="faculty@example.com",
            password_hash=fac_pw,
            full_name="Demo Faculty",
            teaching_load_hours=6,
        )
        db.session.add(fac)
        db.session.flush()
        staff = User(
            email="faculty@example.com",
            password_hash=fac_pw,
            full_name="Demo Faculty",
            role="Staff",
            teaching_load_hours=6,
            faculty_record_id=fac_id,
        )
        db.session.add(staff)
        db.session.flush()
        stu_pw = generate_password_hash("student123")
        student_row = Student(
            id="DEMO-STU-1",
            name="Demo Student",
            email="student@example.com",
            password_hash=stu_pw,
            batch_id=batch.id,
        )
        db.session.add(student_row)
        db.session.flush()
        student = User(
            email="student@example.com",
            password_hash=stu_pw,
            full_name="Demo Student",
            role="Student",
            batch_id=batch.id,
            student_record_id=student_row.id,
        )
        db.session.add(student)
        course = Course(
            code="CS201",
            name="Data Structures",
            credits=4,
            staff_id=staff.id,
        )
        db.session.add(course)
        db.session.flush()
        db.session.add(Enrollment(batch_id=batch.id, course_id=course.id))
        db.session.flush()
        db.session.add(
            Assignment(
                title="Sample assignment",
                description="Complete this after logging in as the demo student.",
                course_id=course.id,
                staff_id=staff.id,
                due_date=date.today() + timedelta(days=7),
            )
        )
        db.session.commit()
        click.echo(
            "Seeded: faculty@example.com / faculty123, student@example.com / student123. "
            "Admin: set ADMIN_1_EMAIL / ADMIN_1_PASSWORD (or legacy ADMIN_EMAIL / ADMIN_PASSWORD) in backend/.env — not stored in DB."
        )

    @app.cli.command("sync-db-checks")
    def sync_db_checks():
        """PostgreSQL only: fix users.ck_users_role to allow Admin."""
        from sqlalchemy import text

        url = str(db.engine.url)
        if not url.startswith("postgresql"):
            click.echo("sync-db-checks is for PostgreSQL only. For SQLite, use a fresh DB or flask init-db.")
            return
        with db.engine.begin() as conn:
            conn.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role"))
            conn.execute(
                text(
                    "ALTER TABLE users ADD CONSTRAINT ck_users_role "
                    "CHECK (role IN ('Student','Staff','Admin'))"
                )
            )
        click.echo("Updated users.ck_users_role to allow Student, Staff, and Admin.")

    @app.cli.command("sync-schema")
    def sync_schema():
        """Run schema_sync (new columns, FKs, legacy cleanup)."""
        from app.schema_sync import sync_database_schema

        for line in sync_database_schema():
            click.echo(line)

    @app.cli.command("purge-batch-submissions")
    @click.option(
        "--days",
        type=int,
        default=None,
        help="Delete submissions for batches whose end_date is older than today minus this many days "
        "(default: BATCH_SUBMISSION_RETENTION_DAYS from config, usually 30).",
    )
    @click.option("--dry-run", is_flag=True, help="Only count what would be deleted; no DB or file changes.")
    def purge_batch_submissions(days: int | None, dry_run: bool):
        """Remove assignment submissions (and files) for batches ended longer than the retention window."""
        from app.services.batch_retention import purge_submissions_after_batch_retention

        retention = days if days is not None else app.config.get("BATCH_SUBMISSION_RETENTION_DAYS", 30)
        result = purge_submissions_after_batch_retention(retention_days=retention, dry_run=dry_run)
        click.echo(f"Retention: {result['retention_days']} days (batches ended before {result['cutoff_batches_ended_before']})")
        click.echo(f"Batches eligible: {result['batches_eligible']}")
        click.echo(f"Submissions {'that would be deleted' if dry_run else 'deleted'}: {result['submissions_deleted']}")
        if result["errors"]:
            click.echo("Warnings/errors:")
            for err in result["errors"][:50]:
                click.echo(f"  - {err}")
            if len(result["errors"]) > 50:
                click.echo(f"  ... and {len(result['errors']) - 50} more")

    return app
