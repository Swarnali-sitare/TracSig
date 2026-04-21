from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.decorators import require_auth
from app.errors import ApiError
from app.extensions import db
from app.models import Notification
from app.services.due_soon_reminders import ensure_assignment_due_soon_notifications

notifications_bp = Blueprint("notifications", __name__)


def _serialize(n: Notification) -> dict:
    return {
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "icon_key": n.icon_key,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


@notifications_bp.get("")
@require_auth
def list_notifications():
    if getattr(g, "env_admin", False):
        return jsonify({"items": []})
    if g.current_user and (g.current_user.role or "").strip() == "Student":
        ensure_assignment_due_soon_notifications(g.current_user)
        db.session.commit()
    unread_only = (request.args.get("unread_only") or "").lower() in ("1", "true", "yes")
    q = Notification.query.filter_by(user_id=g.current_user.id).order_by(Notification.created_at.desc())
    if unread_only:
        q = q.filter_by(is_read=False)
    items = [_serialize(n) for n in q.all()]
    return jsonify({"items": items})


@notifications_bp.patch("/<int:nid>/read")
@require_auth
def mark_read(nid: int):
    if getattr(g, "env_admin", False):
        raise ApiError("NOT_FOUND", "Notification not found", 404)
    n = Notification.query.filter_by(id=nid, user_id=g.current_user.id).first()
    if not n:
        raise ApiError("NOT_FOUND", "Notification not found", 404)
    n.is_read = True
    db.session.commit()
    return jsonify({"ok": True})


@notifications_bp.patch("/read-all")
@require_auth
def mark_all_read():
    if getattr(g, "env_admin", False):
        return jsonify({"ok": True})
    Notification.query.filter_by(user_id=g.current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"ok": True})


@notifications_bp.delete("/<int:nid>")
@require_auth
def delete_one(nid: int):
    if getattr(g, "env_admin", False):
        raise ApiError("NOT_FOUND", "Notification not found", 404)
    n = Notification.query.filter_by(id=nid, user_id=g.current_user.id).first()
    if not n:
        raise ApiError("NOT_FOUND", "Notification not found", 404)
    db.session.delete(n)
    db.session.commit()
    return "", 204


@notifications_bp.delete("")
@require_auth
def delete_all():
    if getattr(g, "env_admin", False):
        return "", 204
    Notification.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()
    return "", 204
