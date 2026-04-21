from __future__ import annotations

from app.extensions import db
from app.models import Notification


def create_notification(
    user_id: int,
    type_: str,
    title: str,
    message: str,
    icon_key: str = "bell",
    assignment_id: int | None = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        message=message,
        icon_key=icon_key if icon_key in ("bell", "alert", "check", "info") else "bell",
        assignment_id=assignment_id,
    )
    db.session.add(n)
    return n
