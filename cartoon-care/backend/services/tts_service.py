"""
Text-to-Speech Service using ElevenLabs
Provides read-aloud functionality for storybooks
"""

import os
from elevenlabs import ElevenLabs
from elevenlabs import VoiceSettings
import logging

logger = logging.getLogger(__name__)


class TTSService:
    """Text-to-Speech service using ElevenLabs API"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        
        print(f"[TTS] Initializing with API key: {self.api_key[:10]}..." if self.api_key else "[TTS] No API key found")
        
        if not self.api_key or self.api_key == "your_elevenlabs_api_key_here":
            logger.warning("ElevenLabs API key not configured. TTS will not work.")
            print("[TTS] WARNING: API key not configured!")
            self.client = None
        else:
            try:
                self.client = ElevenLabs(api_key=self.api_key)
                print(f"[TTS] Successfully initialized ElevenLabs client")
            except Exception as e:
                print(f"[TTS] ERROR initializing client: {str(e)}")
                logger.error(f"Failed to initialize ElevenLabs client: {str(e)}")
                self.client = None
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> bytes:
        """
        Generate speech audio from text
        
        Args:
            text: The text to convert to speech
            voice_id: ElevenLabs voice ID (defaults to child-friendly voice)
            stability: Voice stability (0-1, lower = more expressive)
            similarity_boost: Voice similarity (0-1, higher = more similar to original)
            style: Style exaggeration (0-1, higher = more exaggerated)
            use_speaker_boost: Enhance voice clarity
            
        Returns:
            Audio bytes (MP3 format)
        """
        if not self.client:
            raise ValueError("ElevenLabs API key not configured")
        
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        
        # Use default voice if not specified
        voice_id = voice_id or self.voice_id
        
        try:
            logger.info(f"Generating speech for {len(text)} characters with voice {voice_id}")
            print(f"[TTS] Generating speech: {len(text)} chars, voice: {voice_id}")
            
            # Generate audio using ElevenLabs
            audio = self.client.generate(
                text=text,
                voice=voice_id,
                model="eleven_monolingual_v1",  # Fast, good quality
                voice_settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=similarity_boost,
                    style=style,
                    use_speaker_boost=use_speaker_boost
                )
            )
            
            # Convert generator to bytes
            audio_bytes = b"".join(audio)
            
            logger.info(f"Successfully generated {len(audio_bytes)} bytes of audio")
            print(f"[TTS] Success! Generated {len(audio_bytes)} bytes")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"Error generating speech: {str(e)}")
            print(f"[TTS] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def get_available_voices(self):
        """Get list of available voices from ElevenLabs"""
        if not self.client:
            return []
        
        try:
            voices = self.client.voices.get_all()
            return [
                {
                    "voice_id": voice.voice_id,
                    "name": voice.name,
                    "category": voice.category,
                    "description": voice.description
                }
                for voice in voices.voices
            ]
        except Exception as e:
            logger.error(f"Error fetching voices: {str(e)}")
            return []
    
    def get_child_friendly_voices(self):
        """Get recommended child-friendly voices"""
        return [
            {
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "name": "Rachel",
                "description": "Warm, clear, perfect for children's stories"
            },
            {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",
                "name": "Bella",
                "description": "Soft, gentle, great for bedtime stories"
            },
            {
                "voice_id": "ThT5KcBeYPX3keUQqHPh",
                "name": "Dorothy",
                "description": "Pleasant, friendly, engaging for kids"
            }
        ]


# Singleton instance
tts_service = TTSService()
