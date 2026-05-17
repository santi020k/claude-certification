# apps/web — Claude Certification Playground

Next.js frontend for the Claude Certification project.

## What it does

- Provides a shadcn-style Claude playground UI.
- Calls `POST /api/ask` on the FastAPI backend.
- Runs the demo endpoint and API health check from the browser.
- Uses `NEXT_PUBLIC_API_URL` to decide which backend to call.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The FastAPI backend should be running at the URL configured by
`NEXT_PUBLIC_API_URL`, usually `http://localhost:8000`.
