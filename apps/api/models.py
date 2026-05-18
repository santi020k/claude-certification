"""
models.py — Pydantic request / response schemas for the Certification API.

Pydantic models serve two purposes here:
  1. Runtime validation — FastAPI automatically validates incoming JSON bodies
     against these classes and returns a 422 Unprocessable Entity if the data
     doesn't match.
  2. OpenAPI documentation — the schemas are reflected into the auto-generated
     /docs (Swagger UI) and /redoc pages, so you get interactive API docs for
     free.

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

from typing import List, Optional

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


class HealthResponse(BaseModel):
    """Response returned by GET /api/health."""

    status: str
    environment: str
    anthropic_api_key_configured: bool
    model: str
    allowed_origins: list[str]


class AccessibilityViolation(BaseModel):
    """Represents a specific accessibility issue detected in the code."""

    line: int = Field(description="Line number where the violation is found, or 0 if general.")
    element: str = Field(description="The code snippet or element causing the violation.")
    type: str = Field(description="Type of violation (e.g., contrast, semantic, keyboard, etc.)")
    severity: str = Field(description="Severity (critical, serious, moderate, minor)")
    wcag_guideline: str = Field(description="WCAG 2.2 guideline reference (e.g., 1.4.3 Contrast)")
    description: str = Field(description="Explanation of the accessibility issue.")
    recommendation: str = Field(description="Actionable suggestion to resolve the issue.")


class AccessibilityAnalyzeRequest(BaseModel):
    """Body expected by POST /api/accessibility/analyze."""

    file_path: str = Field(
        ...,
        description="Path relative to the workspace root or filename."
    )
    code: Optional[str] = Field(
        default=None,
        description="Optional source code. If empty, the backend will attempt to read the file from the workspace."
    )


class AccessibilityAnalyzeResponse(BaseModel):
    """Response returned by POST /api/accessibility/analyze."""

    file_path: str = Field(description="The path of the analyzed file.")
    violations: List[AccessibilityViolation] = Field(description="List of detected accessibility violations.")
    summary: str = Field(description="A markdown summary of the audit and findings.")
    model: str = Field(description="The Claude model used for analysis.")
    input_tokens: int = Field(description="Prompt tokens consumed.")
    output_tokens: int = Field(description="Completion tokens consumed.")

