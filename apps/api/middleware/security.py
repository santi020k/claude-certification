"""
middleware/security.py — HTTP security hardening for the Certification API.

Adds two protections:

1. SecurityHeadersMiddleware
   Injects defensive response headers on every reply:
   - X-Content-Type-Options: nosniff       — no MIME-sniffing
   - X-Frame-Options: DENY                 — no iframing
   - X-XSS-Protection: 1; mode=block       — legacy XSS filter (belt-and-suspenders)
   - Referrer-Policy                        — minimal referrer leakage
   - Permissions-Policy                     — disable unused browser features

2. Body size guard (16 KB hard cap)
   Returns 413 before the body is even read, protecting against memory exhaustion
   from giant payloads.  The maximum question is 4 000 chars ≈ 4 KB, so 16 KB
   is a comfortable ceiling without being restrictive.
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("claude-certification.api")

# ── Constants ──────────────────────────────────────────────────────────────────

MAX_BODY_BYTES: int = 16_384  # 16 KB — well above any valid request body

SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


# ── Middleware ─────────────────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject security headers and enforce a maximum request body size."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # ── Body size guard ────────────────────────────────────────────────────
        raw_content_length = request.headers.get("content-length")
        if raw_content_length:
            try:
                if int(raw_content_length) > MAX_BODY_BYTES:
                    logger.warning(
                        "413 — oversized body from %s (%s bytes declared)",
                        request.client.host if request.client else "unknown",
                        raw_content_length,
                    )
                    return JSONResponse(
                        {"detail": f"Request body too large. Maximum allowed size is {MAX_BODY_BYTES // 1024} KB."},
                        status_code=413,
                    )
            except ValueError:
                pass  # malformed Content-Length — let FastAPI deal with it

        # ── Normal request ─────────────────────────────────────────────────────
        response: Response = await call_next(request)

        # ── Inject headers ─────────────────────────────────────────────────────
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value

        return response
