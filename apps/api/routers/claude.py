"""
routers/claude.py — Endpoints that interact with the Claude AI model.

All Claude-facing routes live here.  The actual API call is delegated to
`services.claude.ask_claude`, so these handlers stay thin: validate input,
call the service, handle errors, return the response.

Endpoints
---------
POST /api/ask        — Send any question to Claude, receive a JSON answer.
GET  /api/ask/demo   — Pre-baked demo (quantum computing, one sentence).
"""

import logging

from fastapi import APIRouter, HTTPException

from models import AskRequest, AskResponse
from services.claude import ask_claude

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api", tags=["claude"])


@router.post("/ask", response_model=AskResponse)
def ask_question(body: AskRequest) -> AskResponse:
    """
    Send any question to Claude and receive a structured JSON answer.

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

    logger.info("POST /api/ask — one_sentence=%s | %.60s…", body.one_sentence, question)

    try:
        result = ask_claude(question, max_tokens=body.max_tokens)
    except Exception as exc:
        logger.error("Anthropic API error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Failed to get a response from Claude. Please try again.",
        ) from exc

    return AskResponse(**result)


@router.get("/ask/demo", response_model=AskResponse)
def ask_demo() -> AskResponse:
    """
    Runs the classic quickstart demo question:
    *"What is quantum computing? Answer in one sentence."*

    This is a GET endpoint so you can test it directly in a browser or with:

    ```bash
    curl http://localhost:8000/api/ask/demo
    ```

    No request body needed.
    """
    logger.info("GET /api/ask/demo")

    try:
        result = ask_claude(
            "What is quantum computing? Answer in one sentence.",
            max_tokens=200,
        )
    except Exception as exc:
        logger.error("Demo endpoint error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Failed to get a response from Claude. Please try again.",
        ) from exc

    return AskResponse(**result)
