"""
Speech Analyzer - FastAPI Backend
REST API for speech transcription and analysis.
"""

import os
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from services.transcription import transcribe_audio
from services.analysis import analyze_speech

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

app = FastAPI(
    title="Speech Analyzer API",
    description="Analyze speeches and get feedback to improve public speaking skills",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    transcript: str


class TranscriptResponse(BaseModel):
    transcript: str


class AnalysisResponse(BaseModel):
    charisma_score: int
    filler_words: list
    incoherence_moments: list
    vocabulary_suggestions: list
    overall_feedback: str
    strengths: list
    improvement_tips: list


@app.post("/api/transcribe", response_model=TranscriptResponse)
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe audio file to text using OpenAI Whisper.
    Accepts WAV, MP3, WebM, or OGG audio files.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    try:
        audio_bytes = await audio.read()
        # Pass filename so Whisper knows the format
        transcript = transcribe_audio(audio_bytes, audio.filename or "audio.webm")
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a speech transcript using GPT-4o.
    Returns charisma score, filler words, and feedback.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    
    try:
        analysis = analyze_speech(request.transcript)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve frontend static files
frontend_path = Path(__file__).parent.parent / "frontend"

# Mount static directories
app.mount("/css", StaticFiles(directory=frontend_path / "css"), name="css")
app.mount("/js", StaticFiles(directory=frontend_path / "js"), name="js")


@app.get("/logo.png")
async def serve_logo():
    """Serve the app logo."""
    return FileResponse(frontend_path / "logo.png")


@app.get("/")
async def serve_frontend():
    """Serve the main frontend page."""
    return FileResponse(frontend_path / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
