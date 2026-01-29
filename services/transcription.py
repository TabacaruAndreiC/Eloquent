"""
Whisper API integration for audio transcription.
Configured to preserve filler words and hesitations.
"""

import os
import tempfile
from openai import OpenAI


def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribe audio bytes to text using OpenAI Whisper API.
    
    Args:
        audio_bytes: Raw audio bytes in WAV format
        
    Returns:
        Transcribed text with filler words preserved
    """
    client = OpenAI()
    
    # Save bytes to temp file (Whisper API needs a file)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name
    
    try:
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                temperature=0.0,
                # Prompt to preserve filler words and hesitations
                prompt="Um, uh, ah, like, you know, so, well, I mean, basically, actually, honestly, right, okay. Include all hesitations, stutters, and filler sounds exactly as spoken."
            )
        return transcript.text
    finally:
        # Clean up temp file
        os.unlink(temp_path)
