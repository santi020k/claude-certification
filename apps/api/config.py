"""
config.py — Central configuration for the Certification API.

Loads environment variables, sets up logging, and exposes typed constants
used across the rest of the application.  Import from here instead of
calling `os.getenv` directly in your routes or services.
"""

import os
import logging
from typing import Optional

from dotenv import load_dotenv

# ── Load .env ─────────────────────────────────────────────────────────────────
# python-dotenv searches for .env starting in cwd and walking up the tree,
# so running from apps/api/ or the repo root both work.
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("claude-certification.api")

def _csv_env(name: str, default: str) -> list[str]:
    """Parse comma-separated env values while trimming empty entries."""
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _int_env(name: str, default: int) -> int:
    """Read a positive integer env value with a clear startup error."""
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc

    if value <= 0:
        raise RuntimeError(f"{name} must be greater than zero")

    return value


def _float_env(name: str, default: float) -> float:
    """Read a positive float env value with a clear startup error."""
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        value = float(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number") from exc

    if value <= 0:
        raise RuntimeError(f"{name} must be greater than zero")

    return value

# ── Runtime ───────────────────────────────────────────────────────────────────
APP_ENV: str = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION: bool = APP_ENV == "production"

# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated list of origins allowed to call this API from the browser.
# Example .env value:  ALLOWED_ORIGINS=http://localhost:3000,https://my-app.com
ALLOWED_ORIGINS: list[str] = _csv_env("ALLOWED_ORIGINS", "http://localhost:3000")

if IS_PRODUCTION and "*" in ALLOWED_ORIGINS:
    raise RuntimeError("ALLOWED_ORIGINS cannot contain '*' in production")

# ── Anthropic ─────────────────────────────────────────────────────────────────
# The SDK reads ANTHROPIC_API_KEY from the environment automatically, but
# we expose the key presence here so the health endpoint can report on it.
ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_KEY_CONFIGURED: bool = bool(
    ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your-api-key-here"
)

# claude-sonnet-4-0 offers the best balance of speed and intelligence for
# most certification/demo use-cases. Override with ANTHROPIC_MODEL if needed.
# MODEL is also accepted for compatibility with the project notes.
MODEL: str = os.getenv("ANTHROPIC_MODEL") or os.getenv("MODEL") or "claude-sonnet-4-0"
ANTHROPIC_TIMEOUT_SECONDS: float = _float_env("ANTHROPIC_TIMEOUT_SECONDS", 30.0)

# ── Server ────────────────────────────────────────────────────────────────────
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = _int_env("API_PORT", 8000)

# ── API protection ────────────────────────────────────────────────────────────
MAX_REQUEST_BODY_BYTES: int = _int_env("MAX_REQUEST_BODY_BYTES", 16_384)
ASK_RATE_LIMIT: str = os.getenv("ASK_RATE_LIMIT", "10/minute")
DEMO_RATE_LIMIT: str = os.getenv("DEMO_RATE_LIMIT", "5/minute")
