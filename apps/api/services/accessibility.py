"""
services/accessibility.py — Accessibility auditing service wrapping Claude.

This module reads files from the workspace securely, prompts Claude to
analyze them against WCAG 2.2 AA guidelines, and parses the structured response.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from config import MODEL
from services.claude import get_client, extract_text, ClaudeServiceError

logger = logging.getLogger("claude-certification.api")

# Determine the workspace root (three directories up from apps/api/services)
WORKSPACE_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

SYSTEM_PROMPT = """You are an elite web accessibility engineer specializing in WCAG 2.2 Level AA compliance, semantic HTML, and CSS color contrast checks.

Your task is to analyze the provided source code (HTML/React/Next.js/CSS) for any visual and structural accessibility issues.
Specifically, look for:
1. Low contrast text or UI controls (e.g., text-white/15 or text-muted-foreground/20 on dark backgrounds, or colors that clearly fail WCAG AA 4.5:1 ratio).
2. Keyboard accessibility (missing focus rings, non-interactive elements with click handlers but no keydown, tab index greater than 0, keyboard traps).
3. Missing semantic HTML structure (lack of skip-to-content links, bad heading hierarchy, div/span buttons instead of native <button>).
4. Forms and inputs missing proper labels, aria-describedby, or error live regions.
5. Missing or poor alternative text for images and SVGs.

You MUST respond strictly with a valid JSON block wrapped inside <json_response> and </json_response> XML tags. Do not put any other text outside these tags.
The JSON must be a dictionary matching this structure:
{
  "violations": [
    {
      "line": 12,
      "element": "<button className=\\"text-white/15\\">Click me</button>",
      "type": "contrast",
      "severity": "critical",
      "wcag_guideline": "1.4.3 Contrast (Minimum) (AA)",
      "description": "The element uses white text with 15% opacity on a dark background, yielding a contrast ratio far below 4.5:1.",
      "recommendation": "Use text-white/70 or a higher-contrast class to meet WCAG AA requirements."
    }
  ],
  "summary": "### Accessibility Audit Summary\\n\\nA brief summary of the audit findings in Markdown format."
}

Do not include backticks in your JSON unless they are escaped inside strings. Ensure all JSON keys and values are validly escaped.
"""


def analyze_accessibility(file_path: str, code: str | None = None) -> dict[str, Any]:
    """
    Perform an accessibility analysis of the given code or file.

    Parameters
    ----------
    file_path:
        Relative path to the workspace file (e.g., "apps/web/src/app/globals.css").
    code:
        Optional source code string. If empty, the file will be read from the workspace.

    Returns
    -------
    dict
        Structured analysis report with violations and summary.
    """
    # 1. Resolve source code
    if not code:
        # Resolve absolute path and prevent path traversal outside workspace
        safe_path = os.path.abspath(os.path.join(WORKSPACE_ROOT, file_path))
        if not safe_path.startswith(WORKSPACE_ROOT):
            raise ClaudeServiceError("Access denied: path is outside the workspace root.")

        if not os.path.exists(safe_path) or not os.path.isfile(safe_path):
            raise ClaudeServiceError(f"File not found: {file_path}")

        try:
            with open(safe_path, "r", encoding="utf-8") as f:
                code = f.read()
        except Exception as exc:
            raise ClaudeServiceError(f"Failed to read file: {str(exc)}")

    # 2. Query Claude
    question = (
        f"Please perform an accessibility audit on this code from '{file_path}':\n\n"
        f"```tsx\n{code}\n```"
    )

    logger.info("Accessibility audit requested for file: %s (length=%d)", file_path, len(code))

    try:
        response = get_client().messages.create(
            model=MODEL,
            max_tokens=2500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": question}],
        )
    except Exception as exc:
        logger.error("Claude call failed during accessibility check: %s", exc)
        raise ClaudeServiceError(f"Claude failed to analyze accessibility: {str(exc)}")

    answer_text = extract_text(response.content)

    # 3. Parse XML-wrapped JSON
    try:
        start_tag = "<json_response>"
        end_tag = "</json_response>"

        start_idx = answer_text.find(start_tag)
        end_idx = answer_text.find(end_tag)

        if start_idx == -1 or end_idx == -1:
            # Fallback to parsing raw text if Claude forgot tags but outputted JSON
            cleaned_text = answer_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            parsed = json.loads(cleaned_text)
        else:
            json_str = answer_text[start_idx + len(start_tag) : end_idx].strip()
            parsed = json.loads(json_str)

        return {
            "file_path": file_path,
            "violations": parsed.get("violations", []),
            "summary": parsed.get("summary", "No summary provided."),
            "model": MODEL,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }
    except Exception as exc:
        logger.error(
            "Failed to parse JSON response from Claude: %s\nResponse was:\n%s",
            exc,
            answer_text,
        )
        raise ClaudeServiceError(
            f"Failed to parse accessibility audit results: {str(exc)}"
        )
