"""
Text-to-Speech API Routes
Endpoints for generating read-aloud audio
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from services.tts_service import tts_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])


class TTSRequest(BaseModel):
    """Request model for TTS generation"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice_id: str = Field(None, description="ElevenLabs voice ID (optional)")
    stability: float = Field(0.5, ge=0, le=1, description="Voice stability (0-1)")
    similarity_boost: float = Field(0.75, ge=0, le=1, description="Voice similarity (0-1)")


@router.post("/generate")
async def generate_speech(request: TTSRequest):
    """
    Generate speech audio from text
    
    Returns MP3 audio file
    """
    try:
        audio_bytes = await tts_service.generate_speech(
            text=request.text,
            voice_id=request.voice_id,
            stability=request.stability,
            similarity_boost=request.similarity_boost
        )
        
        # Return audio as MP3
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in TTS generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")


@router.get("/voices")
async def get_voices():
    """
    Get list of available voices
    """
    try:
        voices = tts_service.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Error fetching voices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch voices")


@router.get("/voices/child-friendly")
async def get_child_friendly_voices():
    """
    Get recommended child-friendly voices
    """
    return {"voices": tts_service.get_child_friendly_voices()}


@router.get("/health")
async def tts_health():
    """
    Check if TTS service is configured and working
    """
    if not tts_service.client:
        return {
            "status": "not_configured",
            "message": "ElevenLabs API key not configured"
        }
    
    return {
        "status": "ok",
        "message": "TTS service is ready"
    }
