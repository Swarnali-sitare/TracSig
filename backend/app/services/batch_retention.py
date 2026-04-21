"""Delete assignment submissions for batches long past their end date (retention policy)."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models import Batch, Submission, User
from app.services.submission_attachments import attachment_path, cleanup_submission_upload_dir


def purge_submissions_after_batch_retention(*, retention_days: int, dry_run: bool = False) -> dict:
    """
    For each batch with end_date set and end_date < (today - retention_days),
    delete all submissions for students in that batch. Attachment rows cascade;
    files on disk are removed after a successful DB commit.

    Returns a summary dict.
    """
    if retention_days < 1:
        raise ValueError("retention_days must be at least 1")

    threshold = date.today() - timedelta(days=retention_days)
    batches = (
        Batch.query.filter(Batch.end_date.isnot(None), Batch.end_date < threshold)
        .order_by(Batch.id.asc())
        .all()
    )

    deleted_submissions = 0
    errors: list[str] = []

    for batch in batches:
        student_ids = [u.id for u in User.query.filter_by(role="Student", batch_id=batch.id).all()]
        if not student_ids:
            continue

        subs = (
            Submission.query.options(joinedload(Submission.attachment_rows))
            .filter(Submission.student_id.in_(student_ids))
            .all()
        )

        for sub in subs:
            if dry_run:
                deleted_submissions += 1
                continue

            sub_id = sub.id
            stored_names = [a.stored_filename for a in sub.attachment_rows]

            try:
                db.session.delete(sub)
                db.session.commit()
            except Exception as e:  # noqa: BLE001
                db.session.rollback()
                errors.append(f"submission {sub_id}: {e}")
                continue

            deleted_submissions += 1

            for name in stored_names:
                try:
                    attachment_path(sub_id, name).unlink(missing_ok=True)
                except OSError as oe:
                    errors.append(f"submission {sub_id} file {name}: {oe}")

            try:
                cleanup_submission_upload_dir(sub_id)
            except OSError as oe:
                errors.append(f"submission {sub_id} dir: {oe}")

    return {
        "retention_days": retention_days,
        "cutoff_batches_ended_before": threshold.isoformat(),
        "batches_eligible": len(batches),
        "submissions_deleted": deleted_submissions,
        "dry_run": dry_run,
        "errors": errors,
    }
