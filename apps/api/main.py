"""
FastAPI backend for the Certification project.

This service exposes a REST API that uses the Anthropic Claude model
to answer questions. It's designed to be deployed on Cloudflare Workers
(via a Python runtime) or any Python-compatible host.

Endpoints:
  GET  /               → Health check — confirms the API is alive
  GET  /api/health     → Detailed health check with env info
  POST /api/ask        → Send a question to Claude, get a JSON answer
  GET  /api/ask/demo   → Quick demo — asks Claude about quantum computing
"""

import os
import logging

# ── Load .env ────────────────────────────────────────────────────────────────
# python-dotenv reads the .env file at the repo root (or apps/api/.env) so
# you don't need to export variables manually in your shell during development.
from dotenv import load_dotenv
load_dotenv()  # looks for .env in cwd, then parent dirs

# ── Logging ──────────────────────────────────────────────────────────────────
# Logs are your best friend while learning — they show you exactly what's
# happening at runtime. In production you'd dial this back to WARNING or ERROR.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("claude-certification.api")

# ── FastAPI & CORS ────────────────────────────────────────────────────────────
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Anthropic ─────────────────────────────────────────────────────────────────
from anthropic import Anthropic

# ---------------------------------------------------------------------------
# App instantiation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Certification API",
    description="REST API wrapping Anthropic Claude — learning project",
    version="0.1.0",
    # OpenAPI docs available at /docs (Swagger UI) and /redoc
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server (and any origins listed in .env) to
# call this API from the browser.
# ---------------------------------------------------------------------------
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],   # GET, POST, PUT, DELETE, OPTIONS …
    allow_headers=["*"],   # Content-Type, Authorization …
)

# ---------------------------------------------------------------------------
# Anthropic client — reads ANTHROPIC_API_KEY from the environment automatically
# ---------------------------------------------------------------------------
anthropic_client = Anthropic()
# Claude model to use.  claude-sonnet-4-0 is a fast, capable model.
MODEL = "claude-sonnet-4-0"

logger.info("Anthropic client ready — model: %s", MODEL)


# ---------------------------------------------------------------------------
# Pydantic models (request / response shapes)
# These become part of the auto-generated OpenAPI spec at /docs
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    """Body expected by POST /api/ask"""
    question: str                   # The question you want Claude to answer
    max_tokens: int = 1000          # Upper limit on Claude's response length
    one_sentence: bool = False      # When True, asks Claude to answer briefly

class AskResponse(BaseModel):
    """Response shape from POST /api/ask"""
    question: str                   # Echo back the original question
    answer: str                     # Claude's answer
    model: str                      # Which model answered
    input_tokens: int               # Tokens used for the prompt (billing info)
    output_tokens: int              # Tokens used for the answer


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def ask_claude(question: str, max_tokens: int = 1000) -> dict:
    """
    Send *question* to Claude and return a dict with the answer + token usage.

    Why a helper function?
    - Keeps the endpoint handlers thin and readable.
    - Centralises error handling for the Anthropic call.
    - Easy to unit-test in isolation.
    """
    logger.info("Sending question to Claude: %s", question[:80])  # truncate long Qs

    response = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[
            {
                "role": "user",
                "content": question,
            }
        ],
    )

    # Claude can return multiple content blocks; we use the first text block.
    answer_text = response.content[0].text

    logger.info(
        "Claude answered (%d input tokens, %d output tokens)",
        response.usage.input_tokens,
        response.usage.output_tokens,
    )

    return {
        "question": question,
        "answer": answer_text,
        "model": MODEL,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }


# ===========================================================================
# ENDPOINTS
# ===========================================================================

# ---------------------------------------------------------------------------
# GET /   →  Root health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def root():
    """
    Root endpoint — quick sanity check.
    Useful to paste the URL into a browser and confirm the server is up.
    """
    logger.info("Root endpoint hit")
    return {
        "status": "ok",
        "message": "Certification API is running 🚀",
        "docs": "/docs",        # Swagger UI
        "redoc": "/redoc",      # ReDoc UI
    }


# ---------------------------------------------------------------------------
# GET /api/health   →  Detailed health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["health"])
def health_check():
    """
    Returns environment information so you can confirm the right .env is loaded.

    Note: We never expose the actual API key — only whether it's set.
    """
    api_key_set = bool(os.getenv("ANTHROPIC_API_KEY"))
    env = os.getenv("APP_ENV", "development")

    logger.info("Health check — env=%s, api_key_set=%s", env, api_key_set)

    return {
        "status": "ok",
        "environment": env,
        "anthropic_api_key_configured": api_key_set,
        "model": MODEL,
        "allowed_origins": allowed_origins,
    }


# ---------------------------------------------------------------------------
# POST /api/ask   →  Ask Claude any question
# ---------------------------------------------------------------------------
@app.post("/api/ask", response_model=AskResponse, tags=["claude"])
def ask_question(body: AskRequest):
    """
    Send any question to Claude and receive a JSON answer.

    **Postman / REST example**:
    ```
    POST http://localhost:8000/api/ask
    Content-Type: application/json

    {
      "question": "Explain Python decorators in simple terms",
      "max_tokens": 500,
      "one_sentence": false
    }
    ```

    When `one_sentence` is `true`, the question is prefixed with an instruction
    to keep the answer to one sentence — handy for quick demos.
    """
    # Optionally prepend a constraint so Claude keeps it short
    question = body.question
    if body.one_sentence:
        question = f"{question} Answer in one sentence."

    logger.info("POST /api/ask — one_sentence=%s", body.one_sentence)

    try:
        result = ask_claude(question, max_tokens=body.max_tokens)
    except Exception as exc:
        # Log the full error on the server, return a safe message to the client
        logger.error("Anthropic API error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Failed to get a response from Claude: {str(exc)}",
        )

    return AskResponse(**result)


# ---------------------------------------------------------------------------
# GET /api/ask/demo   →  Pre-baked demo question
# ---------------------------------------------------------------------------
@app.get("/api/ask/demo", response_model=AskResponse, tags=["claude"])
def ask_demo():
    """
    Runs the classic demo question from the Anthropic quickstart:
    *"What is quantum computing? Answer in one sentence"*

    This is a GET endpoint so you can test it directly in a browser or with
    a simple `curl http://localhost:8000/api/ask/demo` — no body needed.
    """
    logger.info("GET /api/ask/demo — running quantum computing demo")

    try:
        result = ask_claude(
            "What is quantum computing? Answer in one sentence",
            max_tokens=200,
        )
    except Exception as exc:
        logger.error("Demo endpoint error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=str(exc))

    return AskResponse(**result)


# ===========================================================================
# Dev server entry point
# Run with:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
# ===========================================================================
if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))

    logger.info("Starting dev server on %s:%d", host, port)
    uvicorn.run("main:app", host=host, port=port, reload=True)
