import uuid
from ..extensions import db


class Batch(db.Model):
    __tablename__ = "batches"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)

    students = db.relationship("User", back_populates="batch", foreign_keys="User.batch_id")
    batch_courses = db.relationship("BatchCourse", back_populates="batch", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "year": self.year,
        }
