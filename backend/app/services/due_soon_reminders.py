"""Create repeating due-soon notifications for students (last 24h before deadline, every 3h)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from app.models import Notification, Submission, User
from app.services.assignment_helpers import assignments_for_student
from app.services.notify import create_notification

DUE_SOON_TYPE = "assignment_due_soon"
DUE_SOON_WINDOW_HOURS = 24
REMINDER_INTERVAL_HOURS = 3


def _deadline_utc(due: date) -> datetime:
    """Interpret assignment due as end of calendar day UTC."""
    return datetime.combine(due, time(23, 59, 59), tzinfo=timezone.utc)


def ensure_assignment_due_soon_notifications(user: User) -> int:
    """
    For each visible assignment in the last 24h before its deadline, if not submitted,
    insert a notification at most once every REMINDER_INTERVAL_HOURS.

    Returns number of new notifications created (0+).
    """
    if (user.role or "").strip() != "Student":
        return 0

    items = assignments_for_student(user.batch_id)
    if not items:
        return 0

    now = datetime.now(timezone.utc)
    created = 0

    for a in items:
        sub = Submission.query.filter_by(assignment_id=a.id, student_id=user.id).first()
        if sub and sub.status in ("submitted", "evaluated"):
            continue

        deadline = _deadline_utc(a.due_date)
        if now > deadline:
            continue
        window_start = deadline - timedelta(hours=DUE_SOON_WINDOW_HOURS)
        if now < window_start:
            continue

        last = (
            Notification.query.filter_by(
                user_id=user.id,
                type=DUE_SOON_TYPE,
                assignment_id=a.id,
            )
            .order_by(Notification.created_at.desc())
            .first()
        )
        if last is not None and last.created_at:
            last_at = last.created_at
            if last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=timezone.utc)
            if (now - last_at) < timedelta(hours=REMINDER_INTERVAL_HOURS):
                continue

        course = a.course
        code = course.code if course else ""
        due_s = a.due_date.isoformat() if a.due_date else ""
        create_notification(
            user.id,
            DUE_SOON_TYPE,
            "Assignment due soon",
            f'"{a.title}" ({code}) is due on {due_s}. Submit if you have not already.',
            icon_key="alert",
            assignment_id=a.id,
        )
        created += 1

    return created
