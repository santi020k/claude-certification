"""
models.py — Pydantic request / response schemas for the Certification API.

Pydantic models serve two purposes here:
  1. Runtime validation — FastAPI automatically validates incoming JSON bodies
     against these classes and returns a 422 Unprocessable Entity if the data
     doesn't match.
  2. OpenAPI documentation — the schemas are reflected into the auto-generated
     /docs (Swagger UI) and /redoc pages, so you get interactive API docs for
     free.

Add new endpoints?  Define their request/response shapes here.
"""

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    """Body expected by POST /api/ask."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=4000,
        description="The question you want Claude to answer.",
        examples=["Explain Python decorators in simple terms"],
    )
    max_tokens: int = Field(
        default=1000,
        ge=50,
        le=4000,
        description="Upper limit on Claude's response length (tokens).",
    )
    one_sentence: bool = Field(
        default=False,
        description="When True, instructs Claude to answer in a single sentence.",
    )


class AskResponse(BaseModel):
    """Response returned by POST /api/ask and GET /api/ask/demo."""

    question: str = Field(description="The original question that was sent to Claude.")
    answer: str = Field(description="Claude's answer.")
    model: str = Field(description="The Claude model that generated the answer.")
    input_tokens: int = Field(description="Prompt tokens consumed (for billing reference).")
    output_tokens: int = Field(description="Completion tokens consumed (for billing reference).")


class HealthResponse(BaseModel):
    """Response returned by GET /api/health."""

    status: str
    environment: str
    anthropic_api_key_configured: bool
    model: str
    allowed_origins: list[str]
