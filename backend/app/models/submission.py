import uuid
from datetime import datetime, timezone
from ..extensions import db


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = db.Column(db.String(36), db.ForeignKey("assignments.id"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text)
    status = db.Column(
        db.Enum("draft", "submitted", "evaluated", name="submission_status"),
        default="draft",
        nullable=False,
    )
    marks = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    evaluated_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    assignment = db.relationship("Assignment", back_populates="submissions")
    student = db.relationship("User", back_populates="submissions", foreign_keys=[student_id])

    __table_args__ = (
        db.UniqueConstraint("assignment_id", "student_id", name="uq_submission_assignment_student"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "assignment_title": self.assignment.title if self.assignment else None,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "content": self.content,
            "status": self.status,
            "marks": self.marks,
            "feedback": self.feedback,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "evaluated_at": self.evaluated_at.isoformat() if self.evaluated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
