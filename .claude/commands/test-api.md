# /test-api — Run API smoke tests

Runs the demo endpoint and a custom POST to verify the backend works end-to-end.

```bash
set -e
BASE=http://localhost:8000

echo "=== Root ==="
curl -sf $BASE/ | python3 -m json.tool

echo "\n=== Health ==="
curl -sf $BASE/api/health | python3 -m json.tool

echo "\n=== Demo ==="
curl -sf $BASE/api/ask/demo | python3 -m json.tool

echo "\n=== Custom ask ==="
curl -sf -X POST $BASE/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is FastAPI?","max_tokens":150,"one_sentence":true}' \
  | python3 -m json.tool

echo "\n✅ All checks passed"
```
