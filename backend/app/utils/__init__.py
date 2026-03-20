from flask import jsonify
from typing import Any


def success(data: Any = None, message: str = "Success", status_code: int = 200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def error(message: str = "An error occurred", status_code: int = 400, errors: Any = None):
    payload = {"success": False, "message": message}
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code
