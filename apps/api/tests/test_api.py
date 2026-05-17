from types import SimpleNamespace

from fastapi.testclient import TestClient

from main import app
from services.claude import extract_text

client = TestClient(app)


def test_health_check_reports_configuration() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "model" in payload
    assert "allowed_origins" in payload


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


def test_extract_text_combines_text_blocks() -> None:
    content = [
        SimpleNamespace(type="tool_use", text="ignored"),
        SimpleNamespace(type="text", text=" First block "),
        SimpleNamespace(type="text", text="Second block"),
    ]

    assert extract_text(content) == "First block\n\nSecond block"
