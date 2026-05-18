"""
middleware/security.py — HTTP security hardening for the Certification API.

Adds two protections:

1. SecurityHeadersMiddleware
   Injects defensive response headers on every reply:
   - X-Content-Type-Options: nosniff       — no MIME-sniffing
   - X-Frame-Options: DENY                 — no iframing
   - Referrer-Policy                        — minimal referrer leakage
   - Permissions-Policy                     — disable unused browser features

2. Body size guard (16 KB hard cap)
   Returns 413 before the body is even read, protecting against memory exhaustion
   from giant payloads.  The maximum question is 4 000 chars ≈ 4 KB, so 16 KB
   is a comfortable ceiling without being restrictive.
"""

import logging

from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from config import MAX_REQUEST_BODY_BYTES

logger = logging.getLogger("claude-certification.api")

# ── Constants ──────────────────────────────────────────────────────────────────

SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


class RequestBodyTooLarge(Exception):
    """Raised when the incoming request body exceeds the configured limit."""


def _too_large_response() -> JSONResponse:
    return JSONResponse(
        {
            "detail": (
                "Request body too large. Maximum allowed size is "
                f"{MAX_REQUEST_BODY_BYTES // 1024} KB."
            )
        },
        status_code=413,
    )


# ── Middleware ─────────────────────────────────────────────────────────────────

class SecurityHeadersMiddleware:
    """
    Inject security headers and enforce a maximum request body size.

    This is ASGI middleware instead of BaseHTTPMiddleware so the size limit also
    applies to streamed/chunked request bodies that do not send Content-Length.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        raw_content_length = headers.get("content-length")
        if raw_content_length:
            try:
                if int(raw_content_length) > MAX_REQUEST_BODY_BYTES:
                    logger.warning(
                        "413 — oversized body from %s (%s bytes declared)",
                        scope.get("client", ["unknown"])[0],
                        raw_content_length,
                    )
                    await _too_large_response()(scope, receive, send)
                    return
            except ValueError:
                pass  # malformed Content-Length — let FastAPI deal with it

        received_body_bytes = 0

        async def limited_receive() -> Message:
            nonlocal received_body_bytes

            message = await receive()
            if message["type"] == "http.request":
                received_body_bytes += len(message.get("body", b""))
                if received_body_bytes > MAX_REQUEST_BODY_BYTES:
                    raise RequestBodyTooLarge
            return message

        async def send_with_security_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                response_headers = MutableHeaders(scope=message)
                for header, value in SECURITY_HEADERS.items():
                    response_headers[header] = value
            await send(message)

        try:
            await self.app(scope, limited_receive, send_with_security_headers)
        except RequestBodyTooLarge:
            logger.warning(
                "413 — oversized streamed body from %s",
                scope.get("client", ["unknown"])[0],
            )
            await _too_large_response()(scope, receive, send_with_security_headers)
