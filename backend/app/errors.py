from flask import Flask, has_request_context, jsonify, request
from sqlalchemy.exc import OperationalError as SAOperationalError
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, code: str, message: str, http_status: int = 400, details: list | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or []


def attach_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return (
            jsonify({"error": {"code": err.code, "message": err.message, "details": err.details}}),
            err.http_status,
        )

    @app.errorhandler(404)
    def handle_404(_e):
        return (
            jsonify(
                {
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Resource not found",
                        "details": [],
                    }
                }
            ),
            404,
        )

    @app.errorhandler(405)
    def handle_405(_e):
        return (
            jsonify(
                {
                    "error": {
                        "code": "BAD_REQUEST",
                        "message": "Method not allowed",
                        "details": [],
                    }
                }
            ),
            405,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception):
        """Return JSON (not HTML) for unhandled errors under /api so the SPA can show a message."""
        if isinstance(err, ApiError):
            return (
                jsonify({"error": {"code": err.code, "message": err.message, "details": err.details}}),
                err.http_status,
            )
        if isinstance(err, HTTPException):
            return err
        if not has_request_context() or not request.path.startswith("/api"):
            raise err
        app.logger.exception("Unhandled API error: %s", err)
        if isinstance(err, SAOperationalError):
            low = str(err).lower()
            if any(
                x in low
                for x in (
                    "password authentication",
                    "could not connect",
                    "connection refused",
                    "timeout",
                    "named pipe",
                )
            ):
                return (
                    jsonify(
                        {
                            "error": {
                                "code": "DATABASE_UNAVAILABLE",
                                "message": (
                                    "Cannot connect to the database. Check DATABASE_URL in backend/.env "
                                    "and that the database server is running."
                                ),
                                "details": [],
                            }
                        }
                    ),
                    503,
                )
        return (
            jsonify(
                {
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": (
                            "Server error. Check the API logs. If you recently pulled code changes, run "
                            "./venv/bin/flask sync-schema from the backend folder, then restart the API."
                        ),
                        "details": [],
                    }
                }
            ),
            500,
        )
