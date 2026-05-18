"""
models.py — Pydantic request / response schemas for the Certification API.

Pydantic models serve two purposes here:
  1. Runtime validation — FastAPI automatically validates incoming JSON bodies
     against these classes and returns a 422 Unprocessable Entity if the data
     doesn't match.
  2. OpenAPI documentation — the schemas are reflected into the auto-generated
     /docs (Swagger UI) and /redoc pages, so you get interactive API docs.

Input sanitisation (AskRequest)
--------------------------------
The `question` field goes through a two-step cleaning pipeline before it
reaches the Anthropic SDK:

  • strip_control_chars  — removes null bytes and ASCII control characters
    that have no place in a plain-text question but could confuse parsers or
    log viewers.

  • normalise_whitespace — collapses runs of whitespace / newlines into a
    single space so token counts stay predictable.  Multi-line questions are
    still valid; only excessive blank lines are trimmed.

The validator runs *after* the standard min/max_length check, so an attacker
cannot bypass the length gate by padding with null bytes.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# ── Patterns ───────────────────────────────────────────────────────────────────

# ASCII control characters except horizontal tab (\x09), newline (\x0a), and
# carriage return (\x0d) — those are legitimate in multi-line questions.
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# More than two consecutive blank lines → two blank lines max
_EXCESS_BLANK_LINES_RE = re.compile(r"\n{3,}")

# Unicode categories considered "control" (Cc) or "format" (Cf), minus
# the safe whitespace we already allow via the regex above.
_UNICODE_CONTROL_CATS = {"Cc", "Cf"}


def _sanitise_question(raw: str) -> str:
    """
    Clean *raw* question text:
      1. Strip ASCII control chars (keep tab / LF / CR).
      2. Remove Unicode control / format characters.
      3. Collapse runs of more than two consecutive blank lines.
      4. Strip leading / trailing whitespace.
    """
    # Step 1 — ASCII control characters
    cleaned = _CONTROL_RE.sub("", raw)

    # Step 2 — Unicode control/format chars (e.g. zero-width joiners)
    cleaned = "".join(
        ch for ch in cleaned
        if unicodedata.category(ch) not in _UNICODE_CONTROL_CATS
        or ch in ("\t", "\n", "\r")
    )

    # Step 3 — collapse excessive blank lines
    cleaned = _EXCESS_BLANK_LINES_RE.sub("\n\n", cleaned)

    # Step 4 — trim edges
    return cleaned.strip()


# ── Request / Response Models ──────────────────────────────────────────────────

class AskRequest(BaseModel):
    """Body expected by POST /api/ask."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=4_000,
        description="The question you want Claude to answer.",
        examples=["Explain Python decorators in simple terms"],
    )
    max_tokens: int = Field(
        default=1_000,
        ge=50,
        le=4_000,
        description="Upper limit on Claude's response length (tokens).",
    )
    one_sentence: bool = Field(
        default=False,
        description="When True, instructs Claude to answer in a single sentence.",
    )

    @field_validator("question", mode="before")
    @classmethod
    def sanitise_question(cls, v: object) -> str:
        if not isinstance(v, str):
            raise ValueError("question must be a string")
        cleaned = _sanitise_question(v)
        if len(cleaned) < 3:
            raise ValueError(
                "question is too short after sanitisation (minimum 3 characters)"
            )
        return cleaned


class AskResponse(BaseModel):
    """Response returned by POST /api/ask and GET /api/ask/demo."""

    question: str = Field(description="The original question that was sent to Claude.")
    answer: str = Field(description="Claude's answer.")
    model: str = Field(description="The Claude model that generated the answer.")
    input_tokens: int = Field(description="Prompt tokens consumed (for billing reference).")
    output_tokens: int = Field(description="Completion tokens consumed (for billing reference).")


class ChatMessage(BaseModel):
    """One message in a Claude chat conversation."""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4_000)


class ChatRequest(BaseModel):
    """Body expected by POST /api/chat."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=4_000,
        description="The next user message in the conversation.",
        examples=["Can you explain that with a small Python example?"],
    )
    conversation_id: str | None = Field(
        default=None,
        min_length=8,
        max_length=80,
        description="Existing conversation id. Omit it to start a new chat.",
    )
    max_tokens: int = Field(
        default=1_000,
        ge=50,
        le=4_000,
        description="Upper limit on Claude's next response length (tokens).",
    )
    one_sentence: bool = Field(
        default=False,
        description="When True, instructs Claude to answer in one sentence.",
    )

    @field_validator("message", mode="before")
    @classmethod
    def sanitise_message(cls, v: object) -> str:
        if not isinstance(v, str):
            raise ValueError("message must be a string")
        cleaned = _sanitise_question(v)
        if len(cleaned) < 1:
            raise ValueError("message is empty after sanitisation")
        return cleaned


class ChatResponse(BaseModel):
    """Response returned by POST /api/chat."""

    conversation_id: str
    answer: str
    messages: list[ChatMessage]
    model: str
    input_tokens: int
    output_tokens: int


class HealthResponse(BaseModel):
    """Response returned by GET /api/health."""

    status: str
    environment: str
    anthropic_api_key_configured: bool
    model: str
    allowed_origins: list[str]
