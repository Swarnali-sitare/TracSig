"""Bring an existing database in line with current SQLAlchemy models (tables + columns + PG checks)."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.extensions import db


def _pg_role_constraint(conn) -> None:
    conn.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role"))
    conn.execute(
        text(
            "ALTER TABLE users ADD CONSTRAINT ck_users_role "
            "CHECK (role IN ('Student','Staff','Admin'))"
        )
    )


def _pg_user_student_fk(conn) -> None:
    row = conn.execute(
        text(
            "SELECT 1 FROM pg_constraint WHERE conname = 'users_student_record_id_fkey' LIMIT 1"
        )
    ).first()
    if row:
        return
    conn.execute(
        text(
            "ALTER TABLE users ADD CONSTRAINT users_student_record_id_fkey "
            "FOREIGN KEY (student_record_id) REFERENCES students(id) ON DELETE CASCADE"
        )
    )


def _pg_user_faculty_fk(conn) -> None:
    row = conn.execute(
        text(
            "SELECT 1 FROM pg_constraint WHERE conname = 'users_faculty_record_id_fkey' LIMIT 1"
        )
    ).first()
    if row:
        return
    conn.execute(
        text(
            "ALTER TABLE users ADD CONSTRAINT users_faculty_record_id_fkey "
            "FOREIGN KEY (faculty_record_id) REFERENCES faculty(id) ON DELETE CASCADE"
        )
    )


def sync_database_schema() -> list[str]:
    """
    Safe to run multiple times. Returns human-readable log lines.
    """
    lines: list[str] = []
    engine = db.engine
    dialect = engine.dialect.name

    db.create_all()
    lines.append("Ensured all model tables exist (create_all).")

    insp = inspect(engine)

    def colset(table: str) -> set[str]:
        if not insp.has_table(table):
            return set()
        return {c["name"] for c in insp.get_columns(table)}

    with engine.begin() as conn:
        if insp.has_table("batches"):
            bcols = colset("batches")
            if "start_date" not in bcols:
                conn.execute(text("ALTER TABLE batches ADD COLUMN start_date DATE"))
                lines.append("Added batches.start_date")
            if "end_date" not in bcols:
                conn.execute(text("ALTER TABLE batches ADD COLUMN end_date DATE"))
                lines.append("Added batches.end_date")

        if insp.has_table("users"):
            ucols = colset("users")
            if "student_record_id" not in ucols:
                conn.execute(text("ALTER TABLE users ADD COLUMN student_record_id VARCHAR(64)"))
                lines.append("Added users.student_record_id")
            if "faculty_record_id" not in ucols:
                conn.execute(text("ALTER TABLE users ADD COLUMN faculty_record_id VARCHAR(64)"))
                lines.append("Added users.faculty_record_id")

        if insp.has_table("refresh_tokens"):
            rtcols = colset("refresh_tokens")
            if "principal_kind" not in rtcols:
                if dialect == "postgresql":
                    conn.execute(
                        text(
                            "ALTER TABLE refresh_tokens ADD COLUMN principal_kind VARCHAR(20) "
                            "NOT NULL DEFAULT 'user'"
                        )
                    )
                else:
                    conn.execute(text("ALTER TABLE refresh_tokens ADD COLUMN principal_kind VARCHAR(20) DEFAULT 'user'"))
                lines.append("Added refresh_tokens.principal_kind")

    if dialect == "postgresql":
        with engine.begin() as conn:
            try:
                conn.execute(text("ALTER TABLE refresh_tokens ALTER COLUMN user_id DROP NOT NULL"))
                lines.append("Made refresh_tokens.user_id nullable (env admin sessions).")
            except Exception as e:
                lines.append(f"Note: refresh_tokens.user_id nullable: {e}")

        if insp.has_table("users") and insp.has_table("students"):
            with engine.begin() as conn:
                try:
                    _pg_user_student_fk(conn)
                    lines.append("Ensured users.student_record_id → students.id foreign key.")
                except Exception as e:
                    lines.append(f"Note: could not add student_record FK: {e}")

        if insp.has_table("users") and insp.has_table("faculty"):
            with engine.begin() as conn:
                try:
                    _pg_user_faculty_fk(conn)
                    lines.append("Ensured users.faculty_record_id → faculty.id foreign key.")
                except Exception as e:
                    lines.append(f"Note: could not add faculty_record FK: {e}")

        if insp.has_table("users"):
            with engine.begin() as conn:
                _pg_role_constraint(conn)
                lines.append("Updated users.ck_users_role for Student, Staff, Admin.")

    elif dialect == "sqlite":
        lines.append("SQLite: for refresh token / FK changes, prefer a fresh DB (flask init-db) if issues persist.")

    return lines
