"""
main.py — FastAPI application factory for the Certification API.

This file is intentionally thin.  All heavy logic lives in dedicated modules:

  config.py           — environment variables, logging, constants
  models.py           — Pydantic request / response schemas
  services/claude.py  — Anthropic SDK wrapper (ask_claude)
  routers/health.py   — GET /  and  GET /api/health
  routers/claude.py   — POST /api/ask  and  GET /api/ask/demo

Run in development:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Or via the entry-point below:
    python main.py
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS, API_HOST, API_PORT, logger
from routers import claude as claude_router
from routers import health as health_router

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Certification API",
    description=(
        "REST API wrapping Anthropic Claude — learning / certification project.\n\n"
        "Interactive docs → **/docs** (Swagger UI) or **/redoc** (ReDoc)."
    ),
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
logger.info("CORS allowed origins: %s", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health_router.router)
app.include_router(claude_router.router)

# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting dev server on %s:%d", API_HOST, API_PORT)
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
