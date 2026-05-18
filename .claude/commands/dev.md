# /dev — Start the full dev stack

Opens two processes: the FastAPI backend and the Next.js frontend.

**Backend** (Terminal 1):

```bash
cd apps/api && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (Terminal 2):

```bash
pnpm dev
```

Then open:

- API: http://localhost:8000/docs
- Web: http://localhost:3000
