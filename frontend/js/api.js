/**
 * API Module
 * ==========
 * Handles all communication with the backend API.
 */

const API = {
    BASE_URL: '',  // Same origin
    
    /**
     * Transcribe audio file
     * @param {Blob} audioBlob - Audio blob to transcribe
     * @param {string} extension - File extension (webm, ogg, mp4, etc.)
     * @returns {Promise<{transcript: string}>}
     */
    async transcribe(audioBlob, extension = 'webm') {
        const formData = new FormData();
        formData.append('audio', audioBlob, `recording.${extension}`);
        
        const response = await fetch(`${this.BASE_URL}/api/transcribe`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Transcription failed');
        }
        
        return response.json();
    },
    
    /**
     * Analyze speech transcript
     * @param {string} transcript - Text to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyze(transcript) {
        const response = await fetch(`${this.BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transcript })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Analysis failed');
        }
        
        return response.json();
    }
};
