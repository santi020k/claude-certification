"""
main.py — FastAPI application factory for the Certification API.

This file is intentionally thin.  All heavy logic lives in dedicated modules:

  config.py                   — environment variables, logging, constants
  models.py                   — Pydantic request / response schemas
  services/claude.py          — Anthropic SDK wrapper (ask_claude)
  routers/health.py           — GET /  and  GET /api/health
  routers/claude.py           — POST /api/ask  and  GET /api/ask/demo
  middleware/rate_limit.py    — slowapi Limiter (per-IP rate limiting)
  middleware/security.py      — security headers + body-size guard

Security layers
---------------
1. CORS           — only allow configured origins (ALLOWED_ORIGINS env var)
2. Rate limiting  — 10 req/min on /api/ask, 5 req/min on /api/ask/demo
3. Body size cap  — 413 for payloads > 16 KB
4. Security hdrs  — X-Content-Type-Options, X-Frame-Options, etc.
5. Input clean    — Pydantic validator strips control chars on every request

Run in development:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Or via the entry-point below:
    python main.py
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import (
    ALLOWED_ORIGINS,
    API_HOST,
    API_PORT,
    ASK_RATE_LIMIT,
    DEMO_RATE_LIMIT,
    logger,
)
from middleware.rate_limit import limiter
from middleware.security import SecurityHeadersMiddleware
from routers import accessibility as accessibility_router
from routers import claude as claude_router
from routers import health as health_router

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Certification API",
    description=(
        "REST API wrapping Anthropic Claude — learning / certification project.\n\n"
        "Interactive docs → **/docs** (Swagger UI) or **/redoc** (ReDoc).\n\n"
        "**Rate limits** (per remote IP):\n"
        f"- `POST /api/ask` — {ASK_RATE_LIMIT}\n"
        f"- `GET /api/ask/demo` — {DEMO_RATE_LIMIT}\n"
    ),
    version="0.2.0",
)

# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_middleware(SlowAPIMiddleware)

# ---------------------------------------------------------------------------
# Security headers + body-size guard
# ---------------------------------------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
logger.info("CORS allowed origins: %s", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials="*" not in ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],   # explicit — no PUT/DELETE/PATCH
    allow_headers=["Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health_router.router)
app.include_router(claude_router.router)
app.include_router(accessibility_router.router)

# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting dev server on %s:%d", API_HOST, API_PORT)
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
