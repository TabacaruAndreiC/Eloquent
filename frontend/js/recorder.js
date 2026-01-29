/**
 * Recorder Module
 * ===============
 * Handles audio recording using the Web Audio API.
 * Optimized for speech transcription with Whisper.
 */

const Recorder = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    startTime: null,
    mimeType: null,
    
    /**
     * Check if recording is supported
     * @returns {boolean}
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },
    
    /**
     * Get the best supported MIME type for transcription
     * @returns {string}
     */
    getBestMimeType() {
        // Prefer formats that Whisper handles well
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus', 
            'audio/mp4',
            'audio/mpeg'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    },
    
    /**
     * Get file extension for the MIME type
     * @param {string} mimeType
     * @returns {string}
     */
    getFileExtension(mimeType) {
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mp4')) return 'mp4';
        if (mimeType.includes('mpeg')) return 'mp3';
        return 'webm';
    },
    
    /**
     * Start recording audio
     * @param {Function} onStart - Callback when recording starts
     * @param {Function} onError - Callback on error
     */
    async start(onStart, onError) {
        try {
            if (!this.isSupported()) {
                throw new Error('Audio recording is not supported in this browser');
            }
            
            // Request high quality audio optimized for speech
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,           // Mono for speech
                    sampleRate: 16000,         // 16kHz is optimal for Whisper
                    sampleSize: 16,            // 16-bit audio
                    echoCancellation: false,   // Disable - can distort speech
                    noiseSuppression: false,   // Disable - Whisper handles noise well
                    autoGainControl: true      // Keep this for volume normalization
                }
            });
            
            this.audioChunks = [];
            this.startTime = Date.now();
            this.mimeType = this.getBestMimeType();
            
            // Use higher bitrate for better quality
            const options = { 
                mimeType: this.mimeType,
                audioBitsPerSecond: 128000
            };
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // Collect data more frequently for smoother recording
            this.mediaRecorder.start(250);
            
            if (onStart) onStart();
            
        } catch (error) {
            console.error('Recording error:', error);
            if (onError) onError(error);
        }
    },
    
    /**
     * Stop recording and return audio blob
     * @returns {Promise<{blob: Blob, duration: number, extension: string}>}
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('No active recording'));
                return;
            }
            
            this.mediaRecorder.onstop = () => {
                const duration = (Date.now() - this.startTime) / 1000;
                const blob = new Blob(this.audioChunks, { 
                    type: this.mimeType 
                });
                const extension = this.getFileExtension(this.mimeType);
                
                // Clean up
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                
                console.log(`Recording complete: ${duration.toFixed(1)}s, ${(blob.size/1024).toFixed(1)}KB, ${this.mimeType}`);
                
                resolve({ blob, duration, extension });
            };
            
            this.mediaRecorder.onerror = (error) => {
                reject(error);
            };
            
            this.mediaRecorder.stop();
        });
    },
    
    /**
     * Check if currently recording
     * @returns {boolean}
     */
    isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    },
    
    /**
     * Get current recording duration in seconds
     * @returns {number}
     */
    getDuration() {
        if (!this.startTime) return 0;
        return (Date.now() - this.startTime) / 1000;
    }
};
