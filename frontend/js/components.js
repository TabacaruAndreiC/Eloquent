/**
 * Components Module
 * =================
 * UI component rendering functions.
 * Each function returns HTML string for its component.
 */

const Components = {
    
    /**
     * Render charisma gauge with premium circular design
     * @param {number} score - Score from 1-100
     * @returns {string} HTML string
     */
    renderCharismaGauge(score) {
        let color, emoji, label;
        
        if (score >= 90) {
            color = '#00e676';
            emoji = '🏆';
            label = 'Outstanding!';
        } else if (score >= 70) {
            color = '#00c853';
            emoji = '💪';
            label = 'Great job!';
        } else if (score >= 50) {
            color = '#ff9800';
            emoji = '👍';
            label = 'Keep practicing';
        } else if (score >= 30) {
            color = '#ff6b6b';
            emoji = '😕';
            label = 'Needs work';
        } else if (score >= 15) {
            color = '#ff4444';
            emoji = '😟';
            label = 'Needs improvement';
        } else {
            color = '#ff1744';
            emoji = '😰';
            label = 'Critical - practice required';
        }
        
        // Calculate rotation for the progress ring (max 270 degrees for visual appeal)
        const rotation = Math.min((score / 100) * 270, 270);
        
        return `
            <div class="charisma-score-container" style="--score-color: ${color}">
                <div class="charisma-ring-glow"></div>
                <div class="charisma-ring charisma-ring-bg"></div>
                <svg class="charisma-ring-svg" viewBox="0 0 200 200" style="position: absolute; width: 100%; height: 100%; transform: rotate(-90deg);">
                    <circle 
                        cx="100" cy="100" r="90" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.08)" 
                        stroke-width="8"
                    />
                    <circle 
                        cx="100" cy="100" r="90" 
                        fill="none" 
                        stroke="${color}" 
                        stroke-width="8"
                        stroke-linecap="round"
                        stroke-dasharray="${(score / 100) * 565.48} 565.48"
                        style="filter: drop-shadow(0 0 10px ${color}); transition: stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1);"
                    />
                </svg>
                <h2 class="charisma-score" style="color: ${color}">${score}</h2>
                <p class="charisma-max">/ 100</p>
            </div>
            <p class="charisma-label" style="--score-color: ${color}">
                <span class="charisma-label-emoji">${emoji}</span>
                <span class="charisma-label-text">${label}</span>
            </p>
            <p class="charisma-subtitle">Charisma Score</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${score}%"></div>
            </div>
        `;
    },
    
    /**
     * Render annotated text with filler words highlighted
     * @param {string} transcript - Original text
     * @param {Array} fillerWords - Array of filler word objects
     * @returns {string} HTML string
     */
    renderAnnotatedText(transcript, fillerWords) {
        if (!transcript) {
            return '<p class="text-muted">No text to display.</p>';
        }
        
        const fillers = new Set(fillerWords.map(fw => fw.word.toLowerCase()));
        const words = transcript.split(' ');
        
        const annotated = words.map(word => {
            const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()-]/g, '');
            
            if (fillers.has(cleanWord)) {
                return `<span class="filler-word">${word}</span>`;
            }
            return word;
        });
        
        return annotated.join(' ');
    },
    
    /**
     * Render filler words summary
     * @param {Array} fillerWords - Array of filler word objects
     * @returns {string} HTML string
     */
    renderFillerWordsSummary(fillerWords) {
        if (!fillerWords || fillerWords.length === 0) {
            return '<div class="success-message">🎉 Excellent! No filler words detected!</div>';
        }
        
        const cards = fillerWords.map(fw => `
            <div class="filler-card">
                <div class="filler-word-label">"${fw.word}"</div>
                <div class="filler-count">${fw.count}x</div>
            </div>
        `).join('');
        
        const total = fillerWords.reduce((sum, fw) => sum + (fw.count || 0), 0);
        
        return `
            <h3 class="filler-summary-title">🚫 Filler Words Detected</h3>
            <div class="filler-grid">${cards}</div>
            <p class="filler-total">Total filler words: <strong>${total}</strong></p>
        `;
    },
    
    /**
     * Render vocabulary suggestions
     * @param {Array} suggestions - Array of suggestion objects
     * @param {number} score - Charisma score for context-aware messaging
     * @returns {string} HTML string
     */
    renderVocabularySuggestions(suggestions, score = 100) {
        if (!suggestions || suggestions.length === 0) {
            // If score is very low, the "appropriate vocabulary" message is misleading
            if (score < 20) {
                return '<div class="warning-message">⚠️ The speech lacks meaningful vocabulary. Focus on preparing actual content before speaking.</div>';
            }
            return '<div class="info-message">✅ The vocabulary used is appropriate!</div>';
        }
        
        const items = suggestions.map((s, i) => `
            <div class="expander" data-expander>
                <div class="expander-header">
                    <span>Suggestion ${i + 1}: <strong>${s.original}</strong> → <strong>${s.suggestion}</strong></span>
                    <span class="expander-icon">▼</span>
                </div>
                <div class="expander-content">
                    <p><strong>Context:</strong> ${s.context || 'Not specified'}</p>
                </div>
            </div>
        `).join('');
        
        return `
            <h3>📚 Vocabulary Suggestions</h3>
            ${items}
        `;
    },
    
    /**
     * Render incoherence moments
     * @param {Array} moments - Array of incoherence objects
     * @param {number} score - Charisma score for context-aware messaging
     * @returns {string} HTML string
     */
    renderIncoherenceMoments(moments, score = 100) {
        if (!moments || moments.length === 0) {
            // If score is very low, the "coherent" message is misleading
            if (score < 20) {
                return '<div class="warning-message">⚠️ The speech lacks coherent content to analyze. Focus on delivering actual messages.</div>';
            }
            return '<div class="success-message">✅ The speech is coherent!</div>';
        }
        
        const items = moments.map((m, i) => `
            <div class="expander" data-expander>
                <div class="expander-header">
                    <span>Issue ${i + 1}: ${m.issue || 'Issue detected'}</span>
                    <span class="expander-icon">▼</span>
                </div>
                <div class="expander-content">
                    <p><strong>Original text:</strong> <em>${m.text || 'N/A'}</em></p>
                    <p><strong>Suggestion:</strong> ${m.suggestion || 'Not specified'}</p>
                </div>
            </div>
        `).join('');
        
        return `
            <h3>⚠️ Incoherence Moments</h3>
            ${items}
        `;
    },
    
    /**
     * Render strengths list
     * @param {Array} strengths - Array of strength strings
     * @param {number} score - Charisma score for context-aware messaging
     * @returns {string} HTML string
     */
    renderStrengths(strengths, score = 100) {
        if (!strengths || strengths.length === 0) {
            // More direct message for very low scores
            if (score < 20) {
                return '<div class="warning-message">⚠️ No strengths identified. Focus on preparing and practicing your speech with actual content.</div>';
            }
            return '<div class="info-message">Keep practicing to develop your strengths!</div>';
        }
        
        const items = strengths.map(s => `
            <div class="strength-item">
                <span class="strength-icon">✅</span>
                <span>${s}</span>
            </div>
        `).join('');
        
        return `
            <h3 class="strengths-title">💪 Strengths</h3>
            ${items}
        `;
    },
    
    /**
     * Render overall feedback
     * @param {string} feedback - Feedback text
     * @returns {string} HTML string
     */
    renderOverallFeedback(feedback) {
        return `
            <h3>📝 Overall Feedback</h3>
            <div class="feedback-box">
                <p>${feedback}</p>
            </div>
        `;
    },
    
    /**
     * Render quick stats
     * @param {string} transcript - Original transcript
     * @param {Array} fillerWords - Filler words array
     * @returns {string} HTML string
     */
    renderQuickStats(transcript, fillerWords) {
        const wordCount = transcript ? transcript.split(/\s+/).length : 0;
        const fillerCount = fillerWords 
            ? fillerWords.reduce((sum, fw) => sum + (fw.count || 0), 0) 
            : 0;
        const fillerRatio = wordCount > 0 
            ? ((fillerCount / wordCount) * 100).toFixed(1) 
            : 0;
        
        return `
            <h3>📊 Quick Stats</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Words</div>
                    <div class="stat-value">${wordCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Filler Words</div>
                    <div class="stat-value">${fillerCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Filler Ratio</div>
                    <div class="stat-value">${fillerRatio}%</div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render improvement tips
     * @param {Array} tips - Array of tip strings
     * @returns {string} HTML string
     */
    renderImprovementTips(tips) {
        if (!tips || tips.length === 0) {
            return '';
        }
        
        const items = tips.map((tip, i) => `
            <div class="tip-item">
                <span class="tip-number">${i + 1}.</span> ${tip}
            </div>
        `).join('');
        
        return `
            <h3 class="tips-title">🎯 Action Plan - How to Improve</h3>
            <div class="tips-warning">
                <p>⚠️ Focus on these areas to improve your speaking:</p>
            </div>
            ${items}
        `;
    },
    
    /**
     * Initialize expander click handlers
     * Call this after rendering components with expanders
     */
    initExpanders() {
        document.querySelectorAll('[data-expander]').forEach(expander => {
            const header = expander.querySelector('.expander-header');
            if (header && !header.hasAttribute('data-initialized')) {
                header.setAttribute('data-initialized', 'true');
                header.addEventListener('click', () => {
                    expander.classList.toggle('open');
                });
            }
        });
    }
};

/**
 * Custom Audio Player Controller
 * ==============================
 * Handles custom audio player UI and interactions.
 */
const AudioPlayerController = {
    players: new Map(),
    
    /**
     * Initialize a custom audio player
     * @param {string} playerId - The ID of the player container
     * @param {HTMLAudioElement} audioElement - The audio element
     */
    init(playerId, audioElement) {
        const container = document.getElementById(playerId);
        if (!container || !audioElement) return;
        
        // Avoid double initialization
        if (this.players.has(playerId)) {
            this.cleanup(playerId);
        }
        
        const player = {
            container,
            audio: audioElement,
            playBtn: container.querySelector('.audio-play-btn'),
            playIcon: container.querySelector('.play-icon'),
            pauseIcon: container.querySelector('.pause-icon'),
            currentTimeEl: container.querySelector('.audio-current-time'),
            durationEl: container.querySelector('.audio-duration'),
            progressContainer: container.querySelector('.audio-progress-container'),
            progressBar: container.querySelector('.audio-progress-bar'),
            progressFilled: container.querySelector('.audio-progress-filled'),
            progressHandle: container.querySelector('.audio-progress-handle'),
            volumeBtn: container.querySelector('.audio-volume-btn'),
            volumeIcon: container.querySelector('.volume-icon'),
            volumeMuteIcon: container.querySelector('.volume-mute-icon'),
            volumeSlider: container.querySelector('.audio-volume-slider'),
            volumeBar: container.querySelector('.audio-volume-bar'),
            volumeFilled: container.querySelector('.audio-volume-filled'),
            volumeHandle: container.querySelector('.audio-volume-handle'),
            isSeeking: false,
            isVolumeAdjusting: false,
            previousVolume: 1
        };
        
        this.players.set(playerId, player);
        this.bindEvents(player);
        this.updateVolumeUI(player);
        
        return player;
    },
    
    /**
     * Bind events for the player
     * @param {Object} player - Player object
     */
    bindEvents(player) {
        const { audio, container } = player;
        
        // Play/Pause button
        player.playBtn.addEventListener('click', () => this.togglePlay(player));
        
        // Audio events
        audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata(player));
        audio.addEventListener('timeupdate', () => this.onTimeUpdate(player));
        audio.addEventListener('ended', () => this.onEnded(player));
        audio.addEventListener('play', () => this.onPlay(player));
        audio.addEventListener('pause', () => this.onPause(player));
        audio.addEventListener('durationchange', () => this.onDurationChange(player));
        
        // Progress bar seeking
        player.progressContainer.addEventListener('mousedown', (e) => this.startSeeking(e, player));
        player.progressContainer.addEventListener('touchstart', (e) => this.startSeeking(e, player), { passive: false });
        
        // Volume controls
        if (player.volumeBtn) {
            player.volumeBtn.addEventListener('click', () => this.toggleMute(player));
            player.volumeBtn.addEventListener('mouseenter', () => this.showVolumeSlider(player));
        }
        
        if (player.volumeSlider) {
            container.addEventListener('mouseleave', () => this.hideVolumeSlider(player));
            
            if (player.volumeBar) {
                player.volumeBar.addEventListener('mousedown', (e) => this.startVolumeAdjust(e, player));
                player.volumeBar.addEventListener('touchstart', (e) => this.startVolumeAdjust(e, player), { passive: false });
            }
        }
        
        // Global events for seeking
        document.addEventListener('mousemove', (e) => this.onMouseMove(e, player));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e, player));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e, player), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e, player));
    },
    
    /**
     * Toggle play/pause
     * @param {Object} player - Player object
     */
    togglePlay(player) {
        if (player.audio.paused) {
            // Pause all other players first
            this.pauseAll(player);
            player.audio.play().catch(e => console.error('Play error:', e));
        } else {
            player.audio.pause();
        }
    },
    
    /**
     * Pause all players except the specified one
     * @param {Object} exceptPlayer - Player to exclude
     */
    pauseAll(exceptPlayer = null) {
        this.players.forEach((player) => {
            if (player !== exceptPlayer && !player.audio.paused) {
                player.audio.pause();
            }
        });
    },
    
    /**
     * Handle loaded metadata
     * @param {Object} player - Player object
     */
    onLoadedMetadata(player) {
        this.updateDuration(player);
    },
    
    /**
     * Handle duration change (for blob URLs)
     * @param {Object} player - Player object
     */
    onDurationChange(player) {
        this.updateDuration(player);
    },
    
    /**
     * Update duration display
     * @param {Object} player - Player object
     */
    updateDuration(player) {
        const duration = player.audio.duration;
        if (isFinite(duration) && !isNaN(duration)) {
            player.durationEl.textContent = this.formatTime(duration);
        }
    },
    
    /**
     * Handle time update
     * @param {Object} player - Player object
     */
    onTimeUpdate(player) {
        if (player.isSeeking) return;
        
        const { audio } = player;
        const progress = (audio.currentTime / audio.duration) * 100 || 0;
        
        player.progressFilled.style.width = `${progress}%`;
        player.progressHandle.style.left = `${progress}%`;
        player.currentTimeEl.textContent = this.formatTime(audio.currentTime);
    },
    
    /**
     * Handle play event
     * @param {Object} player - Player object
     */
    onPlay(player) {
        player.playIcon.classList.add('hidden');
        player.pauseIcon.classList.remove('hidden');
    },
    
    /**
     * Handle pause event
     * @param {Object} player - Player object
     */
    onPause(player) {
        player.playIcon.classList.remove('hidden');
        player.pauseIcon.classList.add('hidden');
    },
    
    /**
     * Handle ended event
     * @param {Object} player - Player object
     */
    onEnded(player) {
        player.playIcon.classList.remove('hidden');
        player.pauseIcon.classList.add('hidden');
        player.progressFilled.style.width = '0%';
        player.progressHandle.style.left = '0%';
        player.currentTimeEl.textContent = this.formatTime(0);
    },
    
    /**
     * Start seeking
     * @param {Event} e - Mouse/Touch event
     * @param {Object} player - Player object
     */
    startSeeking(e, player) {
        e.preventDefault();
        player.isSeeking = true;
        player.container.classList.add('seeking');
        this.seek(e, player);
    },
    
    /**
     * Handle mouse move (for seeking)
     * @param {Event} e - Mouse event
     * @param {Object} player - Player object
     */
    onMouseMove(e, player) {
        if (player.isSeeking) {
            this.seek(e, player);
        }
        if (player.isVolumeAdjusting) {
            this.adjustVolume(e, player);
        }
    },
    
    /**
     * Handle touch move (for seeking)
     * @param {Event} e - Touch event
     * @param {Object} player - Player object
     */
    onTouchMove(e, player) {
        if (player.isSeeking) {
            e.preventDefault();
            this.seek(e, player);
        }
        if (player.isVolumeAdjusting) {
            e.preventDefault();
            this.adjustVolume(e, player);
        }
    },
    
    /**
     * Handle mouse up (stop seeking)
     * @param {Event} e - Mouse event
     * @param {Object} player - Player object
     */
    onMouseUp(e, player) {
        if (player.isSeeking) {
            player.isSeeking = false;
            player.container.classList.remove('seeking');
        }
        if (player.isVolumeAdjusting) {
            player.isVolumeAdjusting = false;
        }
    },
    
    /**
     * Handle touch end (stop seeking)
     * @param {Event} e - Touch event
     * @param {Object} player - Player object
     */
    onTouchEnd(e, player) {
        if (player.isSeeking) {
            player.isSeeking = false;
            player.container.classList.remove('seeking');
        }
        if (player.isVolumeAdjusting) {
            player.isVolumeAdjusting = false;
        }
    },
    
    /**
     * Seek to position
     * @param {Event} e - Mouse/Touch event
     * @param {Object} player - Player object
     */
    seek(e, player) {
        const rect = player.progressBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = offsetX / rect.width;
        const duration = player.audio.duration;
        
        if (isFinite(duration) && !isNaN(duration)) {
            player.audio.currentTime = percent * duration;
            player.progressFilled.style.width = `${percent * 100}%`;
            player.progressHandle.style.left = `${percent * 100}%`;
            player.currentTimeEl.textContent = this.formatTime(player.audio.currentTime);
        }
    },
    
    /**
     * Toggle mute
     * @param {Object} player - Player object
     */
    toggleMute(player) {
        if (player.audio.muted || player.audio.volume === 0) {
            player.audio.muted = false;
            player.audio.volume = player.previousVolume || 1;
        } else {
            player.previousVolume = player.audio.volume;
            player.audio.muted = true;
        }
        this.updateVolumeUI(player);
    },
    
    /**
     * Show volume slider
     * @param {Object} player - Player object
     */
    showVolumeSlider(player) {
        if (player.volumeSlider) {
            player.volumeSlider.classList.remove('hidden');
        }
    },
    
    /**
     * Hide volume slider
     * @param {Object} player - Player object
     */
    hideVolumeSlider(player) {
        if (player.volumeSlider && !player.isVolumeAdjusting) {
            player.volumeSlider.classList.add('hidden');
        }
    },
    
    /**
     * Start volume adjustment
     * @param {Event} e - Mouse/Touch event
     * @param {Object} player - Player object
     */
    startVolumeAdjust(e, player) {
        e.preventDefault();
        player.isVolumeAdjusting = true;
        this.adjustVolume(e, player);
    },
    
    /**
     * Adjust volume
     * @param {Event} e - Mouse/Touch event
     * @param {Object} player - Player object
     */
    adjustVolume(e, player) {
        if (!player.volumeBar) return;
        
        const rect = player.volumeBar.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const offsetY = Math.max(0, Math.min(rect.bottom - clientY, rect.height));
        const percent = offsetY / rect.height;
        
        player.audio.volume = percent;
        player.audio.muted = false;
        this.updateVolumeUI(player);
    },
    
    /**
     * Update volume UI
     * @param {Object} player - Player object
     */
    updateVolumeUI(player) {
        const volume = player.audio.muted ? 0 : player.audio.volume;
        
        // Update volume filled bar
        if (player.volumeFilled) {
            player.volumeFilled.style.height = `${volume * 100}%`;
        }
        
        // Update volume handle
        if (player.volumeHandle) {
            player.volumeHandle.style.bottom = `${volume * 100}%`;
        }
        
        // Update icon
        if (player.volumeIcon && player.volumeMuteIcon) {
            if (volume === 0) {
                player.volumeIcon.classList.add('hidden');
                player.volumeMuteIcon.classList.remove('hidden');
            } else {
                player.volumeIcon.classList.remove('hidden');
                player.volumeMuteIcon.classList.add('hidden');
            }
        }
    },
    
    /**
     * Format time in MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Reset player UI to initial state
     * @param {Object} player - Player object
     */
    reset(player) {
        player.playIcon.classList.remove('hidden');
        player.pauseIcon.classList.add('hidden');
        player.progressFilled.style.width = '0%';
        player.progressHandle.style.left = '0%';
        player.currentTimeEl.textContent = '0:00';
        player.durationEl.textContent = '0:00';
    },
    
    /**
     * Cleanup player
     * @param {string} playerId - Player ID
     */
    cleanup(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.audio.pause();
            this.reset(player);
            this.players.delete(playerId);
        }
    },
    
    /**
     * Get player by ID
     * @param {string} playerId - Player ID
     * @returns {Object|null} Player object or null
     */
    get(playerId) {
        return this.players.get(playerId) || null;
    }
};
