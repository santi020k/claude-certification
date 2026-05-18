"""Chat endpoints for multi-turn Claude conversations."""

from __future__ import annotations

import json
import logging
from collections.abc import Iterator

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse

from config import CHAT_RATE_LIMIT
from middleware.rate_limit import limiter
from models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    SpecialistPublic,
    SpecialistsResponse,
)
from services.claude import (
    ClaudeServiceError,
    chat_with_claude,
    stream_chat_with_claude,
)
from services.conversations import conversation_store
from services.specialists import DEFAULT_SPECIALIST_ID, get_specialist, list_specialists

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api", tags=["chat"])


def _chat_inputs(
    body: ChatRequest,
) -> tuple[str, list[dict[str, str]], dict, float]:
    conversation_id, history = conversation_store.get_or_create(body.conversation_id)
    user_message = body.message
    if body.one_sentence:
        user_message = f"{user_message} Answer in one sentence."

    messages = [*history, {"role": "user", "content": user_message}]
    specialist = get_specialist(body.specialist)
    temperature = body.temperature if body.temperature is not None else specialist["temperature"]

    return conversation_id, messages, specialist, temperature


@router.get("/specialists", response_model=SpecialistsResponse)
def get_specialists() -> SpecialistsResponse:
    """
    Return the list of available specialist personas.

    Each specialist shapes Claude's tone, role, and behaviour via a server-side
    system prompt.  The ``id`` is what you pass as ``specialist`` in
    ``POST /api/chat``.  The ``temperature`` field is the recommended sampling
    default — pass it back in ``POST /api/chat`` to get the intended feel, or
    override it to your liking.

    ```bash
    curl http://localhost:8000/api/specialists
    ```
    """
    return SpecialistsResponse(
        specialists=[
            SpecialistPublic(
                id=s["id"],
                name=s["name"],
                description=s["description"],
                temperature=s["temperature"],
            )
            for s in list_specialists()
        ],
        default=DEFAULT_SPECIALIST_ID,
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
def chat(request: Request, response: Response, body: ChatRequest) -> ChatResponse:
    """
    Continue a Claude conversation with an optional specialist persona and temperature.

    Omit `conversation_id` to start a new conversation. Send the returned id
    with later messages to keep the same context.

    Pass a `specialist` id (from `GET /api/specialists`) to give Claude a
    specific persona.  Pass `temperature` (0.0–1.0) to control creativity —
    omit it to use the specialist's recommended default.
    """
    conversation_id, messages, specialist, temperature = _chat_inputs(body)

    logger.info(
        "POST /api/chat — ip=%s conversation_id=%s specialist=%s temperature=%.2f history=%d max_tokens=%d",
        request.client.host if request.client else "unknown",
        conversation_id,
        specialist["id"],
        temperature,
        len(messages) - 1,
        body.max_tokens,
    )

    try:
        result = chat_with_claude(
            messages,
            max_tokens=body.max_tokens,
            system_prompt=specialist["system_prompt"],
            temperature=temperature,
        )
    except ClaudeServiceError as exc:
        logger.warning("Claude chat service error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in POST /api/chat")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error. Please try again.",
        ) from exc

    saved_messages = conversation_store.save(
        conversation_id,
        [
            *messages,
            {"role": "assistant", "content": result["answer"]},
        ],
    )

    return ChatResponse(
        conversation_id=conversation_id,
        answer=result["answer"],
        messages=[ChatMessage(**message) for message in saved_messages],
        model=result["model"],
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
    )


@router.post("/chat/stream")
@limiter.limit(CHAT_RATE_LIMIT)
def chat_stream(request: Request, response: Response, body: ChatRequest) -> StreamingResponse:
    """
    Continue a Claude conversation and stream the assistant answer as NDJSON.

    Each line is a JSON event:
    - `{ "type": "text", "text": "..." }` for incremental answer chunks
    - `{ "type": "final", ... }` with saved messages and token usage
    - `{ "type": "error", "detail": "..." }` if Claude fails mid-stream
    """
    conversation_id, messages, specialist, temperature = _chat_inputs(body)

    logger.info(
        "POST /api/chat/stream — ip=%s conversation_id=%s specialist=%s temperature=%.2f history=%d max_tokens=%d",
        request.client.host if request.client else "unknown",
        conversation_id,
        specialist["id"],
        temperature,
        len(messages) - 1,
        body.max_tokens,
    )

    def events() -> Iterator[str]:
        answer_parts: list[str] = []

        try:
            for chunk in stream_chat_with_claude(
                messages,
                max_tokens=body.max_tokens,
                system_prompt=specialist["system_prompt"],
                temperature=temperature,
            ):
                if chunk["type"] == "text":
                    answer_parts.append(chunk["text"])
                    yield json.dumps({"type": "text", "text": chunk["text"]}) + "\n"
                    continue

                answer = chunk["text"] or "".join(answer_parts)
                saved_messages = conversation_store.save(
                    conversation_id,
                    [
                        *messages,
                        {"role": "assistant", "content": answer},
                    ],
                )
                yield json.dumps(
                    {
                        "type": "final",
                        "conversation_id": conversation_id,
                        "answer": answer,
                        "messages": saved_messages,
                        "model": chunk["model"],
                        "input_tokens": chunk["input_tokens"],
                        "output_tokens": chunk["output_tokens"],
                    }
                ) + "\n"
        except ClaudeServiceError as exc:
            logger.warning("Claude stream service error: %s", exc, exc_info=True)
            yield json.dumps(
                {
                    "type": "error",
                    "detail": exc.public_message,
                    "status_code": exc.status_code,
                }
            ) + "\n"
        except Exception:
            logger.exception("Unexpected error in POST /api/chat/stream")
            yield json.dumps(
                {
                    "type": "error",
                    "detail": "Unexpected server error. Please try again.",
                    "status_code": 500,
                }
            ) + "\n"

    return StreamingResponse(
        events(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
