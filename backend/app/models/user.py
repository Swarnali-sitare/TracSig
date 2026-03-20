import uuid
from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("student", "staff", "admin", name="user_role"), nullable=False)
    department = db.Column(db.String(100))
    batch_id = db.Column(db.String(36), db.ForeignKey("batches.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    batch = db.relationship("Batch", back_populates="students", foreign_keys=[batch_id])
    courses_taught = db.relationship(
        "Course", back_populates="staff", foreign_keys="Course.staff_id"
    )
    assignments_created = db.relationship(
        "Assignment", back_populates="staff", foreign_keys="Assignment.staff_id"
    )
    submissions = db.relationship(
        "Submission", back_populates="student", foreign_keys="Submission.student_id"
    )
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self, include_sensitive: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "batch_id": self.batch_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data
