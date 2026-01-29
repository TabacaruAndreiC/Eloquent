"""
GPT-4o speech analysis service.
Analyzes transcribed text for filler words, coherence, and provides feedback.
"""

import json
from openai import OpenAI
from prompts.analysis_prompt import ANALYSIS_SYSTEM_PROMPT


def analyze_speech(transcript: str) -> dict:
    """
    Analyze a speech transcript using GPT-4o.
    
    Args:
        transcript: The transcribed speech text
        
    Returns:
        Dictionary containing:
        - charisma_score: int (1-100)
        - filler_words: list of detected filler words with counts
        - incoherence_moments: list of problematic sentences
        - vocabulary_suggestions: list of word improvements
        - overall_feedback: string with general feedback
        - strengths: list of positive aspects
    """
    client = OpenAI()
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this speech:\n\n{transcript}"}
        ],
        temperature=0.3,  # Lower temperature for consistent JSON output
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    
    # Ensure all required fields exist with defaults
    return {
        "charisma_score": result.get("charisma_score", 50),
        "filler_words": result.get("filler_words", []),
        "incoherence_moments": result.get("incoherence_moments", []),
        "vocabulary_suggestions": result.get("vocabulary_suggestions", []),
        "overall_feedback": result.get("overall_feedback", "Unable to generate feedback."),
        "strengths": result.get("strengths", []),
        "improvement_tips": result.get("improvement_tips", [])
    }
