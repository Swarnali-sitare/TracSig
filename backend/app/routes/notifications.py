from flask import Blueprint, request, g

from ..extensions import db
from ..models.notification import Notification
from ..utils import success, error
from ..middleware.auth import jwt_required_custom

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
@jwt_required_custom
def list_notifications():
    user = g.current_user
    notifs = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return success([n.to_dict() for n in notifs])


@notifications_bp.patch("/<string:notif_id>/read")
@jwt_required_custom
def mark_read(notif_id):
    user = g.current_user
    notif = Notification.query.filter_by(id=notif_id, user_id=user.id).first()
    if not notif:
        return error("Notification not found", 404)
    notif.is_read = True
    db.session.commit()
    return success(notif.to_dict(), "Marked as read")


@notifications_bp.patch("/read-all")
@jwt_required_custom
def mark_all_read():
    user = g.current_user
    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return success(message="All notifications marked as read")


@notifications_bp.delete("/<string:notif_id>")
@jwt_required_custom
def delete_notification(notif_id):
    user = g.current_user
    notif = Notification.query.filter_by(id=notif_id, user_id=user.id).first()
    if not notif:
        return error("Notification not found", 404)
    db.session.delete(notif)
    db.session.commit()
    return success(message="Notification deleted")


@notifications_bp.delete("")
@jwt_required_custom
def clear_all_notifications():
    user = g.current_user
    Notification.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return success(message="All notifications cleared")
