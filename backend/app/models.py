from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Date, UniqueConstraint

from app.extensions import db


class Batch(db.Model):
    __tablename__ = "batches"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    year_label = db.Column(db.String(32), nullable=False)
    start_date = db.Column(Date, nullable=True)
    end_date = db.Column(Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (UniqueConstraint("name", "year_label", name="uq_batches_name_year"),)

    users = db.relationship("User", back_populates="batch", foreign_keys="User.batch_id")
    student_records = db.relationship("Student", back_populates="batch")


class Student(db.Model):
    """Managed student identity (admin). Shadow `User` rows link via `student_record_id` for LMS APIs."""

    __tablename__ = "students"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey("batches.id", ondelete="RESTRICT"), nullable=False, index=True)

    batch = db.relationship("Batch", back_populates="student_records")
    shadow_user = db.relationship("User", back_populates="student_record", uselist=False)


class Faculty(db.Model):
    """Faculty identity for login. Shadow `User` rows (role Staff) link via `faculty_record_id`."""

    __tablename__ = "faculty"

    id = db.Column(db.String(64), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(255), nullable=True)
    teaching_load_hours = db.Column(db.SmallInteger, nullable=True)

    shadow_user = db.relationship("User", back_populates="faculty_record", uselist=False)

    __table_args__ = (
        CheckConstraint(
            "teaching_load_hours IS NULL OR (teaching_load_hours >= 1 AND teaching_load_hours <= 20)",
            name="ck_faculty_teaching_load",
        ),
    )


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, index=True)
    department = db.Column(db.String(255), nullable=True)
    teaching_load_hours = db.Column(db.SmallInteger, nullable=True)
    batch_id = db.Column(db.Integer, db.ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    student_record_id = db.Column(
        db.String(64),
        db.ForeignKey("students.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
    )
    faculty_record_id = db.Column(
        db.String(64),
        db.ForeignKey("faculty.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
    )
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    batch = db.relationship("Batch", back_populates="users", foreign_keys=[batch_id])
    student_record = db.relationship("Student", back_populates="shadow_user", foreign_keys=[student_record_id])
    faculty_record = db.relationship("Faculty", back_populates="shadow_user", foreign_keys=[faculty_record_id])
    courses_teaching = db.relationship("Course", back_populates="instructor", foreign_keys="Course.staff_id")

    __table_args__ = (
        CheckConstraint("role IN ('Student','Staff','Admin')", name="ck_users_role"),
        CheckConstraint(
            "role != 'Student' OR batch_id IS NOT NULL",
            name="ck_student_batch",
        ),
        CheckConstraint("role != 'Admin' OR batch_id IS NULL", name="ck_admin_batch_null"),
        CheckConstraint(
            "teaching_load_hours IS NULL OR (teaching_load_hours >= 1 AND teaching_load_hours <= 20)",
            name="ck_teaching_load",
        ),
    )


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(255), nullable=False)
    credits = db.Column(db.SmallInteger, nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    instructor = db.relationship("User", back_populates="courses_teaching", foreign_keys=[staff_id])
    assignments = db.relationship("Assignment", back_populates="course", cascade="all, delete-orphan")

    __table_args__ = (CheckConstraint("credits >= 1 AND credits <= 6", name="ck_course_credits"),)


class BatchCourse(db.Model):
    __tablename__ = "batch_courses"

    batch_id = db.Column(db.Integer, db.ForeignKey("batches.id", ondelete="CASCADE"), primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    due_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    course = db.relationship("Course", back_populates="assignments")
    submissions = db.relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="draft", index=True)
    marks = db.Column(db.SmallInteger, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    evaluated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    assignment = db.relationship("Assignment", back_populates="submissions")

    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_submission_assignment_student"),
        CheckConstraint("status IN ('draft','submitted','evaluated')", name="ck_submission_status"),
        CheckConstraint("marks IS NULL OR (marks >= 0 AND marks <= 100)", name="ck_submission_marks"),
    )


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = db.Column(db.String(64), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    icon_key = db.Column(db.String(32), nullable=False, default="bell")
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("icon_key IN ('bell','alert','check','info')", name="ck_notification_icon"),
    )


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    principal_kind = db.Column(db.String(20), nullable=False, default="user")
    jti = db.Column(db.String(36), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
