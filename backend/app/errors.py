from flask import Flask, jsonify


class ApiError(Exception):
    def __init__(self, code: str, message: str, http_status: int = 400, details: list | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or []


def register_error_handlers(app: Flask) -> None:
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
