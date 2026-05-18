"""Chat endpoints for multi-turn Claude conversations."""

import logging

from fastapi import APIRouter, HTTPException, Request, Response

from config import CHAT_RATE_LIMIT
from middleware.rate_limit import limiter
from models import ChatMessage, ChatRequest, ChatResponse, SpecialistPublic, SpecialistsResponse
from services.claude import ClaudeServiceError, chat_with_claude
from services.conversations import conversation_store
from services.specialists import DEFAULT_SPECIALIST_ID, get_specialist, list_specialists

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/specialists", response_model=SpecialistsResponse)
def get_specialists() -> SpecialistsResponse:
    """
    Return the list of available specialist personas.

    Each specialist shapes Claude's tone, role, and behaviour via a server-side
    system prompt.  The ``id`` field is what you pass as ``specialist`` in
    ``POST /api/chat``.

    ```bash
    curl http://localhost:8000/api/specialists
    ```
    """
    return SpecialistsResponse(
        specialists=[
            SpecialistPublic(id=s["id"], name=s["name"], description=s["description"])
            for s in list_specialists()
        ],
        default=DEFAULT_SPECIALIST_ID,
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
def chat(request: Request, response: Response, body: ChatRequest) -> ChatResponse:
    """
    Continue a Claude conversation with an optional specialist persona.

    Omit `conversation_id` to start a new conversation. Send the returned id
    with later messages to keep the same context.

    Pass a `specialist` id (from `GET /api/specialists`) to give Claude a
    specific persona — e.g. a patient math tutor or a customer support agent.
    Omit it (or send `null`) for the default general assistant.
    """
    conversation_id, history = conversation_store.get_or_create(body.conversation_id)
    user_message = body.message
    if body.one_sentence:
        user_message = f"{user_message} Answer in one sentence."

    messages = [*history, {"role": "user", "content": user_message}]

    specialist = get_specialist(body.specialist)

    logger.info(
        "POST /api/chat — ip=%s conversation_id=%s specialist=%s history=%d max_tokens=%d",
        request.client.host if request.client else "unknown",
        conversation_id,
        specialist["id"],
        len(history),
        body.max_tokens,
    )

    try:
        result = chat_with_claude(
            messages,
            max_tokens=body.max_tokens,
            system_prompt=specialist["system_prompt"],
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
