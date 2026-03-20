import uuid
from ..extensions import db


class BatchCourse(db.Model):
    __tablename__ = "batch_courses"

    batch_id = db.Column(db.String(36), db.ForeignKey("batches.id"), primary_key=True)
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), primary_key=True)

    batch = db.relationship("Batch", back_populates="batch_courses")
    course = db.relationship("Course", back_populates="batch_courses")


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100))
    credits = db.Column(db.Integer, default=3)
    staff_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    staff = db.relationship("User", back_populates="courses_taught", foreign_keys=[staff_id])
    assignments = db.relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    batch_courses = db.relationship("BatchCourse", back_populates="course", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "department": self.department,
            "credits": self.credits,
            "staff_id": self.staff_id,
            "staff_name": self.staff.name if self.staff else None,
        }
