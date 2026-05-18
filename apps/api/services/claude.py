"""
services/claude.py — Anthropic SDK wrapper for the Certification API.

This module owns the single responsibility of talking to Claude.
Keeping it here instead of inside a route handler means:
  • Routes stay thin and readable.
  • Error handling is centralised in one place.
  • The function is easy to unit-test without spinning up FastAPI.

Usage
-----
    from services.claude import ask_claude

    result = ask_claude("What is a neural network?", max_tokens=300)
    # result → {"question": "...", "answer": "...", "model": "...",
    #            "input_tokens": N, "output_tokens": N}
"""

import logging
from collections.abc import Sequence
from functools import lru_cache
from typing import TypedDict

from anthropic import (
    Anthropic,
    APIConnectionError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)
from anthropic.types import ContentBlock, TextBlock

from config import ANTHROPIC_API_KEY_CONFIGURED, ANTHROPIC_TIMEOUT_SECONDS, MODEL

logger = logging.getLogger("claude-certification.api")

logger.info("Claude service ready — model: %s", MODEL)


class ClaudeServiceError(RuntimeError):
    """Base error for Claude service failures that routes can map to HTTP."""

    status_code = 502
    public_message = "Failed to get a response from Claude. Please try again."


class ClaudeConfigurationError(ClaudeServiceError):
    status_code = 503
    public_message = "Claude is not configured on the server."


class ClaudeAuthenticationError(ClaudeServiceError):
    status_code = 503
    public_message = "Claude authentication failed. Check the server API key."


class ClaudeRateLimitError(ClaudeServiceError):
    status_code = 429
    public_message = "Claude is currently rate limited. Please try again shortly."


class ClaudeTimeoutError(ClaudeServiceError):
    status_code = 504
    public_message = "Claude took too long to respond. Please try again."


class ClaudeResponseDict(TypedDict):
    question: str
    answer: str
    model: str
    input_tokens: int
    output_tokens: int


@lru_cache
def get_client() -> Anthropic:
    """Create the Anthropic client when the first Claude request arrives."""
    if not ANTHROPIC_API_KEY_CONFIGURED:
        raise ClaudeConfigurationError("ANTHROPIC_API_KEY is not configured")
    return Anthropic(timeout=ANTHROPIC_TIMEOUT_SECONDS)


def extract_text(content_blocks: Sequence[ContentBlock]) -> str:
    """Collect text from Claude content blocks without assuming their order."""
    parts = []
    for block in content_blocks:
        if isinstance(block, TextBlock):
            text = block.text.strip()
            if text:
                parts.append(text)

    if not parts:
        raise RuntimeError("Claude returned no text content")
    return "\n\n".join(parts)


def ask_claude(question: str, max_tokens: int = 1000) -> ClaudeResponseDict:
    """
    Send *question* to Claude and return a structured dict.

    Parameters
    ----------
    question:
        The full prompt text to send to Claude.
    max_tokens:
        Upper bound on the number of tokens in Claude's response.

    Returns
    -------
    dict with keys:
        question      – echoed back for convenience
        answer        – Claude's text response
        model         – model name used
        input_tokens  – prompt token count (billing reference)
        output_tokens – completion token count (billing reference)

    Raises
    ------
    anthropic.APIError (and subclasses) if the Anthropic API call fails.
    Callers should wrap this in a try/except and raise HTTPException.
    """
    logger.info(
        "Claude request | model=%s max_tokens=%d question_chars=%d",
        MODEL,
        max_tokens,
        len(question),
    )

    try:
        response = get_client().messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": question}],
        )
    except AuthenticationError as exc:
        raise ClaudeAuthenticationError(str(exc)) from exc
    except RateLimitError as exc:
        raise ClaudeRateLimitError(str(exc)) from exc
    except APITimeoutError as exc:
        raise ClaudeTimeoutError(str(exc)) from exc
    except APIConnectionError as exc:
        raise ClaudeServiceError("Claude connection failed") from exc
    except APIError as exc:
        raise ClaudeServiceError(str(exc)) from exc

    answer_text = extract_text(response.content)

    logger.info(
        "← Claude | %d input tokens, %d output tokens",
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
