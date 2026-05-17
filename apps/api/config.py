"""
config.py — Central configuration for the Certification API.

Loads environment variables, sets up logging, and exposes typed constants
used across the rest of the application.  Import from here instead of
calling `os.getenv` directly in your routes or services.
"""

import logging
import os

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

# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated list of origins allowed to call this API from the browser.
# Example .env value:  ALLOWED_ORIGINS=http://localhost:3000,https://my-app.com
_raw_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",")]

# ── Anthropic ─────────────────────────────────────────────────────────────────
# The SDK reads ANTHROPIC_API_KEY from the environment automatically, but
# we expose the key presence here so the health endpoint can report on it.
ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")

# claude-sonnet-4-0 offers the best balance of speed and intelligence for
# most certification/demo use-cases.  Override with MODEL env var if needed.
MODEL: str = os.getenv("MODEL", "claude-sonnet-4-0")

# ── Server ────────────────────────────────────────────────────────────────────
APP_ENV: str = os.getenv("APP_ENV", "development")
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("API_PORT", "8000"))
