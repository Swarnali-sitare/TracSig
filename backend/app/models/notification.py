import uuid
from datetime import datetime, timezone
from ..extensions import db

NOTIFICATION_ICONS = {
    "assignment": "BookOpen",
    "deadline": "Clock",
    "evaluated": "CheckCircle",
    "submitted": "Send",
    "system": "Bell",
}


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, default="system")
    title = db.Column(db.String(300), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    icon_key = db.Column(db.String(50), default="Bell")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="notifications")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "icon_key": self.icon_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
