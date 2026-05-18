"""Small in-memory conversation store for the chat exercise.

The project is intentionally lightweight, so conversations live in process for
now. If a future exercise adds a database, this module is the narrow place to
swap storage without changing the router or Claude service.
"""

from __future__ import annotations

from threading import Lock
from uuid import uuid4

from config import CHAT_HISTORY_LIMIT
from services.claude import ClaudeMessage


class ConversationStore:
    """Thread-safe in-memory chat history store."""

    def __init__(self, history_limit: int = CHAT_HISTORY_LIMIT) -> None:
        self._history_limit = history_limit
        self._items: dict[str, list[ClaudeMessage]] = {}
        self._lock = Lock()

    def get_or_create(self, conversation_id: str | None = None) -> tuple[str, list[ClaudeMessage]]:
        with self._lock:
            if conversation_id and conversation_id in self._items:
                return conversation_id, list(self._items[conversation_id])

            new_id = conversation_id or uuid4().hex
            self._items.setdefault(new_id, [])
            return new_id, []

    def save(self, conversation_id: str, messages: list[ClaudeMessage]) -> list[ClaudeMessage]:
        trimmed = messages[-self._history_limit :]
        with self._lock:
            self._items[conversation_id] = trimmed
        return list(trimmed)

    def clear(self, conversation_id: str) -> None:
        with self._lock:
            self._items.pop(conversation_id, None)

    def clear_all(self) -> None:
        with self._lock:
            self._items.clear()


conversation_store = ConversationStore()
