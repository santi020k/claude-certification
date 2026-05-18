from fastapi.testclient import TestClient

from main import app
from services.claude import (
    ClaudeChatResponseDict,
    ClaudeResponseDict,
    ClaudeServiceError,
    ClaudeTimeoutError,
    extract_text,
)
from services.conversations import conversation_store

client = TestClient(app)


def test_health_check_reports_configuration() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "model" in payload
    assert "allowed_origins" in payload


def test_root_includes_security_headers() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_ask_rejects_oversized_body_before_route() -> None:
    response = client.post(
        "/api/ask",
        content=b"x" * 20_000,
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 413


def test_ask_rejects_short_question() -> None:
    response = client.post(
        "/api/ask",
        json={"question": "hi", "max_tokens": 100, "one_sentence": False},
    )

    assert response.status_code == 422


def test_ask_uses_claude_service(monkeypatch) -> None:
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        return {
            "question": question,
            "answer": "A focused test answer.",
            "model": "test-model",
            "input_tokens": 8,
            "output_tokens": 5,
        }

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={
            "question": "Explain test doubles.",
            "max_tokens": 100,
            "one_sentence": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "A focused test answer."
    assert payload["question"].endswith("Answer in one sentence.")


def test_ask_sanitises_question_before_service(monkeypatch) -> None:
    captured: dict[str, str] = {}

    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        captured["question"] = question
        return {
            "question": question,
            "answer": "Sanitised.",
            "model": "test-model",
            "input_tokens": 4,
            "output_tokens": 2,
        }

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={
            "question": "\x00  Explain\u200b decorators.\n\n\n\nThanks.  ",
            "max_tokens": 100,
            "one_sentence": False,
        },
    )

    assert response.status_code == 200
    assert captured["question"] == "Explain decorators.\n\nThanks."


def test_ask_maps_claude_service_errors(monkeypatch) -> None:
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        raise ClaudeTimeoutError("timeout")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={"question": "Explain timeouts.", "max_tokens": 100},
    )

    assert response.status_code == 504
    assert response.json()["detail"] == "Claude took too long to respond. Please try again."


def test_extract_text_combines_text_blocks() -> None:
    from anthropic.types import TextBlock, ToolUseBlock

    content = [
        ToolUseBlock(id="1", input={}, name="my_tool", type="tool_use"),
        TextBlock(text=" First block ", type="text"),
        TextBlock(text="Second block", type="text"),
    ]

    assert extract_text(content) == "First block\n\nSecond block"


def test_ask_demo_endpoint(monkeypatch) -> None:
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        assert question == "What is quantum computing? Answer in one sentence."
        assert max_tokens == 200
        return {
            "question": question,
            "answer": "Quantum computing is computation using quantum-mechanical phenomena like superposition and entanglement.",
            "model": "test-model",
            "input_tokens": 12,
            "output_tokens": 15,
        }

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.get("/api/ask/demo")
    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Quantum computing is computation using quantum-mechanical phenomena like superposition and entanglement."
    assert payload["model"] == "test-model"


def test_ask_demo_maps_errors(monkeypatch) -> None:
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        raise ClaudeServiceError("service error")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.get("/api/ask/demo")
    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to get a response from Claude. Please try again."


def test_ask_rate_limit_error(monkeypatch) -> None:
    from services.claude import ClaudeRateLimitError
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        raise ClaudeRateLimitError("rate limit exceeded")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={"question": "Explain rate limits.", "max_tokens": 100},
    )
    assert response.status_code == 429
    assert response.json()["detail"] == "Claude is currently rate limited. Please try again shortly."


def test_ask_authentication_error(monkeypatch) -> None:
    from services.claude import ClaudeAuthenticationError
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        raise ClaudeAuthenticationError("bad key")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={"question": "Explain auth.", "max_tokens": 100},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Claude authentication failed. Check the server API key."


def test_ask_unexpected_error(monkeypatch) -> None:
    def fake_ask_claude(question: str, max_tokens: int) -> ClaudeResponseDict:
        raise RuntimeError("Something went horribly wrong internally")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={"question": "Explain crashes.", "max_tokens": 100},
    )
    assert response.status_code == 500
    assert response.json()["detail"] == "Unexpected server error. Please try again."


def test_chat_starts_and_continues_conversation(monkeypatch) -> None:
    conversation_store.clear_all()
    captured_lengths: list[int] = []

    def fake_chat_with_claude(messages, max_tokens: int) -> ClaudeChatResponseDict:
        captured_lengths.append(len(messages))
        return {
            "answer": f"Reply {len(messages)}",
            "model": "test-model",
            "input_tokens": 10,
            "output_tokens": 4,
        }

    monkeypatch.setattr("routers.chat.chat_with_claude", fake_chat_with_claude)

    first = client.post(
        "/api/chat",
        json={"message": "Explain stateful chats.", "max_tokens": 100},
    )

    assert first.status_code == 200
    first_payload = first.json()
    assert first_payload["conversation_id"]
    assert first_payload["answer"] == "Reply 1"
    assert [message["role"] for message in first_payload["messages"]] == [
        "user",
        "assistant",
    ]

    second = client.post(
        "/api/chat",
        json={
            "conversation_id": first_payload["conversation_id"],
            "message": "Show a follow-up.",
            "max_tokens": 100,
        },
    )

    assert second.status_code == 200
    assert second.json()["answer"] == "Reply 3"
    assert captured_lengths == [1, 3]


def test_chat_maps_claude_errors(monkeypatch) -> None:
    def fake_chat_with_claude(messages, max_tokens: int) -> ClaudeChatResponseDict:
        raise ClaudeTimeoutError("timeout")

    monkeypatch.setattr("routers.chat.chat_with_claude", fake_chat_with_claude)

    response = client.post(
        "/api/chat",
        json={"message": "Explain slow responses.", "max_tokens": 100},
    )

    assert response.status_code == 504
    assert response.json()["detail"] == "Claude took too long to respond. Please try again."


def test_extract_text_raises_when_no_text() -> None:
    import pytest
    from anthropic.types import ToolUseBlock

    content = [
        ToolUseBlock(id="1", input={}, name="my_tool", type="tool_use"),
    ]
    with pytest.raises(RuntimeError, match="Claude returned no text content"):
        extract_text(content)
