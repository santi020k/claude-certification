"""Weather endpoint demonstrating Claude tool use."""

import logging

from fastapi import APIRouter, HTTPException, Request, Response

from config import ASK_RATE_LIMIT
from middleware.rate_limit import limiter
from models import WeatherObservation, WeatherRequest, WeatherResponse
from services.claude import ClaudeServiceError, ask_weather_claude
from services.weather import WeatherServiceError

logger = logging.getLogger("claude-certification.api")

router = APIRouter(prefix="/api", tags=["weather"])


@router.post("/weather", response_model=WeatherResponse)
@limiter.limit(ASK_RATE_LIMIT)
def ask_weather(
    request: Request, response: Response, body: WeatherRequest
) -> WeatherResponse:
    """Ask Claude about current weather using a backend weather tool."""
    logger.info(
        "POST /api/weather — ip=%s location=%s question_chars=%d",
        request.client.host if request.client else "unknown",
        body.location,
        len(body.question or ""),
    )

    try:
        result = ask_weather_claude(
            location=body.location,
            question=body.question,
            max_tokens=body.max_tokens,
            unit=body.unit,
        )
    except WeatherServiceError as exc:
        logger.warning("Weather lookup error: %s", exc, exc_info=True)
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except ClaudeServiceError as exc:
        logger.warning("Claude weather service error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.public_message,
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in POST /api/weather")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error. Please try again.",
        ) from exc

    return WeatherResponse(
        location=result["location"],
        question=result["question"],
        answer=result["answer"],
        model=result["model"],
        tool_name=result["tool_name"],
        weather=WeatherObservation(**result["weather"]),
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
    )
