# Claude Certification — Turborepo Monorepo

> **Next.js 16** (frontend) · **FastAPI** (backend) · **Anthropic Claude** (AI) · **Cloudflare** (deployment)

A full-stack learning project demonstrating how to integrate Claude into a
production-ready web stack with a proper monorepo setup.

---

## Architecture

```
certification/
├── apps/
│   ├── api/                  ← FastAPI + Anthropic SDK  (Python ≥ 3.11)
│   │   ├── main.py           ← App factory (thin — just wires routers)
│   │   ├── config.py         ← Env vars, logging, constants
│   │   ├── models.py         ← Pydantic request / response schemas
│   │   ├── services/
│   │   │   └── claude.py     ← ask_claude() — Anthropic SDK wrapper
│   │   └── routers/
│   │       ├── health.py     ← GET /  and  GET /api/health
│   │       └── claude.py     ← POST /api/ask  and  GET /api/ask/demo
│   └── web/                  ← Next.js 16 — Cloudflare Pages  (TypeScript)
│       └── src/app/
│           ├── page.tsx
│           └── layout.tsx
├── packages/
│   └── shared/               ← (future) shared TypeScript types / utils
├── .claude/
│   └── commands/             ← Custom Claude slash commands for this repo
│       ├── ask.md            ← /ask  — quick API test
│       ├── health.md         ← /health — check backend health
│       ├── dev.md            ← /dev  — start dev stack instructions
│       └── test-api.md       ← /test-api — smoke-test all endpoints
├── .vscode/
│   └── settings.json         ← Python interpreter + Pyrefly / Pylance config
├── CLAUDE.md                 ← AI context, SDK reference, prompting tips
├── .env                      ← Local secrets (gitignored)
├── .env.template             ← Copy this → .env, then fill in values
├── turbo.json                ← Turborepo pipeline
└── package.json              ← Workspace root
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 10 |
| Python | ≥ 3.11 |

---

## First-time setup

```bash
# 1. Clone the repo
git clone https://github.com/santi020k/claude-certification.git
cd claude-certification

# 2. Copy the env template and add your API key
cp .env.template .env
# → Open .env and set ANTHROPIC_API_KEY (get one at console.anthropic.com)

# 3. Install Node dependencies
pnpm install

# 4. Set up the Python virtual environment
cd apps/api
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

> **VS Code users** — open the repo root folder and VS Code will automatically
> pick up `.vscode/settings.json`, pointing Pylance and Pyrefly to the correct
> virtual environment. No manual interpreter selection needed.

---

## Running in development

**Terminal 1 — FastAPI backend:**

```bash
cd apps/api
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Next.js frontend:**

```bash
pnpm dev   # turbo dev → starts apps/web on :3000
```

The frontend is a shadcn-style Claude playground that calls the API configured
by `NEXT_PUBLIC_API_URL`, usually `http://localhost:8000` in development.

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `http://localhost:8000/` | Root — is the server alive? |
| `GET` | `http://localhost:8000/api/health` | Health + environment info |
| `GET` | `http://localhost:8000/api/ask/demo` | Demo: quantum computing (one sentence) |
| `POST` | `http://localhost:8000/api/ask` | Ask Claude anything |
| — | `http://localhost:8000/docs` | Swagger UI (interactive) |
| — | `http://localhost:8000/redoc` | ReDoc UI |

### POST /api/ask — example

```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is a neural network?",
    "max_tokens": 500,
    "one_sentence": false
  }'
```

---

## Claude slash commands (in Claude Code / Cowork)

This repo ships with custom slash commands under `.claude/commands/`:

| Command | What it does |
|---------|-------------|
| `/ask <question>` | POST a question to the local API and print the response |
| `/health` | Check the backend health endpoint |
| `/dev` | Show instructions to start the full dev stack |
| `/test-api` | Smoke-test all four endpoints in one go |

---

## Claude / Anthropic SDK

See **[CLAUDE.md](./CLAUDE.md)** for a full reference including:
- Current model names and when to use each
- Basic message call, system prompts, multi-turn chat, streaming
- Token counting and usage billing info
- Prompting tips and best practices
- Environment variable reference

---

## Brand

The logo, icon, favicon, color palette, typography, and voice guidelines are
documented in **[docs/brand-guide.md](./docs/brand-guide.md)**.

---

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm api:lint
pnpm api:test
```

---

## Deployment

Frontend is deployed to **Cloudflare Pages** — see `apps/web/wrangler.toml`.

Set secret environment variables (e.g. `ANTHROPIC_API_KEY`) in the
**Cloudflare dashboard → Pages → Settings → Environment variables**.
Never put secrets in `wrangler.toml`.
