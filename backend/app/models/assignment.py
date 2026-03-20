import uuid
from datetime import datetime, timezone
from ..extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=False)
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), nullable=False)
    staff_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    course = db.relationship("Course", back_populates="assignments")
    staff = db.relationship("User", back_populates="assignments_created", foreign_keys=[staff_id])
    submissions = db.relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else None,
            "course_code": self.course.code if self.course else None,
            "staff_id": self.staff_id,
            "staff_name": self.staff.name if self.staff else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
