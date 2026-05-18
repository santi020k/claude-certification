from types import SimpleNamespace

from fastapi.testclient import TestClient

from main import app
from services.claude import ClaudeTimeoutError, extract_text

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
    def fake_ask_claude(question: str, max_tokens: int) -> dict[str, object]:
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
    captured: dict[str, object] = {}

    def fake_ask_claude(question: str, max_tokens: int) -> dict[str, object]:
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
    def fake_ask_claude(question: str, max_tokens: int) -> dict[str, object]:
        raise ClaudeTimeoutError("timeout")

    monkeypatch.setattr("routers.claude.ask_claude", fake_ask_claude)

    response = client.post(
        "/api/ask",
        json={"question": "Explain timeouts.", "max_tokens": 100},
    )

    assert response.status_code == 504
    assert response.json()["detail"] == "Claude took too long to respond. Please try again."


def test_extract_text_combines_text_blocks() -> None:
    content = [
        SimpleNamespace(type="tool_use", text="ignored"),
        SimpleNamespace(type="text", text=" First block "),
        SimpleNamespace(type="text", text="Second block"),
    ]

    assert extract_text(content) == "First block\n\nSecond block"
