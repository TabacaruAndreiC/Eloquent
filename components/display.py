"""
UI components for displaying speech analysis results.
"""

import streamlit as st


def display_annotated_text(transcript: str, filler_words: list):
    """
    Display transcript with filler words highlighted in red with strikethrough.
    
    Args:
        transcript: The original transcribed text
        filler_words: List of filler word dictionaries with 'word' key
    """
    if not transcript:
        st.warning("No text to display.")
        return
    
    # Build set of filler words (lowercase for comparison)
    fillers = {fw["word"].lower() for fw in filler_words}
    
    # Annotate text with HTML
    words = transcript.split()
    annotated = []
    
    for word in words:
        # Clean word for comparison (remove punctuation)
        clean_word = word.lower().strip(".,!?;:'\"()-")
        
        if clean_word in fillers:
            # Red strikethrough for filler words
            annotated.append(
                f'<span style="color: #ff4444; text-decoration: line-through; '
                f'background-color: rgba(255, 68, 68, 0.1); padding: 2px 4px; '
                f'border-radius: 3px;">{word}</span>'
            )
        else:
            annotated.append(word)
    
    # Display with custom styling
    st.markdown(
        f'<div style="line-height: 1.8; font-size: 16px; text-align: justify;">'
        f'{" ".join(annotated)}'
        f'</div>',
        unsafe_allow_html=True
    )


def display_charisma_gauge(score: int):
    """
    Display a visual gauge for charisma score with color coding.
    
    Args:
        score: Charisma score from 1-100
    """
    # Determine color and emoji based on score
    if score >= 90:
        color = "#00c853"  # Green
        emoji = "🏆"
        label = "Outstanding!"
    elif score >= 70:
        color = "#00c853"  # Green
        emoji = "💪"
        label = "Great job!"
    elif score >= 50:
        color = "#ff9800"  # Orange
        emoji = "👍"
        label = "Keep practicing"
    elif score >= 30:
        color = "#ff5252"  # Red
        emoji = "😕"
        label = "Needs work"
    elif score >= 15:
        color = "#ff5252"  # Red
        emoji = "😟"
        label = "Needs serious improvement"
    else:
        color = "#ff1744"  # Dark red
        emoji = "😰"
        label = "Critical - practice required"
    
    # Display metric with custom styling
    st.markdown(
        f"""
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                    border-radius: 15px; margin-bottom: 20px;">
            <h1 style="font-size: 64px; margin: 0; color: {color};">{score}</h1>
            <p style="font-size: 18px; color: #888; margin: 5px 0;">/ 100</p>
            <p style="font-size: 24px; margin: 10px 0;">{emoji} {label}</p>
            <p style="color: #666; font-size: 14px;">Charisma Score</p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Progress bar
    st.progress(score / 100)


def display_suggestions_table(vocabulary_suggestions: list, incoherence_moments: list):
    """
    Display vocabulary suggestions and incoherence moments in organized tables.
    
    Args:
        vocabulary_suggestions: List of vocabulary improvement suggestions
        incoherence_moments: List of incoherent moments detected
    """
    # Vocabulary Suggestions
    if vocabulary_suggestions:
        st.markdown("### 📚 Vocabulary Suggestions")
        
        for i, suggestion in enumerate(vocabulary_suggestions, 1):
            with st.expander(f"Suggestion {i}: **{suggestion.get('original', 'N/A')}** → **{suggestion.get('suggestion', 'N/A')}**"):
                st.markdown(f"**Context:** {suggestion.get('context', 'Not specified')}")
    else:
        st.info("✅ The vocabulary used is appropriate!")
    
    # Incoherence Moments
    if incoherence_moments:
        st.markdown("### ⚠️ Incoherence Moments")
        
        for i, moment in enumerate(incoherence_moments, 1):
            with st.expander(f"Issue {i}: {moment.get('issue', 'Issue detected')}", expanded=False):
                st.markdown(f"**Original text:** _{moment.get('text', 'N/A')}_")
                st.markdown(f"**Suggestion:** {moment.get('suggestion', 'Not specified')}")
    else:
        st.success("✅ The speech is coherent!")


def display_strengths(strengths: list):
    """
    Display the positive aspects of the speech.
    
    Args:
        strengths: List of strength strings
    """
    if strengths:
        st.markdown("### 💪 Strengths")
        for strength in strengths:
            st.markdown(f"✅ {strength}")
    else:
        st.info("Keep practicing to develop your strengths!")


def display_filler_words_summary(filler_words: list):
    """
    Display a summary of filler words detected.
    
    Args:
        filler_words: List of filler word dictionaries
    """
    if filler_words:
        st.markdown("### 🚫 Filler Words Detected")
        
        # Create columns for filler words display
        cols = st.columns(min(len(filler_words), 4))
        
        for i, fw in enumerate(filler_words):
            with cols[i % 4]:
                st.metric(
                    label=f'"{fw.get("word", "N/A")}"',
                    value=f'{fw.get("count", 0)}x',
                    delta=None
                )
        
        total_fillers = sum(fw.get("count", 0) for fw in filler_words)
        st.caption(f"Total filler words: **{total_fillers}**")
    else:
        st.success("🎉 Excellent! No filler words detected!")


def display_overall_feedback(feedback: str):
    """
    Display the overall feedback in a styled box.
    
    Args:
        feedback: Overall feedback string
    """
    st.markdown("### 📝 Overall Feedback")
    st.markdown(
        f"""
        <div style="background-color: #262730; padding: 20px; border-radius: 10px; 
                    border-left: 4px solid #ff9800;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">{feedback}</p>
        </div>
        """,
        unsafe_allow_html=True
    )


def display_improvement_tips(tips: list):
    """
    Display actionable improvement tips.
    
    Args:
        tips: List of improvement tip strings
    """
    if tips:
        st.markdown("### 🎯 Action Plan - How to Improve")
        st.markdown(
            """
            <div style="background-color: #1a1a2e; padding: 15px; border-radius: 10px; 
                        border: 1px solid #ff5252; margin-bottom: 10px;">
                <p style="color: #ff5252; font-weight: bold; margin: 0 0 10px 0;">
                    ⚠️ Focus on these areas to improve your speaking:
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        for i, tip in enumerate(tips, 1):
            st.markdown(
                f"""
                <div style="background-color: #262730; padding: 12px 15px; border-radius: 8px; 
                            margin-bottom: 8px; border-left: 3px solid #667eea;">
                    <p style="margin: 0; font-size: 15px;">
                        <strong style="color: #667eea;">{i}.</strong> {tip}
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )
