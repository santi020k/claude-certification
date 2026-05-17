# apps/api — FastAPI + Claude backend

## Quick start

```bash
# 1. Create and activate a virtual env (keeps deps isolated from your system)
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Make sure your .env file at the repo root has ANTHROPIC_API_KEY set
#    (copy .env.template → .env and fill in your key)

# 4. Run the dev server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at **http://localhost:8000**.

## Interactive docs

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI — try endpoints directly in browser |
| http://localhost:8000/redoc | ReDoc — clean reference docs |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root health check |
| GET | `/api/health` | Detailed health + env info |
| POST | `/api/ask` | Ask Claude any question |
| GET | `/api/ask/demo` | Pre-baked quantum computing demo |

## Postman collection

Import this as a **Raw JSON** collection in Postman:

```json
{
  "info": { "name": "Certification API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "item": [
    {
      "name": "Health Check",
      "request": { "method": "GET", "url": "http://localhost:8000/api/health" }
    },
    {
      "name": "Ask Demo (Quantum)",
      "request": { "method": "GET", "url": "http://localhost:8000/api/ask/demo" }
    },
    {
      "name": "Ask Custom Question",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/ask",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"question\": \"Explain Python decorators in simple terms\",\n  \"max_tokens\": 500,\n  \"one_sentence\": false\n}"
        }
      }
    }
  ]
}
```
