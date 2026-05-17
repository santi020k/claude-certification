# CLAUDE.md — AI Context for the Certification Project

This file provides Claude (and any AI coding assistant) with the context it
needs to contribute effectively to this codebase.  It also serves as a
reference for developers learning the Anthropic SDK.

---

## Project Purpose

A full-stack **learning / certification project** that demonstrates how to:
- Call the Claude API from a Python backend (FastAPI)
- Expose the results through a REST API consumed by a Next.js frontend
- Structure a real monorepo (Turborepo + pnpm) with Python + TypeScript

---

## Repository Layout

```
certification/
├── apps/
│   ├── api/                  ← FastAPI + Anthropic SDK (Python ≥ 3.11)
│   │   ├── main.py           ← App factory — registers routers, CORS
│   │   ├── config.py         ← Env vars, logging, constants
│   │   ├── models.py         ← Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── claude.py     ← ask_claude() — the Anthropic SDK wrapper
│   │   └── routers/
│   │       ├── health.py     ← GET /  and  GET /api/health
│   │       └── claude.py     ← POST /api/ask  and  GET /api/ask/demo
│   └── web/                  ← Next.js 15 (TypeScript + Tailwind)
└── packages/shared/          ← Shared TypeScript types (placeholder)
```

---

## Claude / Anthropic SDK Quick Reference

### Current model

```python
MODEL = "claude-sonnet-4-0"   # fast + capable; good for most tasks
```

Other available models (as of the project's creation):

| Model | Best for |
|---|---|
| `claude-opus-4-0` | Complex reasoning, long documents |
| `claude-sonnet-4-0` | Balanced — speed + intelligence ✅ default |
| `claude-haiku-4-5` | Ultra-fast, lightweight tasks |

### Basic message call

```python
from anthropic import Anthropic

client = Anthropic()  # reads ANTHROPIC_API_KEY from environment

response = client.messages.create(
    model="claude-sonnet-4-0",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Explain async/await in Python."}
    ],
)

text = response.content[0].text
print(text)
```

### System prompt (persona / instructions)

```python
response = client.messages.create(
    model="claude-sonnet-4-0",
    max_tokens=1024,
    system="You are a senior Python engineer. Be concise and use examples.",
    messages=[{"role": "user", "content": "What is a context manager?"}],
)
```

### Multi-turn conversation

```python
history = []

def chat(user_message: str) -> str:
    history.append({"role": "user", "content": user_message})
    response = client.messages.create(
        model="claude-sonnet-4-0",
        max_tokens=1024,
        messages=history,
    )
    reply = response.content[0].text
    history.append({"role": "assistant", "content": reply})
    return reply
```

### Streaming response

```python
with client.messages.stream(
    model="claude-sonnet-4-0",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a haiku about Python."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### Token counting (before sending)

```python
count = client.messages.count_tokens(
    model="claude-sonnet-4-0",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(count.input_tokens)
```

### Usage / billing info in response

```python
response = client.messages.create(...)
print(response.usage.input_tokens)   # prompt tokens
print(response.usage.output_tokens)  # completion tokens
```

---

## Prompting Tips

1. **Be specific** — instead of "explain X", say "explain X to a junior Python
   developer in 3 bullet points with a code example".
2. **Use a system prompt** for persona or persistent instructions so you don't
   repeat them in every user message.
3. **Chain-of-thought** — append "Think step by step." for complex reasoning.
4. **One sentence mode** — append "Answer in one sentence." for quick summaries
   (this project's `one_sentence` flag does exactly this).
5. **XML tags** — Claude handles structured output well:
   ```
   Return your answer as <answer>…</answer> and your reasoning as <reasoning>…</reasoning>.
   ```
6. **Temperature** — the Messages API doesn't expose temperature directly;
   instead, control length/detail through prompt wording and `max_tokens`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |
| `MODEL` | optional | Override default model (default: `claude-sonnet-4-0`) |
| `ALLOWED_ORIGINS` | optional | Comma-separated CORS origins |
| `APP_ENV` | optional | `development` or `production` |
| `API_HOST` | optional | Bind address (default: `0.0.0.0`) |
| `API_PORT` | optional | Port (default: `8000`) |

Copy `.env.template` → `.env` and fill in `ANTHROPIC_API_KEY` before running.

---

## Common Tasks for an AI Coding Assistant

When helping in this repo, prefer:

- **Adding a new endpoint** → create the handler in the relevant
  `routers/*.py` file and register it in `main.py` via `include_router`.
- **New Claude capability** → add a function to `services/claude.py`;
  keep it focused, typed, and tested independently.
- **New Pydantic schema** → add it to `models.py`.
- **Config changes** → centralise in `config.py`, never call `os.getenv`
  directly in a router or service.
- **Frontend changes** → work in `apps/web/src`; use the API at
  `NEXT_PUBLIC_API_URL` (set in `.env`).

---

## Useful Links

- [Anthropic API docs](https://docs.anthropic.com)
- [Claude model overview](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Prompt engineering guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Python SDK reference](https://github.com/anthropics/anthropic-sdk-python)
- [FastAPI docs](https://fastapi.tiangolo.com)
- [Turborepo docs](https://turbo.build/repo/docs)
