# Certification — Turborepo Monorepo

> **Next.js** (frontend) + **FastAPI** (backend) + **Cloudflare** (deployment)

## Project structure

```
certification/
├── apps/
│   ├── web/          ← Next.js 15 — Cloudflare Pages
│   └── api/          ← FastAPI + Claude — Python
├── packages/
│   └── shared/       ← (future) shared types / utils
├── .env              ← your local secrets (gitignored)
├── .env.template     ← copy this to .env and fill in values
├── turbo.json        ← Turborepo pipeline
└── package.json      ← workspace root
```

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| pnpm | ≥ 10 |
| Python | ≥ 3.11 |
| pip | latest |

## First-time setup

```bash
# 1. Clone the repo and enter it
cd certification

# 2. Copy the env template
cp .env.template .env
# → Open .env and set ANTHROPIC_API_KEY and any other values

# 3. Install Node dependencies (frontend + turbo)
pnpm install

# 4. Set up the Python backend
cd apps/api
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

## Running in development

**Terminal 1 — FastAPI backend:**
```bash
cd apps/api
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Next.js frontend:**
```bash
pnpm dev   # runs turbo dev → starts apps/web on :3000
```

## API testing URLs (Postman / curl)

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8000/ | Root — server alive? |
| GET | http://localhost:8000/api/health | Health + env info |
| GET | http://localhost:8000/api/ask/demo | Demo: quantum computing |
| POST | http://localhost:8000/api/ask | Ask Claude anything |
| — | http://localhost:8000/docs | Swagger UI (interactive) |

### POST /api/ask — example body

```json
{
  "question": "What is a neural network?",
  "max_tokens": 500,
  "one_sentence": false
}
```

## Deployment

See `apps/web/wrangler.toml` for Cloudflare Pages config.  
Secret env vars (e.g. `ANTHROPIC_API_KEY`) must be set in the Cloudflare dashboard, never in `wrangler.toml`.
