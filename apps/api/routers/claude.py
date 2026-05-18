"""
routers/claude.py — Endpoints that interact with the Claude AI model.

All Claude-facing routes live here.  The actual API call is delegated to
`services.claude.ask_claude`, so these handlers stay thin: validate input,
call the service, handle errors, return the response.

Endpoints
---------
POST /api/ask        — Send any question to Claude, receive a JSON answer.
GET  /api/ask/demo   — Pre-baked demo (quantum computing, one sentence).

Rate limits (per remote IP)
---------------------------
POST /api/ask      → 10 requests / minute
GET  /api/ask/demo →  5 requests / minute

When a limit is exceeded the client receives HTTP 429 with:
  • Retry-After header       — seconds to wait before retrying
  • X-RateLimit-Limit        — the configured limit
  • X-RateLimit-Remaining    — how many calls are left in the window
  • X-RateLimit-Reset        — UTC epoch when the window resets
"""

import logging

from fastapi import APIRouter, HTTPException, Request, Response

from config import ASK_RATE_LIMIT, DEMO_RATE_LIMIT
from middleware.rate_limit import limiter
from models import AskRequest, AskResponse
from services.claude import ClaudeServiceError, ask_claude

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api", tags=["claude"])


@router.post("/ask", response_model=AskResponse)
@limiter.limit(ASK_RATE_LIMIT)
def ask_question(request: Request, response: Response, body: AskRequest) -> AskResponse:
    """
    Send any question to Claude and receive a structured JSON answer.

    **Rate limit:** 10 requests per minute per IP.

    **Example request body**
    ```json
    {
      "question": "Explain Python decorators in simple terms",
      "max_tokens": 500,
      "one_sentence": false
    }
    ```

    When `one_sentence` is `true`, the question is prefixed with a brevity
    instruction so Claude keeps its reply to a single sentence — handy for
    quick demos or UI cards.
    """
    question = body.question
    if body.one_sentence:
        question = f"{question} Answer in one sentence."

    logger.info(
        "POST /api/ask — ip=%s one_sentence=%s max_tokens=%d question_chars=%d",
        request.client.host if request.client else "unknown",
        body.one_sentence,
        body.max_tokens,
        len(question),
    )

    try:
        result = ask_claude(question, max_tokens=body.max_tokens)
    except ClaudeServiceError as exc:
        logger.warning("Claude service error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in POST /api/ask")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error. Please try again.",
        ) from exc

    return AskResponse(**result)


@router.get("/ask/demo", response_model=AskResponse)
@limiter.limit(DEMO_RATE_LIMIT)
def ask_demo(request: Request, response: Response) -> AskResponse:
    """
    Runs the classic quickstart demo question:
    *"What is quantum computing? Answer in one sentence."*

    **Rate limit:** 5 requests per minute per IP.

    This is a GET endpoint so you can test it directly in a browser or with:

    ```bash
    curl http://localhost:8000/api/ask/demo
    ```

    No request body needed.
    """
    logger.info(
        "GET /api/ask/demo — ip=%s",
        request.client.host if request.client else "unknown",
    )

    try:
        result = ask_claude(
            "What is quantum computing? Answer in one sentence.",
            max_tokens=200,
        )
    except ClaudeServiceError as exc:
        logger.warning("Claude demo service error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in GET /api/ask/demo")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error. Please try again.",
        ) from exc

    return AskResponse(**result)
