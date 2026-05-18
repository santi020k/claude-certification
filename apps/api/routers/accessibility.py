"""
routers/accessibility.py — Endpoints for automated accessibility checks via Claude.
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from config import ASK_RATE_LIMIT
from middleware.rate_limit import limiter
from models import AccessibilityAnalyzeRequest, AccessibilityAnalyzeResponse
from services.accessibility import analyze_accessibility
from services.claude import ClaudeServiceError

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api/accessibility", tags=["accessibility"])


@router.post("/analyze", response_model=AccessibilityAnalyzeResponse)
@limiter.limit(ASK_RATE_LIMIT)
def analyze_file_accessibility(
    request: Request, body: AccessibilityAnalyzeRequest
) -> AccessibilityAnalyzeResponse:
    """
    Analyze a workspace file or code snippet for accessibility violations using Claude.

    **Rate limit:** 10 requests per minute per IP.

    **Example request body**
    ```json
    {
      "file_path": "apps/web/src/app/globals.css"
    }
    ```
    """
    logger.info(
        "POST /api/accessibility/analyze — ip=%s file_path=%s has_code=%s",
        request.client.host if request.client else "unknown",
        body.file_path,
        body.code is not None,
    )

    try:
        result = analyze_accessibility(body.file_path, code=body.code)
    except ClaudeServiceError as exc:
        logger.warning("Accessibility service error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in POST /api/accessibility/analyze")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error. Please try again.",
        ) from exc

    return AccessibilityAnalyzeResponse(**result)
