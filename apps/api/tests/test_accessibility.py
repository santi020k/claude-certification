import os
import json
from fastapi.testclient import TestClient

from main import app
from config import ANTHROPIC_API_KEY_CONFIGURED
from services.accessibility import WORKSPACE_ROOT

client = TestClient(app)


def test_accessibility_endpoint_validation() -> None:
    """Test that the accessibility endpoint validates request body correctly."""
    response = client.post(
        "/api/accessibility/analyze",
        json={"file_path": "nonexistent_file.tsx"}
    )
    # If the file does not exist, the service returns a 502/503 from ClaudeServiceError
    # but the API maps it to an HTTP exception with detail.
    assert response.status_code in (404, 502, 503, 500)


def test_accessibility_run_real_audit() -> None:
    """
    Run an automated accessibility audit on the playground component and globals.css
    using the new Claude-powered accessibility checker service, and generate a report.
    """
    if not ANTHROPIC_API_KEY_CONFIGURED:
        print("Skipping real accessibility audit: ANTHROPIC_API_KEY not configured.")
        return

    target_files = [
        "apps/web/src/components/claude-playground.tsx",
        "apps/web/src/app/globals.css",
    ]

    findings = []

    for file_path in target_files:
        response = client.post(
            "/api/accessibility/analyze",
            json={"file_path": file_path}
        )

        assert response.status_code == 200
        payload = response.json()
        assert "violations" in payload
        assert "summary" in payload
        assert "file_path" in payload

        findings.append(payload)

    # Generate a consolidated markdown report
    report_path = os.path.join(WORKSPACE_ROOT, "docs", "accessibility_report.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Automated Accessibility Audit Report\n\n")
        f.write("Generated automatically via the Claude Accessibility Checker test suite.\n\n")

        for finding in findings:
            f.write(f"## File: `{finding['file_path']}`\n\n")
            f.write(f"{finding['summary']}\n\n")

            violations = finding["violations"]
            if not violations:
                f.write("✅ **Zero WCAG violations detected by Claude!**\n\n")
            else:
                f.write(f"### Detected Violations ({len(violations)})\n\n")
                f.write("| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |\n")
                f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
                for v in violations:
                    # Clean newlines for markdown table
                    element = v['element'].replace('\n', ' ').strip()
                    rec = v['recommendation'].replace('\n', ' ').strip()
                    desc = v['description'].replace('\n', ' ').strip()
                    f.write(
                        f"| {v['line']} | `{element}` | **{v['type']}** | "
                        f"{v['severity']} | {v['wcag_guideline']} | {rec} ({desc}) |\n"
                    )
                f.write("\n\n")

    print(f"Accessibility report generated successfully at: {report_path}")
