from __future__ import annotations

from flask import Blueprint, g, send_file

from app.decorators import require_auth
from app.errors import ApiError
from app.extensions import db
from app.models import Submission, SubmissionAttachment
from app.services.submission_attachments import attachment_path, user_can_view_submission_attachment

files_bp = Blueprint("files", __name__)


@files_bp.get("/submissions/<int:sid>/attachments/<int:att_id>")
@require_auth
def serve_submission_attachment(sid: int, att_id: int):
    """Inline file for preview; Range supported for video."""
    if getattr(g, "env_admin", False) or not g.current_user:
        raise ApiError("FORBIDDEN", "Not available for this session", 403)

    att = db.session.get(SubmissionAttachment, att_id)
    if not att or att.submission_id != sid:
        raise ApiError("NOT_FOUND", "Attachment not found", 404)

    sub = db.session.get(Submission, sid)
    if not sub:
        raise ApiError("NOT_FOUND", "Submission not found", 404)

    if not user_can_view_submission_attachment(g.current_user, sub, att):
        raise ApiError("FORBIDDEN", "Access denied", 403)

    path = attachment_path(sid, att.stored_filename)
    if not path.is_file():
        raise ApiError("NOT_FOUND", "File missing on server", 404)

    return send_file(
        path,
        mimetype=att.mime_type or None,
        as_attachment=False,
        download_name=att.original_filename,
        conditional=True,
        etag=True,
        max_age=0,
    )
