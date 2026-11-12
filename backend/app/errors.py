"""JSON error handling.

Every error uses the shape agreed in the handoff guide:

    {"error": {"code": "...", "message": "...", "details": {...}, "request_id": "..."}}

Stack traces and exception text are never sent to the client.
"""
from flask import g, jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

# Validation failures consistently return HTTP 400 Bad Request.
VALIDATION_STATUS = 400

_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "RATE_LIMITED",
}

_MESSAGES = {
    404: "The requested resource was not found.",
}


def error_response(status: int, code: str, message: str, details: dict | None = None):
    payload = {"code": code, "message": message}
    if details:
        payload["details"] = details
    request_id = g.get("request_id")
    if request_id:
        payload["request_id"] = request_id
    return jsonify({"error": payload}), status


def register_error_handlers(app) -> None:
    @app.errorhandler(ValidationError)
    def handle_validation_error(exc: ValidationError):
        return error_response(
            VALIDATION_STATUS,
            "VALIDATION_ERROR",
            "Please correct the highlighted fields.",
            exc.normalized_messages(),
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        status = exc.code or 500
        if status >= 500:
            # Also covers unhandled exceptions, which Flask wraps as a 500.
            return error_response(status, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.")
        code = _CODES.get(status, "HTTP_ERROR")
        message = _MESSAGES.get(status) or exc.description or exc.name
        return error_response(status, code, message)
