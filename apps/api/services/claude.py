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

from anthropic import Anthropic

from config import MODEL

logger = logging.getLogger("claude-certification.api")

# One shared client — the SDK reads ANTHROPIC_API_KEY from the environment.
_client = Anthropic()

logger.info("Anthropic client initialised — model: %s", MODEL)


def ask_claude(question: str, max_tokens: int = 1000) -> dict[str, object]:
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
    logger.info("→ Claude | question: %.80s…", question)

    response = _client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": question}],
    )

    # Claude may return multiple content blocks; we take the first text block.
    answer_text: str = response.content[0].text  # type: ignore[union-attr]

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
