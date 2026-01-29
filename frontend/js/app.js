/**
 * App Module
 * ==========
 * Main application controller.
 * Handles state management, event binding, and UI updates.
 */

const App = {
    // Application state
    state: {
        audioBlob: null,
        audioExtension: null,
        audioUrl: null,           // URL for audio playback
        transcript: null,
        analysis: null,
        isRecording: false,
        isProcessing: false,
        currentView: 'initial', // 'initial' | 'results' | 'history'
        previousView: null,
        history: [],
        menuOpen: false,
        currentRecordingName: null,
        currentHistoryIndex: null, // Track which history item we're viewing
        isEditingName: false,      // Currently editing the name inline
        pendingDeleteIndex: null,  // Index of item pending deletion
        isReRecording: false,      // Re-recording an existing entry
        reRecordingName: null,     // Name to keep when re-recording
        reRecordingIndex: null,    // History index to update when re-recording
        uploadedFile: null,        // Currently uploaded audio file
        uploadedFileUrl: null      // Object URL for uploaded file preview
    },
    
    // DOM element references
    elements: {},
    
    // LocalStorage key
    HISTORY_KEY: 'speech_analyzer_history',
    MAX_HISTORY_ITEMS: 20,
    
    /**
     * Convert a Blob to base64 data URL
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} Base64 data URL
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },
    
    /**
     * Fix audio duration issue for blob/data URLs
     * Browsers sometimes can't determine duration until audio is played
     * @param {HTMLAudioElement} audioEl - The audio element to fix
     */
    fixAudioDuration(audioEl) {
        audioEl.onloadedmetadata = () => {
            if (audioEl.duration === Infinity || isNaN(audioEl.duration)) {
                audioEl.currentTime = 1e101; // Seek to huge number to trigger duration calc
                audioEl.ontimeupdate = () => {
                    audioEl.ontimeupdate = null;
                    audioEl.currentTime = 0; // Seek back to start
                };
            }
        };
    },
    
    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.checkBrowserSupport();
        this.loadHistory();
        this.initAudioPlayers();
    },
    
    /**
     * Initialize custom audio players
     */
    initAudioPlayers() {
        // Initialize all custom audio players
        if (this.elements.initialCustomPlayer && this.elements.audioElement) {
            AudioPlayerController.init('initialCustomPlayer', this.elements.audioElement);
        }
        if (this.elements.resultsCustomPlayer && this.elements.resultsAudioElement) {
            AudioPlayerController.init('resultsCustomPlayer', this.elements.resultsAudioElement);
        }
        if (this.elements.uploadCustomPlayer && this.elements.uploadAudioElement) {
            AudioPlayerController.init('uploadCustomPlayer', this.elements.uploadAudioElement);
        }
    },
    
    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            // Views
            initialView: document.getElementById('initialView'),
            resultsView: document.getElementById('resultsView'),
            historyView: document.getElementById('historyView'),
            
            // App logo (home button)
            appLogo: document.getElementById('appLogo'),
            
            // Hamburger menu & dropdown
            hamburgerBtn: document.getElementById('hamburgerBtn'),
            dropdownMenu: document.getElementById('dropdownMenu'),
            menuOverlay: document.getElementById('menuOverlay'),
            
            // History page
            historyList: document.getElementById('historyList'),
            historyBackBtn: document.getElementById('historyBackBtn'),
            
            // Results name
            recordingName: document.getElementById('recordingName'),
            recordingNameInput: document.getElementById('recordingNameInput'),
            editNameBtn: document.getElementById('editNameBtn'),
            
            // Delete
            deleteRecordingBtn: document.getElementById('deleteRecordingBtn'),
            deleteModal: document.getElementById('deleteModal'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            
            // Upload modal
            uploadModal: document.getElementById('uploadModal'),
            closeUploadModal: document.getElementById('closeUploadModal'),
            uploadDropzone: document.getElementById('uploadDropzone'),
            audioFileInput: document.getElementById('audioFileInput'),
            uploadPreview: document.getElementById('uploadPreview'),
            uploadFileName: document.getElementById('uploadFileName'),
            uploadFileSize: document.getElementById('uploadFileSize'),
            uploadAudioElement: document.getElementById('uploadAudioElement'),
            removeUploadFile: document.getElementById('removeUploadFile'),
            cancelUploadBtn: document.getElementById('cancelUploadBtn'),
            analyzeUploadBtn: document.getElementById('analyzeUploadBtn'),
            
            // Recording elements
            recordBtn: document.getElementById('recordBtn'),
            recordBtnWrapper: document.querySelector('.record-btn-wrapper'),
            recordingStatus: document.getElementById('recordingStatus'),
            audioPlayer: document.getElementById('audioPlayer'),
            audioElement: document.getElementById('audioElement'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            analyzingOverlay: document.getElementById('analyzingOverlay'),
            loadingText: document.getElementById('loadingText'),
            
            // Results elements
            exportResultsBtn: document.getElementById('exportResultsBtn'),
            charismaGauge: document.getElementById('charismaGauge'),
            annotatedText: document.getElementById('annotatedText'),
            fillerWordsSummary: document.getElementById('fillerWordsSummary'),
            vocabularySuggestions: document.getElementById('vocabularySuggestions'),
            incoherenceMoments: document.getElementById('incoherenceMoments'),
            strengthsList: document.getElementById('strengthsList'),
            overallFeedback: document.getElementById('overallFeedback'),
            quickStats: document.getElementById('quickStats'),
            improvementTips: document.getElementById('improvementTips'),
            reRecordBtn: document.getElementById('reRecordBtn'),
            newRecordingBtn: document.getElementById('newRecordingBtn'),
            
            // Results audio playback
            resultsAudioSection: document.getElementById('resultsAudioSection'),
            resultsAudioElement: document.getElementById('resultsAudioElement'),
            resultsCustomPlayer: document.getElementById('resultsCustomPlayer'),
            downloadAudioBtn: document.getElementById('downloadAudioBtn'),
            
            // Custom audio players
            initialCustomPlayer: document.getElementById('initialCustomPlayer'),
            uploadCustomPlayer: document.getElementById('uploadCustomPlayer'),
            
            // Tabs
            tabs: document.querySelectorAll('.tab'),
            tabPanes: document.querySelectorAll('.tab-pane'),
            
            // Info modal
            infoBtn: document.getElementById('infoBtn'),
            infoModal: document.getElementById('infoModal'),
            closeModal: document.getElementById('closeModal')
        };
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // App logo - go home
        this.elements.appLogo.addEventListener('click', () => this.goHome());
        
        // Record button
        this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Analyze button
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeRecording());
        
        // Re-record button (re-record for the same entry)
        this.elements.reRecordBtn.addEventListener('click', () => this.reRecord());
        
        // New recording button (start fresh)
        this.elements.newRecordingBtn.addEventListener('click', () => this.newRecording());
        
        // Export results button
        this.elements.exportResultsBtn.addEventListener('click', () => this.exportResults());
        
        // Download audio button
        this.elements.downloadAudioBtn.addEventListener('click', () => this.downloadAudio());
        
        // Hamburger menu & dropdown
        this.elements.hamburgerBtn.addEventListener('click', () => this.toggleDropdownMenu());
        this.elements.menuOverlay.addEventListener('click', () => this.closeDropdownMenu());
        
        // Dropdown menu items
        this.elements.dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => this.handleMenuAction(item.dataset.action));
        });
        
        // History page back button
        this.elements.historyBackBtn.addEventListener('click', () => this.closeHistoryPage());
        
        // Edit name button
        this.elements.editNameBtn.addEventListener('click', () => this.editRecordingName());
        
        // Delete buttons
        this.elements.deleteRecordingBtn.addEventListener('click', () => this.showDeleteConfirmation());
        this.elements.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
        this.elements.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        this.elements.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.elements.deleteModal) this.hideDeleteModal();
        });
        
        // Upload modal
        this.elements.closeUploadModal.addEventListener('click', () => this.closeUploadModal());
        this.elements.cancelUploadBtn.addEventListener('click', () => this.closeUploadModal());
        this.elements.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.elements.uploadModal) this.closeUploadModal();
        });
        this.elements.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.removeUploadFile.addEventListener('click', () => this.removeUploadedFile());
        this.elements.analyzeUploadBtn.addEventListener('click', () => this.analyzeUploadedFile());
        
        // Drag and drop
        this.elements.uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadDropzone.classList.add('dragover');
        });
        this.elements.uploadDropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.elements.uploadDropzone.classList.remove('dragover');
        });
        this.elements.uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadDropzone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleDroppedFile(files[0]);
            }
        });
        
        // Tab navigation
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Info modal
        this.elements.infoBtn.addEventListener('click', () => this.showModal());
        this.elements.closeModal.addEventListener('click', () => this.hideModal());
        this.elements.infoModal.addEventListener('click', (e) => {
            if (e.target === this.elements.infoModal) this.hideModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                this.hideDeleteModal();
                this.closeUploadModal();
                this.closeDropdownMenu();
            }
        });
    },
    
    /**
     * Check browser support for required features
     */
    checkBrowserSupport() {
        if (!Recorder.isSupported()) {
            this.elements.recordBtn.disabled = true;
            this.elements.recordBtn.innerHTML = `
                <span class="record-btn-icon">⚠️</span>
                <span class="record-btn-text">Not Supported</span>
            `;
            this.showError('Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.');
        }
    },
    
    /**
     * Switch between views
     * @param {string} viewName - 'initial', 'results', or 'history'
     */
    switchView(viewName) {
        // Store previous view for back navigation
        if (viewName === 'history') {
            this.state.previousView = this.state.currentView;
        }
        
        this.state.currentView = viewName;
        
        // Hide all views
        this.elements.initialView.classList.add('hidden');
        this.elements.resultsView.classList.add('hidden');
        this.elements.historyView.classList.add('hidden');
        
        // Show the requested view
        if (viewName === 'initial') {
            this.elements.initialView.classList.remove('hidden');
        } else if (viewName === 'results') {
            this.elements.resultsView.classList.remove('hidden');
        } else if (viewName === 'history') {
            this.elements.historyView.classList.remove('hidden');
        }
    },
    
    /**
     * Toggle dropdown menu
     */
    toggleDropdownMenu() {
        if (this.state.menuOpen) {
            this.closeDropdownMenu();
        } else {
            this.openDropdownMenu();
        }
    },
    
    /**
     * Open dropdown menu
     */
    openDropdownMenu() {
        this.state.menuOpen = true;
        this.elements.dropdownMenu.classList.remove('hidden');
        // Trigger reflow for animation
        void this.elements.dropdownMenu.offsetWidth;
        this.elements.dropdownMenu.classList.add('visible');
        this.elements.menuOverlay.classList.remove('hidden');
        this.elements.menuOverlay.classList.add('visible');
        this.elements.hamburgerBtn.classList.add('active');
    },
    
    /**
     * Close dropdown menu
     */
    closeDropdownMenu() {
        this.state.menuOpen = false;
        this.elements.dropdownMenu.classList.remove('visible');
        this.elements.menuOverlay.classList.remove('visible');
        this.elements.hamburgerBtn.classList.remove('active');
        
        setTimeout(() => {
            this.elements.dropdownMenu.classList.add('hidden');
            this.elements.menuOverlay.classList.add('hidden');
        }, 200);
    },
    
    /**
     * Handle menu action
     * @param {string} action - The action to perform
     */
    handleMenuAction(action) {
        this.closeDropdownMenu();
        
        switch (action) {
            case 'history':
                this.openHistoryPage();
                break;
            case 'upload':
                this.openUploadModal();
                break;
        }
    },
    
    /**
     * Open history page
     */
    openHistoryPage() {
        this.renderHistory();
        this.switchView('history');
    },
    
    /**
     * Close history page and go back
     */
    closeHistoryPage() {
        const previousView = this.state.previousView || 'initial';
        this.switchView(previousView);
    },
    
    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.HISTORY_KEY);
            if (saved) {
                this.state.history = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
            this.state.history = [];
        }
        this.renderHistory();
    },
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            // Limit history size
            if (this.state.history.length > this.MAX_HISTORY_ITEMS) {
                this.state.history = this.state.history.slice(0, this.MAX_HISTORY_ITEMS);
            }
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.state.history));
        } catch (e) {
            console.error('Failed to save history:', e);
            
            // If quota exceeded, try saving without audio data
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                try {
                    const historyWithoutAudio = this.state.history.map(item => ({
                        ...item,
                        audioData: null // Remove audio data to save space
                    }));
                    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(historyWithoutAudio));
                    this.showError('Storage full - audio recordings could not be saved. Text analysis is preserved.');
                } catch (e2) {
                    console.error('Failed to save history even without audio:', e2);
                    this.showError('Could not save to history - storage is full.');
                }
            }
        }
    },
    
    /**
     * Add current analysis to history
     */
    async addToHistory() {
        if (!this.state.transcript || !this.state.analysis) return;
        
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: this.state.currentRecordingName || 'Unnamed Recording',
            transcript: this.state.transcript,
            analysis: this.state.analysis,
            audioData: null,
            audioExtension: this.state.audioExtension || 'webm'
        };
        
        // Store audio as base64 if available
        if (this.state.audioBlob) {
            try {
                historyItem.audioData = await this.blobToBase64(this.state.audioBlob);
            } catch (e) {
                console.error('Failed to convert audio to base64:', e);
            }
        }
        
        // Add to beginning of array
        this.state.history.unshift(historyItem);
        
        // Track that we're viewing the first item (just added)
        this.state.currentHistoryIndex = 0;
        
        this.saveHistory();
    },
    
    /**
     * Update an existing history entry (for re-recording)
     */
    async updateHistoryEntry() {
        if (!this.state.transcript || !this.state.analysis) return;
        if (this.state.currentHistoryIndex === null) return;
        
        const index = this.state.currentHistoryIndex;
        if (index >= 0 && index < this.state.history.length) {
            // Convert audio to base64 if available
            let audioData = null;
            if (this.state.audioBlob) {
                try {
                    audioData = await this.blobToBase64(this.state.audioBlob);
                } catch (e) {
                    console.error('Failed to convert audio to base64:', e);
                }
            }
            
            // Update the existing entry with new data but keep the name
            this.state.history[index] = {
                ...this.state.history[index],
                timestamp: new Date().toISOString(),
                transcript: this.state.transcript,
                analysis: this.state.analysis,
                audioData: audioData,
                audioExtension: this.state.audioExtension || 'webm'
            };
            
            this.saveHistory();
        }
    },
    
    /**
     * Render history list on history page
     */
    renderHistory() {
        if (this.state.history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="history-empty">No recordings yet. Start recording to build your history!</p>';
            return;
        }
        
        const items = this.state.history.map((item, index) => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const name = item.name || 'Unnamed Recording';
            const preview = item.transcript.substring(0, 100) + (item.transcript.length > 100 ? '...' : '');
            const score = item.analysis.charisma_score || 0;
            const wordCount = item.transcript.split(/\s+/).length;
            const fillerCount = item.analysis.filler_words 
                ? item.analysis.filler_words.reduce((sum, fw) => sum + (fw.count || 0), 0)
                : 0;
            
            return `
                <div class="history-item" data-index="${index}">
                    <button class="history-item-delete" data-delete-index="${index}" title="Delete recording">🗑️</button>
                    <h3 class="history-item-name">${name}</h3>
                    <div class="history-item-header">
                        <span class="history-item-score">${score}/100</span>
                        <span class="history-item-date">${formattedDate} at ${formattedTime}</span>
                    </div>
                    <p class="history-item-preview">"${preview}"</p>
                    <div class="history-item-stats">
                        <span class="history-stat">📝 <span class="history-stat-value">${wordCount} words</span></span>
                        <span class="history-stat">🚫 <span class="history-stat-value">${fillerCount} filler words</span></span>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.historyList.innerHTML = items;
        
        // Add click handlers for viewing
        this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking delete button
                if (e.target.closest('.history-item-delete')) return;
                
                const index = parseInt(item.dataset.index);
                this.loadFromHistory(index);
            });
        });
        
        // Add click handlers for delete buttons
        this.elements.historyList.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.deleteIndex);
                this.deleteFromHistory(index);
            });
        });
    },
    
    /**
     * Load a recording from history
     * @param {number} index - History item index
     */
    loadFromHistory(index) {
        const item = this.state.history[index];
        if (!item) return;
        
        this.state.transcript = item.transcript;
        this.state.analysis = item.analysis;
        this.state.currentRecordingName = item.name;
        this.state.currentHistoryIndex = index;
        
        // Clear any existing audio URL to free memory
        if (this.state.audioUrl) {
            URL.revokeObjectURL(this.state.audioUrl);
        }
        
        // Restore audio from stored base64 data if available
        if (item.audioData) {
            this.state.audioUrl = item.audioData; // Base64 data URL works directly
            this.state.audioExtension = item.audioExtension || 'webm';
            
            // Convert base64 back to blob for download functionality
            fetch(item.audioData)
                .then(res => res.blob())
                .then(blob => {
                    this.state.audioBlob = blob;
                })
                .catch(e => console.error('Failed to restore audio blob:', e));
        } else {
            this.state.audioUrl = null;
            this.state.audioBlob = null;
            this.state.audioExtension = null;
        }
        
        this.displayResults();
        this.updateRecordingNameDisplay();
        this.switchView('results');
    },
    
    /**
     * Toggle recording state
     */
    async toggleRecording() {
        if (this.state.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    },
    
    /**
     * Start recording
     */
    async startRecording() {
        // Add recording classes for animations
        this.elements.recordBtn.classList.add('recording');
        this.elements.recordBtnWrapper.classList.add('recording');
        
        this.elements.recordBtn.innerHTML = `
            <span class="record-btn-icon">⏹️</span>
            <span class="record-btn-text">Stop</span>
        `;
        
        // Show recording status with animation
        this.elements.recordingStatus.classList.remove('hidden');
        setTimeout(() => {
            this.elements.recordingStatus.classList.add('visible');
        }, 50);
        
        this.elements.audioPlayer.classList.add('hidden');
        this.elements.analyzeBtn.classList.add('hidden');
        
        await Recorder.start(
            () => {
                this.state.isRecording = true;
            },
            (error) => {
                this.showError('Could not access microphone: ' + error.message);
                this.resetRecordButton();
            }
        );
    },
    
    /**
     * Stop recording
     */
    async stopRecording() {
        try {
            const { blob, duration, extension } = await Recorder.stop();
            
            this.state.isRecording = false;
            this.state.audioBlob = blob;
            this.state.audioExtension = extension;
            this.state.transcript = null;
            this.state.analysis = null;
            
            // Store audio URL for playback in results view
            if (this.state.audioUrl) {
                URL.revokeObjectURL(this.state.audioUrl);
            }
            this.state.audioUrl = URL.createObjectURL(blob);
            
            this.resetRecordButton();
            
            // Hide recording status with animation
            this.elements.recordingStatus.classList.remove('visible');
            setTimeout(() => {
                this.elements.recordingStatus.classList.add('hidden');
            }, 400);
            
            // Show audio player
            const audioUrl = URL.createObjectURL(blob);
            const audioEl = this.elements.audioElement;
            audioEl.src = audioUrl;
            
            // Reset custom player UI
            const initialPlayer = AudioPlayerController.get('initialCustomPlayer');
            if (initialPlayer) {
                AudioPlayerController.reset(initialPlayer);
            }
            
            // Fix blob duration issue by seeking to end then back
            audioEl.onloadedmetadata = () => {
                if (audioEl.duration === Infinity || isNaN(audioEl.duration)) {
                    audioEl.currentTime = 1e101; // Seek to huge number to trigger duration calc
                    audioEl.ontimeupdate = () => {
                        audioEl.ontimeupdate = null;
                        audioEl.currentTime = 0; // Seek back to start
                        this.elements.audioPlayer.classList.remove('hidden');
                        this.elements.analyzeBtn.classList.remove('hidden');
                    };
                } else {
                    this.elements.audioPlayer.classList.remove('hidden');
                    this.elements.analyzeBtn.classList.remove('hidden');
                }
            };
            
            // Fallback
            setTimeout(() => {
                if (this.elements.audioPlayer.classList.contains('hidden')) {
                    this.elements.audioPlayer.classList.remove('hidden');
                    this.elements.analyzeBtn.classList.remove('hidden');
                }
            }, 1000);
            
        } catch (error) {
            this.showError('Error stopping recording: ' + error.message);
            this.resetRecordButton();
        }
    },
    
    /**
     * Reset record button to initial state
     */
    resetRecordButton() {
        this.elements.recordBtn.classList.remove('recording', 'analyzing');
        this.elements.recordBtnWrapper.classList.remove('recording');
        this.elements.recordBtn.innerHTML = `
            <span class="record-btn-icon">🎙️</span>
            <span class="record-btn-text">Start Recording</span>
        `;
    },
    
    /**
     * Analyze the recorded audio
     */
    async analyzeRecording() {
        if (!this.state.audioBlob) {
            this.showError('No recording to analyze');
            return;
        }
        
        this.state.isProcessing = true;
        
        // Start the Shazam-like transition
        this.elements.recordBtn.classList.add('analyzing');
        this.elements.analyzeBtn.classList.add('hidden');
        this.elements.audioPlayer.classList.add('hidden');
        
        // Show analyzing overlay after button shrinks
        setTimeout(() => {
            this.showAnalyzingOverlay('Transcribing audio...');
        }, 300);
        
        try {
            // Step 1: Transcribe
            const { transcript } = await API.transcribe(this.state.audioBlob, this.state.audioExtension || 'webm');
            this.state.transcript = transcript;
            
            // Step 2: Analyze
            this.setLoadingText('Analyzing speech...');
            const analysis = await API.analyze(transcript);
            this.state.analysis = analysis;
            
            // Handle re-recording vs new recording
            if (this.state.isReRecording && this.state.reRecordingIndex !== null) {
                // Re-recording: keep the existing name and update the history entry
                this.state.currentRecordingName = this.state.reRecordingName;
                this.state.currentHistoryIndex = this.state.reRecordingIndex;
                await this.updateHistoryEntry();
            } else {
                // New recording: generate default name and add to history
                const now = new Date();
                this.state.currentRecordingName = `Recording ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                await this.addToHistory();
            }
            
            // Reset re-recording state
            this.state.isReRecording = false;
            this.state.reRecordingName = null;
            this.state.reRecordingIndex = null;
            
            // Prepare results while still showing overlay
            this.displayResults();
            this.updateRecordingNameDisplay();
            
            // Transition to results with animation
            this.transitionToResults();
            
        } catch (error) {
            this.hideAnalyzingOverlay();
            this.resetRecordButton();
            this.elements.analyzeBtn.classList.remove('hidden');
            this.elements.audioPlayer.classList.remove('hidden');
            this.showError('Analysis failed: ' + error.message);
        } finally {
            this.state.isProcessing = false;
        }
    },
    
    /**
     * Show analyzing overlay with Shazam-style animation
     * @param {string} text - Loading message
     */
    showAnalyzingOverlay(text) {
        this.elements.loadingText.textContent = text;
        this.elements.analyzingOverlay.classList.remove('hidden', 'transitioning');
        // Trigger reflow for animation
        void this.elements.analyzingOverlay.offsetWidth;
        this.elements.analyzingOverlay.classList.add('visible');
    },
    
    /**
     * Hide analyzing overlay
     */
    hideAnalyzingOverlay() {
        this.elements.analyzingOverlay.classList.remove('visible');
        setTimeout(() => {
            this.elements.analyzingOverlay.classList.add('hidden');
            this.elements.analyzingOverlay.classList.remove('transitioning');
        }, 500);
    },
    
    /**
     * Transition from analyzing overlay to results view
     * @param {Function} callback - Optional callback after transition
     */
    transitionToResults(callback) {
        // Add transitioning class for shrinking circle animation
        this.elements.analyzingOverlay.classList.add('transitioning');
        
        // Switch view during the transition
        setTimeout(() => {
            this.switchView('results');
        }, 200);
        
        // Clean up overlay after animation
        setTimeout(() => {
            this.elements.analyzingOverlay.classList.remove('visible', 'transitioning');
            this.elements.analyzingOverlay.classList.add('hidden');
            this.resetRecordButton();
            
            // Execute callback if provided
            if (callback) callback();
        }, 800);
    },
    
    /**
     * Display analysis results
     */
    displayResults() {
        const { transcript, analysis } = this.state;
        
        // Update all result components
        this.elements.charismaGauge.innerHTML = Components.renderCharismaGauge(analysis.charisma_score);
        this.elements.annotatedText.innerHTML = Components.renderAnnotatedText(transcript, analysis.filler_words);
        this.elements.fillerWordsSummary.innerHTML = Components.renderFillerWordsSummary(analysis.filler_words);
        this.elements.vocabularySuggestions.innerHTML = Components.renderVocabularySuggestions(analysis.vocabulary_suggestions, analysis.charisma_score);
        this.elements.incoherenceMoments.innerHTML = Components.renderIncoherenceMoments(analysis.incoherence_moments, analysis.charisma_score);
        this.elements.strengthsList.innerHTML = Components.renderStrengths(analysis.strengths, analysis.charisma_score);
        this.elements.overallFeedback.innerHTML = Components.renderOverallFeedback(analysis.overall_feedback);
        this.elements.quickStats.innerHTML = Components.renderQuickStats(transcript, analysis.filler_words);
        this.elements.improvementTips.innerHTML = Components.renderImprovementTips(analysis.improvement_tips);
        
        // Show/hide audio section based on availability
        if (this.state.audioUrl) {
            this.elements.resultsAudioSection.classList.remove('hidden');
            this.elements.resultsAudioElement.src = this.state.audioUrl;
            
            // Reset custom player UI
            const resultsPlayer = AudioPlayerController.get('resultsCustomPlayer');
            if (resultsPlayer) {
                AudioPlayerController.reset(resultsPlayer);
            }
            
            // Fix duration display issue for blob/data URLs
            this.fixAudioDuration(this.elements.resultsAudioElement);
        } else {
            this.elements.resultsAudioSection.classList.add('hidden');
        }
        
        // Initialize expanders
        Components.initExpanders();
        
        // Switch to first tab
        this.switchTab('transcript');
    },
    
    /**
     * Switch to a tab
     * @param {string} tabId - Tab identifier
     */
    switchTab(tabId) {
        // Update tab buttons
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update tab panes
        this.elements.tabPanes.forEach(pane => {
            pane.classList.toggle('hidden', pane.id !== `tab-${tabId}`);
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });
    },
    
    /**
     * Re-record - go back to recording to replace the current recording
     * Keeps the same history entry and name
     */
    reRecord() {
        // Store the current recording info to update later
        this.state.isReRecording = true;
        this.state.reRecordingName = this.state.currentRecordingName;
        this.state.reRecordingIndex = this.state.currentHistoryIndex;
        
        // Clear audio but keep name/index context
        this.state.audioBlob = null;
        this.state.audioExtension = null;
        this.state.transcript = null;
        this.state.analysis = null;
        
        // Reset UI elements
        this.elements.audioPlayer.classList.add('hidden');
        this.elements.analyzeBtn.classList.add('hidden');
        this.elements.audioElement.src = '';
        this.resetRecordButton();
        
        this.switchView('initial');
        
        // Add entrance animation
        this.elements.initialView.classList.add('entering');
        setTimeout(() => {
            this.elements.initialView.classList.remove('entering');
        }, 600);
    },
    
    /**
     * New recording - start completely fresh
     */
    newRecording() {
        this.state.isReRecording = false;
        this.state.reRecordingName = null;
        this.state.reRecordingIndex = null;
        
        this.reset();
        this.switchView('initial');
        
        // Add entrance animation
        this.elements.initialView.classList.add('entering');
        setTimeout(() => {
            this.elements.initialView.classList.remove('entering');
        }, 600);
    },
    
    /**
     * Go to home/recording screen (triggered by logo click)
     */
    goHome() {
        // Don't navigate if currently recording or processing
        if (this.state.isRecording || this.state.isProcessing) {
            return;
        }
        
        // If already on initial view, do nothing
        if (this.state.currentView === 'initial') {
            return;
        }
        
        // Reset re-recording state
        this.state.isReRecording = false;
        this.state.reRecordingName = null;
        this.state.reRecordingIndex = null;
        
        this.reset();
        this.switchView('initial');
        
        // Add entrance animation
        this.elements.initialView.classList.add('entering');
        setTimeout(() => {
            this.elements.initialView.classList.remove('entering');
        }, 600);
    },
    
    /**
     * Reset application to initial state
     */
    reset() {
        // Revoke any existing audio URL to free memory
        if (this.state.audioUrl) {
            URL.revokeObjectURL(this.state.audioUrl);
        }
        
        // Clear state
        this.state.audioBlob = null;
        this.state.audioExtension = null;
        this.state.audioUrl = null;
        this.state.transcript = null;
        this.state.analysis = null;
        this.state.currentRecordingName = null;
        this.state.currentHistoryIndex = null;
        
        // Reset UI
        this.elements.audioPlayer.classList.add('hidden');
        this.elements.analyzeBtn.classList.add('hidden');
        this.elements.resultsAudioSection.classList.add('hidden');
        this.resetRecordButton();
        
        // Clear audio elements
        this.elements.audioElement.src = '';
        this.elements.resultsAudioElement.src = '';
        
        // Reset all custom audio players
        const initialPlayer = AudioPlayerController.get('initialCustomPlayer');
        if (initialPlayer) {
            AudioPlayerController.reset(initialPlayer);
        }
        const resultsPlayer = AudioPlayerController.get('resultsCustomPlayer');
        if (resultsPlayer) {
            AudioPlayerController.reset(resultsPlayer);
        }
    },
    
    /**
     * Update loading text
     * @param {string} text - New loading message
     */
    setLoadingText(text) {
        this.elements.loadingText.textContent = text;
    },
    
    /**
     * Edit the recording name (for existing recordings)
     */
    editRecordingName() {
        if (this.state.isEditingName) {
            // Save the name
            this.saveRecordingName();
        } else {
            // Start editing
            this.startEditingName();
        }
    },
    
    /**
     * Start inline editing of the recording name
     */
    startEditingName() {
        this.state.isEditingName = true;
        
        const currentName = this.state.currentRecordingName || 'Recording';
        
        // Hide the h1, show the input
        this.elements.recordingName.classList.add('hidden');
        this.elements.recordingNameInput.classList.remove('hidden');
        this.elements.recordingNameInput.value = currentName;
        
        // Update button to show checkmark
        this.elements.editNameBtn.textContent = '✓';
        this.elements.editNameBtn.classList.add('editing');
        this.elements.editNameBtn.title = 'Save name';
        
        // Focus and select all text
        this.elements.recordingNameInput.focus();
        this.elements.recordingNameInput.select();
        
        // Handle Enter and Escape keys
        this.elements.recordingNameInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveRecordingName();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditingName();
            }
        };
        
        // Handle clicking outside
        this.nameEditClickHandler = (e) => {
            if (!this.elements.recordingNameInput.contains(e.target) && 
                !this.elements.editNameBtn.contains(e.target)) {
                this.saveRecordingName();
            }
        };
        
        // Add click listener with a slight delay to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', this.nameEditClickHandler);
        }, 100);
    },
    
    /**
     * Save the recording name from inline edit
     */
    saveRecordingName() {
        const newName = this.elements.recordingNameInput.value.trim();
        
        if (newName !== '') {
            this.state.currentRecordingName = newName;
            
            // Update in history if viewing a history item
            if (this.state.currentHistoryIndex !== null) {
                this.state.history[this.state.currentHistoryIndex].name = newName;
                this.saveHistory();
            }
        }
        
        this.finishEditingName();
    },
    
    /**
     * Cancel editing and restore original name
     */
    cancelEditingName() {
        this.finishEditingName();
    },
    
    /**
     * Finish editing mode and update display
     */
    finishEditingName() {
        this.state.isEditingName = false;
        
        // Remove click listener
        document.removeEventListener('click', this.nameEditClickHandler);
        this.elements.recordingNameInput.onkeydown = null;
        
        // Show the h1, hide the input
        this.elements.recordingName.classList.remove('hidden');
        this.elements.recordingNameInput.classList.add('hidden');
        
        // Restore button
        this.elements.editNameBtn.textContent = '✏️';
        this.elements.editNameBtn.classList.remove('editing');
        this.elements.editNameBtn.title = 'Edit name';
        
        // Update display
        this.updateRecordingNameDisplay();
    },
    
    /**
     * Update the recording name display in results view
     */
    updateRecordingNameDisplay() {
        this.elements.recordingName.textContent = this.state.currentRecordingName || 'Your Results';
    },
    
    /**
     * Show delete confirmation modal
     * @param {number} index - Optional history index (if deleting from history page)
     */
    showDeleteConfirmation(index = null) {
        // If index is provided, use it; otherwise use current history index
        this.state.pendingDeleteIndex = index !== null ? index : this.state.currentHistoryIndex;
        this.elements.deleteModal.classList.remove('hidden');
    },
    
    /**
     * Hide delete confirmation modal
     */
    hideDeleteModal() {
        this.elements.deleteModal.classList.add('hidden');
        this.state.pendingDeleteIndex = null;
    },
    
    /**
     * Confirm and execute deletion
     */
    confirmDelete() {
        const index = this.state.pendingDeleteIndex;
        
        if (index !== null && index >= 0 && index < this.state.history.length) {
            // Remove from history
            this.state.history.splice(index, 1);
            this.saveHistory();
            
            // Update current history index if needed
            if (this.state.currentHistoryIndex !== null) {
                if (index === this.state.currentHistoryIndex) {
                    // Deleted the currently viewed item
                    this.state.currentHistoryIndex = null;
                } else if (index < this.state.currentHistoryIndex) {
                    // Deleted an item before the current one, adjust index
                    this.state.currentHistoryIndex--;
                }
            }
            
            // Re-render history if on history page
            if (this.state.currentView === 'history') {
                this.renderHistory();
            }
            
            // If we deleted from results view, go back to initial
            if (this.state.currentView === 'results' && index === this.state.pendingDeleteIndex) {
                this.hideDeleteModal();
                this.reset();
                this.switchView('initial');
                return;
            }
        }
        
        this.hideDeleteModal();
    },
    
    /**
     * Delete a recording from history by index (called from history page)
     * @param {number} index - History item index
     */
    deleteFromHistory(index) {
        this.showDeleteConfirmation(index);
    },
    
    /**
     * Download the recorded audio
     */
    downloadAudio() {
        if (!this.state.audioBlob || !this.state.audioUrl) {
            this.showError('No audio available to download');
            return;
        }
        
        // Create a download link
        const a = document.createElement('a');
        a.href = this.state.audioUrl;
        
        // Generate filename from recording name or timestamp
        const baseName = this.state.currentRecordingName 
            ? this.state.currentRecordingName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            : `recording_${Date.now()}`;
        const extension = this.state.audioExtension || 'webm';
        a.download = `${baseName}.${extension}`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    
    /**
     * Export analysis results as a text file
     */
    exportResults() {
        if (!this.state.transcript || !this.state.analysis) {
            this.showError('No results to export');
            return;
        }
        
        const { transcript, analysis } = this.state;
        const name = this.state.currentRecordingName || 'Speech Analysis';
        const date = new Date().toLocaleString();
        
        // Build the report content
        let report = '';
        
        // Header
        report += '═'.repeat(60) + '\n';
        report += '                    SPEECH ANALYSIS REPORT\n';
        report += '═'.repeat(60) + '\n\n';
        report += `Recording: ${name}\n`;
        report += `Date: ${date}\n`;
        report += '\n' + '─'.repeat(60) + '\n\n';
        
        // Charisma Score
        report += '🎯 CHARISMA SCORE\n';
        report += '─'.repeat(30) + '\n';
        report += `Score: ${analysis.charisma_score}/100\n`;
        report += this.getScoreLabel(analysis.charisma_score) + '\n';
        report += '\n';
        
        // Quick Stats
        const wordCount = transcript.split(/\s+/).length;
        const fillerCount = analysis.filler_words 
            ? analysis.filler_words.reduce((sum, fw) => sum + (fw.count || 0), 0) 
            : 0;
        const fillerRatio = wordCount > 0 
            ? ((fillerCount / wordCount) * 100).toFixed(1) 
            : 0;
        
        report += '📊 QUICK STATS\n';
        report += '─'.repeat(30) + '\n';
        report += `Total Words: ${wordCount}\n`;
        report += `Filler Words: ${fillerCount}\n`;
        report += `Filler Ratio: ${fillerRatio}%\n`;
        report += '\n';
        
        // Transcript
        report += '📝 TRANSCRIPT\n';
        report += '─'.repeat(30) + '\n';
        report += transcript + '\n';
        report += '\n';
        
        // Filler Words
        report += '🚫 FILLER WORDS\n';
        report += '─'.repeat(30) + '\n';
        if (analysis.filler_words && analysis.filler_words.length > 0) {
            analysis.filler_words.forEach(fw => {
                report += `• "${fw.word}" - ${fw.count}x\n`;
            });
        } else {
            report += 'Excellent! No filler words detected.\n';
        }
        report += '\n';
        
        // Vocabulary Suggestions
        report += '📚 VOCABULARY SUGGESTIONS\n';
        report += '─'.repeat(30) + '\n';
        if (analysis.vocabulary_suggestions && analysis.vocabulary_suggestions.length > 0) {
            analysis.vocabulary_suggestions.forEach((s, i) => {
                report += `${i + 1}. "${s.original}" → "${s.suggestion}"\n`;
                if (s.context) {
                    report += `   Context: ${s.context}\n`;
                }
            });
        } else {
            // Context-aware message based on score
            if (analysis.charisma_score < 20) {
                report += 'The speech lacks meaningful vocabulary. Focus on preparing actual content.\n';
            } else {
                report += 'The vocabulary used is appropriate!\n';
            }
        }
        report += '\n';
        
        // Incoherence Moments
        report += '⚠️ INCOHERENCE MOMENTS\n';
        report += '─'.repeat(30) + '\n';
        if (analysis.incoherence_moments && analysis.incoherence_moments.length > 0) {
            analysis.incoherence_moments.forEach((m, i) => {
                report += `${i + 1}. Issue: ${m.issue || 'Issue detected'}\n`;
                if (m.text) {
                    report += `   Text: "${m.text}"\n`;
                }
                if (m.suggestion) {
                    report += `   Suggestion: ${m.suggestion}\n`;
                }
            });
        } else {
            // Context-aware message based on score
            if (analysis.charisma_score < 20) {
                report += 'The speech lacks coherent content to analyze.\n';
            } else {
                report += 'The speech is coherent!\n';
            }
        }
        report += '\n';
        
        // Strengths
        report += '💪 STRENGTHS\n';
        report += '─'.repeat(30) + '\n';
        if (analysis.strengths && analysis.strengths.length > 0) {
            analysis.strengths.forEach(s => {
                report += `✓ ${s}\n`;
            });
        } else {
            report += 'Keep practicing to develop your strengths!\n';
        }
        report += '\n';
        
        // Overall Feedback
        report += '📋 OVERALL FEEDBACK\n';
        report += '─'.repeat(30) + '\n';
        report += analysis.overall_feedback || 'No feedback available.\n';
        report += '\n\n';
        
        // Improvement Tips
        report += '🎯 ACTION PLAN - HOW TO IMPROVE\n';
        report += '─'.repeat(30) + '\n';
        if (analysis.improvement_tips && analysis.improvement_tips.length > 0) {
            analysis.improvement_tips.forEach((tip, i) => {
                report += `${i + 1}. ${tip}\n`;
            });
        } else {
            report += 'Great job! Keep practicing.\n';
        }
        report += '\n';
        
        // Footer
        report += '═'.repeat(60) + '\n';
        report += '           Generated by Speech Analyzer\n';
        report += '═'.repeat(60) + '\n';
        
        // Download the file
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `speech_analysis_${safeName}_${dateStr}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Get score label based on charisma score
     * @param {number} score - Charisma score
     * @returns {string} Label text
     */
    getScoreLabel(score) {
        if (score >= 90) return '🏆 Outstanding!';
        if (score >= 70) return '💪 Great job!';
        if (score >= 50) return '👍 Keep practicing';
        if (score >= 30) return '😕 Needs work';
        if (score >= 15) return '😟 Needs serious improvement';
        return '😰 Critical - practice required';
    },
    
    /**
     * Open upload modal
     */
    openUploadModal() {
        this.elements.uploadModal.classList.remove('hidden');
    },
    
    /**
     * Close upload modal and reset state
     */
    closeUploadModal() {
        this.elements.uploadModal.classList.add('hidden');
        this.removeUploadedFile();
    },
    
    /**
     * Handle file selection from input
     * @param {Event} e - Change event
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processSelectedFile(file);
        }
    },
    
    /**
     * Handle dropped file
     * @param {File} file - Dropped file
     */
    handleDroppedFile(file) {
        // Check if it's an audio file by MIME type or extension
        const validExtensions = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'mp4', 'webm', 'weba', 'flac', 'aac', 'opus'];
        const fileExtension = this.getFileExtension(file.name).toLowerCase();
        const isAudio = file.type.startsWith('audio/') || 
                       file.type.startsWith('video/webm') || 
                       validExtensions.includes(fileExtension);
        
        if (!isAudio) {
            this.showError('Please select an audio file');
            return;
        }
        this.processSelectedFile(file);
    },
    
    /**
     * Process selected audio file
     * @param {File} file - Audio file
     */
    processSelectedFile(file) {
        // Validate file type by MIME type or extension
        const validExtensions = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'mp4', 'webm', 'weba', 'flac', 'aac', 'opus'];
        const fileExtension = this.getFileExtension(file.name).toLowerCase();
        
        const isValidByMime = file.type.startsWith('audio/') || file.type.startsWith('video/webm');
        const isValidByExtension = validExtensions.includes(fileExtension);
        
        if (!isValidByMime && !isValidByExtension) {
            this.showError('Unsupported audio format. Please use MP3, WAV, OGG, M4A, WEBM, or FLAC.');
            return;
        }
        
        // Validate file size (max 25MB for OpenAI Whisper)
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File is too large. Maximum size is 25MB.');
            return;
        }
        
        // Store file
        this.state.uploadedFile = file;
        
        // Revoke previous URL if exists
        if (this.state.uploadedFileUrl) {
            URL.revokeObjectURL(this.state.uploadedFileUrl);
        }
        
        // Create object URL for preview
        this.state.uploadedFileUrl = URL.createObjectURL(file);
        
        // Update UI
        this.elements.uploadFileName.textContent = file.name;
        this.elements.uploadFileSize.textContent = this.formatFileSize(file.size);
        this.elements.uploadAudioElement.src = this.state.uploadedFileUrl;
        
        // Reset custom player UI
        const uploadPlayer = AudioPlayerController.get('uploadCustomPlayer');
        if (uploadPlayer) {
            AudioPlayerController.reset(uploadPlayer);
        }
        
        // Fix duration display
        this.fixAudioDuration(this.elements.uploadAudioElement);
        
        // Show preview, hide dropzone
        this.elements.uploadDropzone.classList.add('hidden');
        this.elements.uploadPreview.classList.remove('hidden');
        
        // Enable analyze button
        this.elements.analyzeUploadBtn.disabled = false;
    },
    
    /**
     * Format file size to human readable
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Remove uploaded file and reset
     */
    removeUploadedFile() {
        // Revoke URL
        if (this.state.uploadedFileUrl) {
            URL.revokeObjectURL(this.state.uploadedFileUrl);
            this.state.uploadedFileUrl = null;
        }
        
        this.state.uploadedFile = null;
        
        // Reset file input
        this.elements.audioFileInput.value = '';
        
        // Reset audio element
        this.elements.uploadAudioElement.src = '';
        
        // Reset custom player UI
        const uploadPlayer = AudioPlayerController.get('uploadCustomPlayer');
        if (uploadPlayer) {
            AudioPlayerController.reset(uploadPlayer);
        }
        
        // Hide preview, show dropzone
        this.elements.uploadPreview.classList.add('hidden');
        this.elements.uploadDropzone.classList.remove('hidden');
        
        // Disable analyze button
        this.elements.analyzeUploadBtn.disabled = true;
    },
    
    /**
     * Get file extension from filename
     * @param {string} filename - The filename
     * @returns {string} Extension without dot
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        if (parts.length > 1) {
            return parts.pop().toLowerCase();
        }
        return 'mp3'; // default fallback
    },
    
    /**
     * Analyze uploaded audio file
     */
    async analyzeUploadedFile() {
        if (!this.state.uploadedFile) {
            this.showError('No file selected');
            return;
        }
        
        const file = this.state.uploadedFile;
        const extension = this.getFileExtension(file.name);
        
        // Close modal
        this.elements.uploadModal.classList.add('hidden');
        
        // Set state
        this.state.isProcessing = true;
        this.state.audioBlob = file;
        this.state.audioExtension = extension;
        
        // Store audio URL for playback
        if (this.state.audioUrl) {
            URL.revokeObjectURL(this.state.audioUrl);
        }
        this.state.audioUrl = this.state.uploadedFileUrl;
        this.state.uploadedFileUrl = null; // Transfer ownership
        
        // Show analyzing overlay
        this.showAnalyzingOverlay('Transcribing audio...');
        
        try {
            // Step 1: Transcribe
            const { transcript } = await API.transcribe(file, extension);
            this.state.transcript = transcript;
            
            // Step 2: Analyze
            this.setLoadingText('Analyzing speech...');
            const analysis = await API.analyze(transcript);
            this.state.analysis = analysis;
            
            // Generate name from filename (without extension)
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            this.state.currentRecordingName = baseName;
            
            // Add to history
            await this.addToHistory();
            
            // Display results
            this.displayResults();
            this.updateRecordingNameDisplay();
            
            // Transition to results
            this.transitionToResults();
            
        } catch (error) {
            this.hideAnalyzingOverlay();
            this.showError('Analysis failed: ' + error.message);
        } finally {
            this.state.isProcessing = false;
            // Reset upload state
            this.state.uploadedFile = null;
            this.elements.audioFileInput.value = '';
            this.elements.uploadPreview.classList.add('hidden');
            this.elements.uploadDropzone.classList.remove('hidden');
            this.elements.analyzeUploadBtn.disabled = true;
        }
    },
    
    /**
     * Show info modal
     */
    showModal() {
        this.elements.infoModal.classList.remove('hidden');
    },
    
    /**
     * Hide info modal
     */
    hideModal() {
        this.elements.infoModal.classList.add('hidden');
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-message';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            z-index: 1100;
            animation: fadeIn 0.3s ease;
        `;
        toast.innerHTML = `❌ ${message}`;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
