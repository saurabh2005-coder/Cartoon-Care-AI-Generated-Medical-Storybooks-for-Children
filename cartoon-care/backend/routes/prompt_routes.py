"""
prompt_routes.py — API endpoints for the prompt builder

Endpoints:
  POST /prompts/build    → Build and preview prompts without generating a story
  GET  /prompts/diseases → List all supported diseases with their metaphors

These are useful for:
  - Testing what prompts get generated
  - Debugging prompt quality
  - Letting advanced users preview/tweak prompts
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prompts", tags=["Prompt Builder"])


class PromptPreviewRequest(BaseModel):
    """Input for the prompt preview endpoint."""
    child_name: str = Field(..., examples=["Emma"])
    age: int = Field(..., ge=5, le=11, examples=[7])
    disease: str = Field(..., examples=["asthma"])
    theme: Optional[str] = Field(default=None, examples=["Spider-Man"])
    num_pages: int = Field(default=6, ge=3, le=10)


@router.post(
    "/build",
    summary="Preview generated prompts",
    description=(
        "Build and preview the story + image prompts without running the full pipeline. "
        "Great for testing prompt quality. Uses Groq if API key is set, otherwise rule-based."
    ),
)
async def preview_prompts(request: PromptPreviewRequest):
    """
    Returns the full set of prompts that would be used for story generation.
    Lets you see exactly what gets sent to Ollama and Stable Diffusion.
    """
    from ai.prompt_builder.prompt_builder import build_prompts

    logger.info(f"Prompt preview request: {request.child_name}, {request.disease}")

    prompts = await build_prompts(
        child_name=request.child_name,
        age=request.age,
        disease=request.disease,
        theme=request.theme,
        num_pages=request.num_pages,
    )

    return {
        "input": request.model_dump(),
        # model_dump(): converts the Pydantic object back to a dict
        "prompts": prompts,
        "story_prompt_length": len(prompts["story_prompt"]),
        "num_image_prompts": len(prompts["page_image_prompts"]),
        "builder_used": "groq" if _groq_available() else "rule-based",
    }


@router.get(
    "/diseases",
    summary="List supported diseases",
    description="Returns all diseases with their child-friendly metaphors.",
)
async def list_diseases():
    """
    Returns the disease metaphor library.
    Useful for the frontend to show supported diseases.
    """
    from ai.prompt_builder.prompt_builder import DISEASE_METAPHORS

    return {
        "supported_diseases": list(DISEASE_METAPHORS.keys()),
        "metaphors": DISEASE_METAPHORS,
        "note": "Any disease works — unlisted ones get a friendly generic metaphor",
    }


@router.get(
    "/languages",
    summary="List supported languages",
    description="Returns all languages the storybook can be translated into.",
)
async def list_languages():
    """Returns all supported translation languages."""
    from ai.story_generator.translator import LANGUAGE_CODES

    return {
        "languages": [lang.capitalize() for lang in LANGUAGE_CODES.keys()],
        "default": "English",
        "note": "Translation uses local MarianMT models — downloads ~300MB on first use per language",
    }


def _groq_available() -> bool:
    """Check if Groq API key is configured."""
    from app.config import settings
    return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here")
