"""Export the FastAPI OpenAPI schema used to generate shared TypeScript types."""

from __future__ import annotations

import json
from pathlib import Path

from main import app


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "packages" / "shared" / "openapi.json"


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
