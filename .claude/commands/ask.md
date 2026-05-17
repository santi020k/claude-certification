# /ask — Quick Claude API test

Sends a test question to the local API and prints the response.

```bash
curl -s -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "$ARGUMENTS", "max_tokens": 300}' | python3 -m json.tool
```

**Usage:** `/ask What is a Python generator?`
