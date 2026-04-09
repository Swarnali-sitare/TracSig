from __future__ import annotations

from calendar import month_abbr
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from app.extensions import db
from app.models import Assignment, Course, Enrollment, Submission, User
from app.services.assignment_helpers import (
    assignments_for_student,
    display_status,
    eligible_students_for_course,
    submitted_count_for_assignment,
)


def _month_key(d: date) -> str:
    return month_abbr[d.month]


def student_dashboard(user: User) -> dict:
    today = date.today()
    items = assignments_for_student(user.batch_id)
    subs_by_aid = {}
    if items:
        aids = [a.id for a in items]
        for s in Submission.query.filter(
            Submission.student_id == user.id,
            Submission.assignment_id.in_(aids),
        ).all():
            subs_by_aid[s.assignment_id] = s

    total = len(items)
    completed = pending = incomplete = 0
    for a in items:
        sub = subs_by_aid.get(a.id)
        ds = display_status(a.due_date, sub)
        if ds == "Completed":
            completed += 1
        elif ds == "Pending":
            pending += 1
        else:
            incomplete += 1

    # Weekly completion (last 7 calendar days, server local weekday)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = [{ "day": day_names[i], "completed": 0 } for i in range(7)]
    start = today - timedelta(days=6)
    subs_week = Submission.query.filter(
        Submission.student_id == user.id,
        Submission.status.in_(("submitted", "evaluated")),
        Submission.submitted_at.isnot(None),
        Submission.submitted_at >= datetime.combine(start, datetime.min.time()).replace(tzinfo=timezone.utc),
    ).all()
    for s in subs_week:
        if not s.submitted_at:
            continue
        d = s.submitted_at.date()
        if d < start or d > today:
            continue
        idx = d.weekday()
        weekly[idx]["completed"] += 1

    # Monthly: assignments due in last 6 months
    monthly_map: dict[str, int] = defaultdict(int)
    six_mo_ago = today.replace(day=1)
    for _ in range(5):
        if six_mo_ago.month == 1:
            six_mo_ago = six_mo_ago.replace(year=six_mo_ago.year - 1, month=12)
        else:
            six_mo_ago = six_mo_ago.replace(month=six_mo_ago.month - 1)
    for a in items:
        if a.due_date >= six_mo_ago:
            monthly_map[_month_key(a.due_date)] += 1
    monthly = [{"month": m, "assignments": monthly_map.get(m, 0)} for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]]
    monthly = [x for x in monthly if x["assignments"] or any(monthly_map.values())][:6]
    if not monthly:
        monthly = [{"month": _month_key(today), "assignments": total}]

    upcoming = []
    for a in sorted([x for x in items if x.due_date >= today], key=lambda x: x.due_date)[:3]:
        sub = subs_by_aid.get(a.id)
        upcoming.append(
            {
                "id": a.id,
                "title": a.title,
                "course_code": a.course.code,
                "due_date": a.due_date.isoformat(),
                "display_status": display_status(a.due_date, sub),
            }
        )

    recent = []
    done = [
        (a, subs_by_aid.get(a.id))
        for a in items
        if subs_by_aid.get(a.id) and subs_by_aid[a.id].status in ("submitted", "evaluated")
    ]
    done.sort(
        key=lambda t: t[1].submitted_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    for a, sub in done[:3]:
        recent.append(
            {
                "title": a.title,
                "course_code": a.course.code,
                "submitted_on": sub.submitted_at.date().isoformat() if sub and sub.submitted_at else a.due_date.isoformat(),
            }
        )

    return {
        "stats": {
            "total_assignments": total,
            "completed": completed,
            "pending": pending,
            "incomplete": incomplete,
        },
        "weekly_completion": weekly,
        "monthly_statistics": monthly[-6:] if len(monthly) > 6 else monthly,
        "upcoming_assignments": upcoming,
        "recent_submissions": recent,
    }


def _staff_course_ids(user_id: int) -> list[int]:
    return [c.id for c in Course.query.filter_by(staff_id=user_id).all()]


def staff_dashboard(user: User) -> dict:
    my_assignments = Assignment.query.filter_by(staff_id=user.id).all()
    course_ids = _staff_course_ids(user.id)
    assignments_created = len(my_assignments)

    batch_ids_set = set()
    for cid in course_ids:
        for bc in Enrollment.query.filter_by(course_id=cid).all():
            batch_ids_set.add(bc.batch_id)
    total_students = (
        db.session.scalar(
            select(func.count()).select_from(User).where(User.role == "Student", User.batch_id.in_(batch_ids_set))
        )
        if batch_ids_set
        else 0
    ) or 0

    submissions_count = (
        db.session.scalar(
            select(func.count())
            .select_from(Submission)
            .join(Assignment)
            .where(Assignment.staff_id == user.id, Submission.status.in_(("submitted", "evaluated")))
        )
        or 0
    )

    pending_evaluation_count = (
        db.session.scalar(
            select(func.count())
            .select_from(Submission)
            .join(Assignment)
            .where(Assignment.staff_id == user.id, Submission.status == "submitted")
        )
        or 0
    )

    eligible_pairs = 0
    completed_pairs = 0
    for a in my_assignments:
        ec = eligible_students_for_course(a.course_id)
        eligible_pairs += ec
        completed_pairs += submitted_count_for_assignment(a.id)
    completion_rate = round(100.0 * completed_pairs / eligible_pairs, 1) if eligible_pairs else 0.0

    pie_completed = pie_pending = pie_incomplete = 0
    for a in my_assignments:
        batch_ids = [r.batch_id for r in Enrollment.query.filter_by(course_id=a.course_id).all()]
        if not batch_ids:
            continue
        studs = User.query.filter(User.role == "Student", User.batch_id.in_(batch_ids)).all()
        for stu in studs:
            sub = Submission.query.filter_by(assignment_id=a.id, student_id=stu.id).first()
            ds = display_status(a.due_date, sub)
            if ds == "Completed":
                pie_completed += 1
            elif ds == "Pending":
                pie_pending += 1
            else:
                pie_incomplete += 1

    completion_data = [
        {"name": "Completed", "value": pie_completed, "color": "var(--success)"},
        {"name": "Pending", "value": pie_pending, "color": "var(--warning)"},
        {"name": "Incomplete", "value": pie_incomplete, "color": "var(--error)"},
    ]

    recent_rows = []
    for a in sorted(my_assignments, key=lambda x: x.created_at, reverse=True)[:5]:
        students_n = eligible_students_for_course(a.course_id)
        sub_n = submitted_count_for_assignment(a.id)
        recent_rows.append(
            {
                "id": a.id,
                "title": a.title,
                "course": a.course.code,
                "students": students_n,
                "submitted": sub_n,
                "due_date": a.due_date.isoformat(),
            }
        )

    # Average of each assignment's submission rate (%), e.g. (100% + 90%) / 2 = 95%.
    per_assignment_rates: list[float] = []
    for a in my_assignments:
        ec = eligible_students_for_course(a.course_id)
        if ec <= 0:
            continue
        sub_n = submitted_count_for_assignment(a.id)
        pct = min(100.0, 100.0 * float(sub_n) / float(ec))
        per_assignment_rates.append(pct)
    avg_assignment_submission_rate_percent = (
        round(sum(per_assignment_rates) / len(per_assignment_rates), 1)
        if per_assignment_rates
        else None
    )

    return {
        "assignments_created": assignments_created,
        "total_students": int(total_students),
        "submissions_count": int(submissions_count),
        "pending_evaluation_count": int(pending_evaluation_count),
        "completion_rate_percent": completion_rate,
        "avg_assignment_submission_rate_percent": avg_assignment_submission_rate_percent,
        "completion_data": completion_data,
        "recent_assignments": recent_rows,
    }
