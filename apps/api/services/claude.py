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

from __future__ import annotations

import json
import logging
from collections.abc import Iterable, Iterator, Sequence
from functools import lru_cache
from typing import Literal, TypedDict, cast

from anthropic import (
    Anthropic,
    APIConnectionError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)
from anthropic.types import (
    ContentBlock,
    MessageParam,
    TextBlock,
    ToolParam,
)

from config import ANTHROPIC_API_KEY_CONFIGURED, ANTHROPIC_TIMEOUT_SECONDS, MODEL
from services.weather import (
    WeatherDataDict,
    WeatherLocationNotFoundError,
    WeatherUnit,
    get_current_weather,
)

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


class ClaudeMessage(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class ClaudeChatResponseDict(TypedDict):
    answer: str
    model: str
    input_tokens: int
    output_tokens: int


class ClaudeChatStreamChunk(TypedDict):
    type: Literal["text", "final"]
    text: str
    model: str
    input_tokens: int
    output_tokens: int


class ClaudeWeatherResponseDict(TypedDict):
    location: str
    question: str
    answer: str
    model: str
    tool_name: str
    weather: WeatherDataDict
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

    result = chat_with_claude(
        [{"role": "user", "content": question}],
        max_tokens=max_tokens,
    )

    return {
        "question": question,
        "answer": result["answer"],
        "model": result["model"],
        "input_tokens": result["input_tokens"],
        "output_tokens": result["output_tokens"],
    }


# claude-haiku-4-5 is used for lightweight, latency-sensitive tasks like
# location normalisation that don't need the full power of the main MODEL.
HAIKU_MODEL = "claude-haiku-4-5-20251001"


def normalize_location(raw: str) -> str:
    """
    Ask Claude Haiku to normalise a free-form location string that the
    Open-Meteo geocoding API could not resolve.

    Returns a simplified «city, country» string the geocoder is more
    likely to understand.  Falls back to *raw* if Haiku itself errors so
    the caller can surface the original WeatherLocationNotFoundError.

    Examples
    --------
    "Sabaneta, Antioquia"  →  "Sabaneta, Colombia"
    "Brooklyn, New York"   →  "Brooklyn, USA"
    "Kreuzberg, Berlin"    →  "Berlin, Germany"
    "Paris 15ème"          →  "Paris, France"
    """
    logger.info("Haiku normalising location: %r", raw)
    try:
        response = get_client().messages.create(
            model=HAIKU_MODEL,
            max_tokens=50,
            system=(
                "You are a geocoding assistant. A geocoding API returned no results "
                "for the location string the user typed. Your job is to rewrite it "
                "into the simplest form a geocoding API will understand — usually "
                "«city, country» or just «city».\n\n"
                "Rules:\n"
                "• Output ONLY the location string — no explanation, no quotes.\n"
                "• Strip regional divisions (states, departments, provinces) and "
                "replace them with the country name when that helps clarity.\n"
                "• Keep the city name as close to its official spelling as possible.\n\n"
                "Examples:\n"
                "  Sabaneta, Antioquia  →  Sabaneta, Colombia\n"
                "  Brooklyn, New York   →  Brooklyn, USA\n"
                "  Kreuzberg, Berlin    →  Berlin, Germany\n"
                "  Paris 15ème         →  Paris, France\n"
                "  Medellín Bello       →  Bello, Colombia"
            ),
            messages=[{"role": "user", "content": raw}],
        )
        first_block = response.content[0]
        if isinstance(first_block, TextBlock):
            normalised = first_block.text.strip().strip("\"'").strip()
        else:
            normalised = ""
        logger.info("Haiku normalised %r  →  %r", raw, normalised)
        return normalised if normalised else raw
    except Exception:
        logger.warning(
            "Haiku location normalisation failed for %r — using original",
            raw,
            exc_info=True,
        )
        return raw


def ask_weather_claude(
    location: str,
    question: str | None = None,
    max_tokens: int = 500,
    unit: WeatherUnit = "celsius",
) -> ClaudeWeatherResponseDict:
    """Ask Claude to answer a weather question by calling a weather tool."""
    tool_name = "get_current_weather"
    user_question = question or f"What is the weather right now in {location}?"

    tools: list[ToolParam] = [
        {
            "name": tool_name,
            "description": "Get current weather for a city or place name.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city or place to look up.",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Preferred temperature unit.",
                    },
                },
                "required": ["location", "unit"],
            },
        }
    ]

    messages: list[MessageParam] = [
        {
            "role": "user",
            "content": (
                f"Location: {location}\n"
                f"Unit preference: {unit}\n"
                f"Question: {user_question}\n\n"
                "Use the weather tool, then answer with a concise, practical summary."
            ),
        }
    ]

    try:
        first_response = get_client().messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=(
                "You are a weather assistant. Always use the weather tool before "
                "answering, and do not invent current weather data."
            ),
            messages=messages,
            tools=tools,
            tool_choice={"type": "tool", "name": tool_name},
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

    tool_use = next(
        (
            block
            for block in first_response.content
            if getattr(block, "type", None) == "tool_use"
            and getattr(block, "name", None) == tool_name
        ),
        None,
    )
    if tool_use is None:
        raise ClaudeServiceError("Claude did not request the weather tool")

    tool_input = getattr(tool_use, "input", {})
    requested_location = str(tool_input.get("location") or location)
    tool_unit = tool_input.get("unit")
    requested_unit = (
        cast(WeatherUnit, tool_unit) if tool_unit in {"celsius", "fahrenheit"} else unit
    )
    try:
        weather = get_current_weather(requested_location, unit=requested_unit)
    except WeatherLocationNotFoundError:
        # Geocoding didn't recognise the string (e.g. "Sabaneta, Antioquia").
        # Ask Haiku to normalise it to a simpler «city, country» form and
        # retry once.  If normalisation doesn't change the string, or the
        # retry also fails, the WeatherLocationNotFoundError propagates.
        normalised = normalize_location(requested_location)
        if normalised.lower() == requested_location.lower():
            raise
        weather = get_current_weather(normalised, unit=requested_unit)

    messages.append(
        cast(MessageParam, {"role": "assistant", "content": first_response.content})
    )
    messages.append(
        cast(
            MessageParam,
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": getattr(tool_use, "id"),
                        "content": json.dumps(weather),
                    }
                ],
            },
        )
    )

    try:
        final_response = get_client().messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=(
                "You are a weather assistant. Use the tool result as the source "
                "of truth and answer naturally. Mention the observed location."
            ),
            messages=messages,
            tools=tools,
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

    return {
        "location": weather["location"],
        "question": user_question,
        "answer": extract_text(final_response.content),
        "model": MODEL,
        "tool_name": tool_name,
        "weather": weather,
        "input_tokens": (
            first_response.usage.input_tokens + final_response.usage.input_tokens
        ),
        "output_tokens": (
            first_response.usage.output_tokens + final_response.usage.output_tokens
        ),
    }


def chat_with_claude(
    messages: Sequence[ClaudeMessage],
    max_tokens: int = 1000,
    system_prompt: str | None = None,
    temperature: float = 0.7,
) -> ClaudeChatResponseDict:
    """Send a conversation history to Claude and return the next answer.

    Parameters
    ----------
    messages:
        Full conversation history (alternating user/assistant turns).
    max_tokens:
        Upper bound on the number of tokens in Claude's response.
    system_prompt:
        Optional system prompt that shapes Claude's persona and behaviour.
        When provided it is passed as the ``system`` parameter so it applies
        to the entire conversation without consuming a turn in ``messages``.
    temperature:
        Sampling temperature in the range [0.0, 1.0].
        0.0 = deterministic / factual; 1.0 = most creative / unpredictable.
        Defaults to 0.7 (balanced).
    """
    logger.info(
        "Claude chat request | model=%s max_tokens=%d messages=%d temperature=%.2f specialist_prompt=%s",
        MODEL,
        max_tokens,
        len(messages),
        temperature,
        "yes" if system_prompt else "no",
    )

    try:
        if system_prompt:
            response = get_client().messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                messages=cast(Iterable[MessageParam], list(messages)),
                temperature=temperature,
                system=system_prompt,
            )
        else:
            response = get_client().messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                messages=cast(Iterable[MessageParam], list(messages)),
                temperature=temperature,
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
        "← Claude chat | %d input tokens, %d output tokens",
        response.usage.input_tokens,
        response.usage.output_tokens,
    )

    return {
        "answer": answer_text,
        "model": MODEL,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }


def stream_chat_with_claude(
    messages: Sequence[ClaudeMessage],
    max_tokens: int = 1000,
    system_prompt: str | None = None,
    temperature: float = 0.7,
) -> Iterator[ClaudeChatStreamChunk]:
    """Stream Claude's next chat answer as text chunks, then final usage."""
    logger.info(
        "Claude chat stream | model=%s max_tokens=%d messages=%d temperature=%.2f specialist_prompt=%s",
        MODEL,
        max_tokens,
        len(messages),
        temperature,
        "yes" if system_prompt else "no",
    )

    try:
        if system_prompt:
            stream_context = get_client().messages.stream(
                model=MODEL,
                max_tokens=max_tokens,
                messages=cast(Iterable[MessageParam], list(messages)),
                temperature=temperature,
                system=system_prompt,
            )
        else:
            stream_context = get_client().messages.stream(
                model=MODEL,
                max_tokens=max_tokens,
                messages=cast(Iterable[MessageParam], list(messages)),
                temperature=temperature,
            )
        with stream_context as stream:
            for text in stream.text_stream:
                if text:
                    yield {
                        "type": "text",
                        "text": text,
                        "model": MODEL,
                        "input_tokens": 0,
                        "output_tokens": 0,
                    }

            final_message = stream.get_final_message()
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

    logger.info(
        "← Claude chat stream | %d input tokens, %d output tokens",
        final_message.usage.input_tokens,
        final_message.usage.output_tokens,
    )

    yield {
        "type": "final",
        "text": extract_text(final_message.content),
        "model": MODEL,
        "input_tokens": final_message.usage.input_tokens,
        "output_tokens": final_message.usage.output_tokens,
    }
