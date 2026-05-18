"""
middleware/rate_limit.py — Shared slowapi Limiter instance.

Import `limiter` wherever you need to decorate route handlers with rate
limits.  The limiter is keyed by remote IP address (respects X-Forwarded-For
when the app runs behind a trusted proxy).

Limits applied per route
------------------------
POST /api/ask       10 / minute   — costs a real Anthropic API call
GET  /api/ask/demo   5 / minute   — same cost, simpler to abuse
GET  /api/health   unlimited      — cheap, no AI call involved

The `headers_enabled=True` flag injects standard X-RateLimit-* response
headers so the frontend (and curl users) can see their remaining budget.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    headers_enabled=True,          # X-RateLimit-Limit / Remaining / Reset
    swallow_errors=False,          # surface config mistakes during development
)
