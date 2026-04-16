from __future__ import annotations

import os
import uuid
from pathlib import Path

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.errors import ApiError
from app.extensions import db
from app.models import Assignment, Submission, SubmissionAttachment, User

# Faculty-configurable max (bytes); global Flask MAX_CONTENT_LENGTH should be slightly higher.
MAX_ASSIGNMENT_FILE_BYTES = 50 * 1024 * 1024
MIN_ASSIGNMENT_FILE_BYTES = 1024  # 1 KB floor when uploads are enabled
MAX_FILES_PER_SUBMISSION = 20

_ALLOWED_PREFIXES = (
    "image/",
    "video/",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
)
_ALLOWED_EXACT = frozenset(
    {
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/rtf",
        "text/csv",
        "text/markdown",
    }
)


def _mime_allowed(mime: str) -> bool:
    m = (mime or "").strip().lower()
    if m in _ALLOWED_EXACT:
        return True
    return any(m.startswith(p) for p in _ALLOWED_PREFIXES)


def submission_upload_dir(submission_id: int) -> Path:
    base = Path(current_app.instance_path) / "uploads" / "submissions" / str(submission_id)
    base.mkdir(parents=True, exist_ok=True)
    return base


def attachment_path(submission_id: int, stored_filename: str) -> Path:
    return submission_upload_dir(submission_id) / stored_filename


def parse_attachment_settings(data: dict) -> tuple[bool, int | None, int | None]:
    """Returns (attachments_enabled, min_upload_bytes, max_upload_bytes)."""
    enabled = bool(data.get("attachments_enabled"))
    if not enabled:
        return False, None, None
    min_b = data.get("min_upload_bytes")
    max_b = data.get("max_upload_bytes")
    if min_b is None or max_b is None:
        raise ApiError("VALIDATION_ERROR", "min_upload_bytes and max_upload_bytes are required when uploads are enabled", 422)
    try:
        min_b = int(min_b)
        max_b = int(max_b)
    except (TypeError, ValueError) as e:
        raise ApiError("VALIDATION_ERROR", "Invalid min_upload_bytes or max_upload_bytes", 422) from e
    if min_b < MIN_ASSIGNMENT_FILE_BYTES or max_b > MAX_ASSIGNMENT_FILE_BYTES:
        raise ApiError(
            "VALIDATION_ERROR",
            f"Per-file size must be between {MIN_ASSIGNMENT_FILE_BYTES} bytes (1 KB) and {MAX_ASSIGNMENT_FILE_BYTES} bytes (50 MB)",
            422,
        )
    if min_b > max_b:
        raise ApiError("VALIDATION_ERROR", "min_upload_bytes cannot exceed max_upload_bytes", 422)
    return True, min_b, max_b


def serialize_attachment(att: SubmissionAttachment) -> dict:
    return {
        "id": att.id,
        "original_filename": att.original_filename,
        "mime_type": att.mime_type,
        "size_bytes": att.size_bytes,
        "created_at": att.created_at.isoformat() if att.created_at else None,
    }


def delete_attachment_files(att: SubmissionAttachment) -> None:
    p = attachment_path(att.submission_id, att.stored_filename)
    try:
        p.unlink(missing_ok=True)
    except OSError:
        pass


def cleanup_submission_upload_dir(submission_id: int) -> None:
    d = Path(current_app.instance_path) / "uploads" / "submissions" / str(submission_id)
    if not d.is_dir():
        return
    try:
        for child in d.iterdir():
            try:
                child.unlink()
            except OSError:
                pass
        d.rmdir()
    except OSError:
        pass


def read_limited_file(storage: FileStorage, max_bytes: int) -> bytes:
    """Read at most max_bytes + 1 to detect oversize without loading entire file into memory."""
    chunk_size = 1024 * 64
    out = bytearray()
    while True:
        piece = storage.read(chunk_size)
        if not piece:
            break
        out.extend(piece)
        if len(out) > max_bytes:
            raise ApiError("VALIDATION_ERROR", "File exceeds maximum allowed size for this assignment", 422)
    return bytes(out)


def save_upload_for_submission(
    *,
    assignment: Assignment,
    submission: Submission,
    file_storage: FileStorage,
) -> SubmissionAttachment:
    if not assignment.attachments_enabled:
        raise ApiError("FORBIDDEN", "File uploads are not enabled for this assignment", 403)
    min_b = assignment.min_upload_bytes
    max_b = assignment.max_upload_bytes
    if min_b is None or max_b is None:
        raise ApiError("CONFLICT", "Assignment attachment limits are not configured", 409)

    if submission.status != "draft":
        raise ApiError("CONFLICT", "Cannot add files after submit", 409)

    count = SubmissionAttachment.query.filter_by(submission_id=submission.id).count()
    if count >= MAX_FILES_PER_SUBMISSION:
        raise ApiError("VALIDATION_ERROR", f"At most {MAX_FILES_PER_SUBMISSION} files per submission", 422)

    mime = (file_storage.mimetype or "application/octet-stream").strip().lower()
    if not _mime_allowed(mime):
        raise ApiError(
            "VALIDATION_ERROR",
            "File type not allowed. Use images, PDF, common documents, or video (mp4/webm/mov).",
            422,
        )

    raw_name = file_storage.filename or "file"
    safe = secure_filename(raw_name) or "file"
    ext = Path(safe).suffix.lower()
    if ext in {".exe", ".bat", ".cmd", ".sh", ".dll", ".scr"}:
        raise ApiError("VALIDATION_ERROR", "This file extension is not allowed", 422)

    stored = f"{uuid.uuid4().hex}{ext}"
    data = read_limited_file(file_storage, max_b)
    size = len(data)
    if size < min_b:
        raise ApiError(
            "VALIDATION_ERROR",
            f"Each file must be at least {min_b} bytes for this assignment",
            422,
        )

    udir = submission_upload_dir(submission.id)
    dest = udir / stored
    tmp = dest.with_suffix(dest.suffix + ".part")
    try:
        with open(tmp, "wb") as f:
            f.write(data)
        os.replace(tmp, dest)
    except OSError as e:
        raise ApiError("INTERNAL_ERROR", "Could not store file", 500) from e

    att = SubmissionAttachment(
        submission_id=submission.id,
        original_filename=safe[:500],
        stored_filename=stored,
        mime_type=mime[:255],
        size_bytes=size,
    )
    db.session.add(att)
    db.session.flush()
    return att


def user_can_view_submission_attachment(user: User, sub: Submission, att: SubmissionAttachment) -> bool:
    if att.submission_id != sub.id:
        return False
    a = sub.assignment
    if not a:
        return False
    role = (user.role or "").strip()
    if role == "Student":
        return sub.student_id == user.id
    if role == "Staff":
        return a.staff_id == user.id
    return False


def delete_submission_attachment_for_student(
    *,
    assignment: Assignment,
    submission: Submission,
    att: SubmissionAttachment,
) -> None:
    if not assignment.attachments_enabled:
        raise ApiError("FORBIDDEN", "File uploads are not enabled for this assignment", 403)
    if submission.status != "draft":
        raise ApiError("CONFLICT", "Cannot remove files after submit", 409)
    delete_attachment_files(att)
    db.session.delete(att)
