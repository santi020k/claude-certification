"""
routers/health.py — Health-check endpoints.

These endpoints let you quickly verify that:
  • The server is reachable (GET /)
  • The right environment variables are loaded (GET /api/health)

They are intentionally kept free of Claude calls so they stay fast and
can be used as liveness / readiness probes in production infrastructure.
"""

import logging

from fastapi import APIRouter

from config import ALLOWED_ORIGINS, ANTHROPIC_API_KEY_CONFIGURED, APP_ENV, MODEL
from models import HealthResponse

logger = logging.getLogger("claude-certification.api")

router = APIRouter(tags=["health"])


@router.get("/")
def root() -> dict[str, str]:
    """
    Root endpoint — quick sanity check.

    Paste `http://localhost:8000/` in a browser to confirm the server is up.
    """
    logger.info("GET /")
    return {
        "status": "ok",
        "message": "Certification API is running 🚀",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@router.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """
    Detailed health check — returns environment info.

    **Never** exposes the actual API key value; only reports whether it's set.
    Safe to call from monitoring tools or a frontend status page.
    """
    logger.info(
        "GET /api/health — env=%s, api_key_set=%s",
        APP_ENV,
        ANTHROPIC_API_KEY_CONFIGURED,
    )

    return HealthResponse(
        status="ok",
        environment=APP_ENV,
        anthropic_api_key_configured=ANTHROPIC_API_KEY_CONFIGURED,
        model=MODEL,
        allowed_origins=ALLOWED_ORIGINS,
    )
