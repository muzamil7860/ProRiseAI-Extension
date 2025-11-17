// AI Post Creator Pro - Complete with All Premium Features
// Positioned INSIDE LinkedIn post box

class AIPostCreator {
    constructor(settings) {
        this.settings = settings;
        this.attachedComposers = new WeakMap();
        this.activePanel = null;
        this.activeButton = null;
        this.currentVariations = [];
        this.currentHashtags = [];
        this.selectedVariationIndex = 0;
        this.favorites = [];
        this.savedPosts = [];
        this.loadFavorites();
        this.loadSavedPosts();
    }

    async loadFavorites() {
        try {
            const result = await chrome.storage.local.get(['postFavorites']);
            this.favorites = result.postFavorites || [];
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    async loadSavedPosts() {
        try {
            const result = await chrome.storage.local.get(['savedPosts']);
            this.savedPosts = result.savedPosts || [];
        } catch (error) {
            console.error('Error loading saved posts:', error);
        }
    }

    async saveFavorite(topic, detail, tone, industry, length) {
        const favorite = {
            id: Date.now(),
            topic,
            detail,
            tone,
            industry,
            length,
            date: new Date().toISOString()
        };
        
        this.favorites.unshift(favorite);
        if (this.favorites.length > 10) this.favorites = this.favorites.slice(0, 10);
        
        try {
            await chrome.storage.local.set({ postFavorites: this.favorites });
        } catch (error) {
            console.error('Error saving favorite:', error);
        }
    }

    async savePost(title, posts, hashtags, metadata) {
        const savedPost = {
            id: Date.now(),
            title,
            posts,
            hashtags,
            metadata,
            date: new Date().toISOString()
        };
        
        this.savedPosts.unshift(savedPost);
        if (this.savedPosts.length > 20) this.savedPosts = this.savedPosts.slice(0, 20);
        
        try {
            await chrome.storage.local.set({ savedPosts: this.savedPosts });
        } catch (error) {
            console.error('Error saving post:', error);
        }
    }

    async attachToComposer(composerElement) {
        if (this.attachedComposers.has(composerElement)) {
            return;
        }

        this.attachedComposers.set(composerElement, true);

        const aiButton = this.createAIButton();
        
        // Find the editor container - prioritize innermost container
        let editorContainer = composerElement.parentElement;
        
        // Try to find the direct parent of the contenteditable
        if (composerElement.classList.contains('ql-editor')) {
            editorContainer = composerElement.parentElement;
        } else if (composerElement.closest('.ql-editor')) {
            editorContainer = composerElement.closest('.ql-editor').parentElement;
        }
        
        if (editorContainer) {
            editorContainer.style.position = 'relative';
            editorContainer.appendChild(aiButton);
        }

        aiButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showPostCreatorPanel(composerElement, editorContainer, aiButton);
        });
    }

    createAIButton() {
        const button = document.createElement('button');
        button.className = 'ai-post-creator-btn';
        button.type = 'button';
        
        button.innerHTML = `
            <div class="ai-btn-glow-effect"></div>
            <div class="ai-btn-content">
                <div class="ai-btn-icon-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17C10.9,17 10,16.1 10,15C10,13.9 10.9,13 12,13C13.1,13 14,13.9 14,15C14,16.1 13.1,17 12,17M18,9C17.8,8.8 17.6,8.6 17.3,8.5C16.9,8.3 16.5,8.4 16.1,8.6C15.7,8.8 15.6,9.1 15.4,9.4C15.1,9.7 14.7,9.8 14.2,9.9C13.7,10 13.1,10.1 12.5,10.2C11.9,10.3 11.3,10.4 10.8,10.6C10.3,10.8 9.9,11.1 9.6,11.5C9.3,11.9 9.2,12.4 9.4,12.8C9.6,13.2 10,13.4 10.4,13.5C10.8,13.6 11.2,13.5 11.5,13.3C11.8,13.1 12,12.8 12.1,12.4C12.2,12 12.1,11.6 11.9,11.3C11.7,11 11.4,10.8 11,10.7C10.6,10.6 10.2,10.7 9.9,10.9C9.6,11.1 9.4,11.4 9.3,11.8L8.1,11.6C8.3,10.8 8.8,10.1 9.5,9.6C10.2,9.1 11.1,8.9 11.9,9C12.7,9.1 13.4,9.4 13.9,9.9C14.4,10.4 14.7,11 14.8,11.7C14.9,12.4 14.7,13.1 14.3,13.7C13.9,14.3 13.3,14.7 12.6,14.9C11.9,15.1 11.2,15 10.5,14.7C9.8,14.4 9.3,13.9 9,13.2C8.7,12.5 8.6,11.8 8.8,11.1C9,10.4 9.4,9.8 10,9.4C10.6,9 11.3,8.8 12,8.9C12.7,9 13.3,9.3 13.8,9.7C14.3,10.1 14.6,10.6 14.8,11.2L15.9,10.9C15.6,10 15.1,9.2 14.4,8.6C13.7,8 12.9,7.6 12,7.5C11.1,7.4 10.2,7.6 9.4,8C8.6,8.4 8,9 7.6,9.8C7.2,10.6 7.1,11.5 7.3,12.4C7.5,13.3 8,14.1 8.7,14.7C9.4,15.3 10.3,15.7 11.2,15.8C12.1,15.9 13,15.7 13.8,15.3C14.6,14.9 15.2,14.3 15.6,13.5C16,12.7 16.1,11.8 15.9,10.9C15.7,10 15.2,9.2 14.5,8.6C13.8,8 13,7.6 12.1,7.5Z"/>
                    </svg>
                </div>
                <span class="ai-btn-text">AI Assistant</span>
                <div class="ai-btn-badge">✨</div>
            </div>
            <div class="ai-btn-ripple"></div>
        `;
        
        button.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 
                0 4px 15px rgba(102, 126, 234, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 6px;
            overflow: hidden;
            position: relative;
            min-width: 120px;
            backdrop-filter: blur(10px);
        `;

        // Add enhanced styles for inner elements
        const styles = `
            <style>
                .ai-btn-glow-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
                    border-radius: 12px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .ai-btn-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                    z-index: 2;
                }
                
                .ai-btn-icon-wrapper {
                    width: 24px;
                    height: 24px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .ai-btn-text {
                    font-weight: 600;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                }
                
                .ai-btn-badge {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    animation: gentle-pulse 2s ease-in-out infinite;
                }
                
                .ai-btn-ripple {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: translate(-50%, -50%);
                    transition: width 0.3s ease, height 0.3s ease;
                }
                
                @keyframes gentle-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .ai-post-creator-btn:hover .ai-btn-glow-effect {
                    opacity: 1;
                }
                
                .ai-post-creator-btn:hover .ai-btn-ripple {
                    width: 100%;
                    height: 100%;
                }
                
                .ai-post-creator-btn:active {
                    transform: scale(0.98);
                }
            </style>
        `;
        
        if (!document.querySelector('#ai-btn-enhanced-styles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'ai-btn-enhanced-styles';
            styleEl.innerHTML = styles;
            document.head.appendChild(styleEl);
        }

        // Enhanced hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.05)';
            button.style.boxShadow = `
                0 15px 40px rgba(102, 126, 234, 0.6),
                0 0 0 3px rgba(255, 255, 255, 0.3),
                0 0 20px rgba(102, 126, 234, 0.4)
            `;
            button.style.background = 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = `
                0 4px 15px rgba(102, 126, 234, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1)
            `;
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        });

        return button;
    }

    showPostCreatorPanel(composerElement, parentContainer, aiButton) {
        // Close any existing panel first (this will restore its button)
        if (this.activePanel) {
            this.closePanel(this.activeButton);
        }

        // Hide AI button when panel opens
        if (aiButton) {
            aiButton.style.display = 'none';
            this.activeButton = aiButton;
        }

        this.activePanel = this.createPostCreatorPanel(composerElement);

        // Append panel to body so it sits outside LinkedIn composer
        document.body.appendChild(this.activePanel);
        this.activePanel.style.position = 'absolute';
        this.activePanel.style.zIndex = '10000';

        // Positioning helper - right-aligned next to composer if space, otherwise align to composer's right edge
        const positionPanel = () => {
            try {
                // Try to detect LinkedIn modal/dialog containing the composer
                const modal = composerElement.closest('[role="dialog"]') || parentContainer && parentContainer.closest && parentContainer.closest('[role="dialog"]');
                const rect = (modal || composerElement).getBoundingClientRect();

                // Panel width: keep responsive but reasonable
                const maxWidth = 460;
                const minWidth = 320;
                const panelWidth = Math.min(maxWidth, Math.max(minWidth, Math.floor(window.innerWidth * 0.28)));
                this.activePanel.style.width = panelWidth + 'px';

                // Decide whether to place panel on right or left depending on space
                const gap = 8; // small gap so it doesn't touch edge
                const spaceRight = window.innerWidth - rect.right;
                const spaceLeft = rect.left;
                let left;
                let side = 'right';

                // Force right alignment so the panel always opens to the right of the composer
                left = rect.right + gap + window.scrollX;
                side = 'right';
                // clamp so it doesn't overflow viewport
                if (left + panelWidth > window.innerWidth - 12) {
                    left = Math.max(window.innerWidth - panelWidth - 12, 12) + window.scrollX;
                }

                // Span the panel from near the top to near the bottom of the viewport
                const top = 12 + window.scrollY; // small top margin
                const height = Math.max(240, Math.floor(window.innerHeight - 24)); // fit inside tab with 12px top/bottom margins

                this.activePanel.style.left = left + 'px';
                this.activePanel.style.top = top + 'px';
                this.activePanel.style.height = height + 'px';
                // Make the outer panel the only scrollable container to avoid double scrollbars
                this.activePanel.style.overflowY = 'auto';
                // Inside body should not create additional scrollbar; let it expand and rely on outer panel scroll
                const body = this.activePanel.querySelector('.ai-post-body');
                if (body) {
                    body.style.maxHeight = 'none';
                    body.style.overflow = 'visible';
                }
                this.activePanel.style.boxSizing = 'border-box';

                // Apply side-specific appearance and separator
                if (side === 'right') {
                    this.activePanel.style.borderLeft = '1px solid rgba(0,0,0,0.08)';
                    this.activePanel.style.borderRight = '';
                } else {
                    this.activePanel.style.borderRight = '1px solid rgba(0,0,0,0.08)';
                    this.activePanel.style.borderLeft = '';
                }
                this.activePanel.style.backgroundClip = 'padding-box';
                
                // Mark classes for joined appearance
                if (this.activePanel._joinedModal) {
                    try {
                        // clean previous markers
                        this.activePanel._joinedModal.classList.remove('ai-panel-joined-left', 'ai-panel-joined-right');
                        this.activePanel.classList.remove('joined-left', 'joined-right');
                        // apply new markers
                        if (side === 'right') {
                            this.activePanel._joinedModal.classList.add('ai-panel-joined-right');
                            this.activePanel.classList.add('joined-right');
                        } else {
                            this.activePanel._joinedModal.classList.add('ai-panel-joined-left');
                            this.activePanel.classList.add('joined-left');
                        }
                    } catch (e) {}
                }
            } catch (err) {
                // fallback: small right-aligned panel
                this.activePanel.style.right = '24px';
                this.activePanel.style.top = '100px';
                this.activePanel.style.width = '360px';
                this.activePanel.style.maxHeight = '70vh';
                this.activePanel.style.overflowY = 'auto';
            }
        };

        // Detect modal/dialog once so we can join styles visually (store reference only)
        const joinedModal = composerElement.closest('[role="dialog"]') || (parentContainer && parentContainer.closest && parentContainer.closest('[role="dialog"]'));
        if (joinedModal) {
            this.activePanel._joinedModal = joinedModal;
        }

        // Initial position and listeners
        positionPanel();
        this._aiPanelPositionHandler = positionPanel;
        window.addEventListener('resize', positionPanel);
        window.addEventListener('scroll', positionPanel, true);

        // Add context indicator to show where content will be inserted (keeps same visual cue)
        const contextIndicator = document.createElement('div');
        contextIndicator.className = 'ai-context-indicator';
        contextIndicator.innerHTML = `
            <div class="ai-context-arrow"></div>
            <div class="ai-context-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,7H13V9H11V7M11,11H13V17H11V11Z"/>
                </svg>
                Content will be inserted above
            </div>
        `;

        contextIndicator.style.cssText = `
            position: absolute;
            top: -20px;
            left: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            z-index: 10001;
            animation: context-fade-in 0.3s ease-out;
        `;

        // Add context indicator styles if not present
        if (!document.querySelector('#ai-context-styles')) {
            const contextStyles = `
                <style id="ai-context-styles">
                    .ai-context-arrow {
                        position: absolute;
                        bottom: -6px;
                        left: 12px;
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 6px solid #667eea;
                    }
                    @keyframes context-fade-in {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', contextStyles);
        }

        // Position the indicator near the composer so it's always visible (append to body)
        try {
            const compRect = composerElement.getBoundingClientRect();
            const indicatorTop = Math.max(8, compRect.top - 40) + window.scrollY;
            const indicatorLeft = (compRect.left || 12) + 12 + window.scrollX;
            contextIndicator.style.position = 'absolute';
            contextIndicator.style.top = indicatorTop + 'px';
            contextIndicator.style.left = indicatorLeft + 'px';
            document.body.appendChild(contextIndicator);
            this.activePanel._contextIndicator = contextIndicator;
        } catch (e) {
            // fallback: append to panel
            this.activePanel.appendChild(contextIndicator);
        }
        
        // Focus on topic input
        const topicInput = this.activePanel.querySelector('#ai-post-topic');
        if (topicInput) {
            setTimeout(() => topicInput.focus(), 100);
        }

        // NOTE: keep closing controlled explicitly via the close button only.
        // Do not auto-close on Escape or outside clicks to match user request.
        this.activePanel._escapeHandler = null;
    }

    createPostCreatorPanel(composerElement) {
    const panel = document.createElement('div');
    // apply right alignment and the modern glassmorphism style by default
    panel.className = 'ai-post-panel right-aligned modern';
    // add responsive small class when viewport is narrow
    if (window.innerWidth < 1280) panel.classList.add('small');
        
        panel.innerHTML = `
            <div class="ai-panel-handle" aria-hidden="true"></div>
            <div class="ai-post-header">
                <div class="ai-post-title">
                    <div class="ai-title-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                        </svg>
                    </div>
                    <div class="ai-title-content">
                        <span class="ai-title-main">AI Post Creator Pro</span>
                        <span class="ai-title-sub">Powered by Muzamil Attiq</span>
                    </div>
                </div>
                <button class="ai-post-close" title="Close (Esc)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
            
            <div class="ai-post-body">
                <div class="ai-post-form">
                    <div class="ai-form-section">
                        <div class="ai-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                            </svg>
                            <span>Content Details</span>
                        </div>
                        
                        <div class="ai-post-field">
                            <label for="ai-post-topic">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                                </svg>
                                Topic/Keywords
                            </label>
                            <div class="ai-input-wrapper">
                                <input type="text" id="ai-post-topic" placeholder="e.g., AI automation, Digital marketing, Leadership tips" />
                                <div class="ai-input-glow"></div>
                            </div>
                        </div>
                        
                        <div class="ai-post-field">
                            <label for="ai-post-detail">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                                </svg>
                                Detail about post 
                                <span class="ai-label-accent">(Roman Urdu supported)</span>
                            </label>
                            <div class="ai-input-wrapper">
                                <textarea id="ai-post-detail" rows="3" placeholder="Describe what you want to write about... (Roman Urdu ya English me likh sakte hain)"></textarea>
                                <div class="ai-input-glow"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-form-section">
                        <div class="ai-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                            </svg>
                            <span>Writing Style</span>
                        </div>
                        
                        <div class="ai-post-row">
                            <div class="ai-post-field">
                                <label for="ai-post-tone">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                                    </svg>
                                    Writing Tone
                                </label>
                                <div class="ai-select-wrapper">
                                    <select id="ai-post-tone">
                                        <option value="prof">💼 Professional</option>
                                        <option value="casual">😊 Casual & Friendly</option>
                                        <option value="formal">🎩 Formal</option>
                                        <option value="conversational">💬 Conversational</option>
                                        <option value="enthusiastic">🔥 Enthusiastic</option>
                                        <option value="educational">📚 Educational</option>
                                        <option value="motivational">💪 Motivational</option>
                                        <option value="storytelling">📖 Storytelling</option>
                                        <option value="humorous">😄 Humorous</option>
                                        <option value="inspiring">⚡ Inspiring</option>
                                        <option value="thought-leader">🧠 Thought Leader</option>
                                        <option value="empathetic">❤️ Empathetic</option>
                                    </select>
                                    <div class="ai-select-arrow">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="ai-post-field">
                                <label for="ai-post-industry">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,7L17,12H14V16H10V12H7L12,7M19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21Z"/>
                                    </svg>
                                    Industry Focus
                                </label>
                                <div class="ai-select-wrapper">
                                    <select id="ai-post-industry">
                                        <option value="">🌐 General</option>
                                        <option value="tech">💻 Tech/Software</option>
                                        <option value="marketing">📱 Marketing</option>
                                        <option value="hr">👥 HR/Recruiting</option>
                                        <option value="finance">💰 Finance</option>
                                        <option value="sales">📊 Sales</option>
                                        <option value="healthcare">🏥 Healthcare</option>
                                        <option value="education">🎓 Education</option>
                                        <option value="consulting">💡 Consulting</option>
                                    </select>
                                    <div class="ai-select-arrow">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-form-section">
                        <div class="ai-section-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            <span>Content Settings</span>
                        </div>
                        
                        <div class="ai-post-row">
                            <div class="ai-post-field">
                                <label for="ai-post-variations">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                    </svg>
                                    Variations
                                </label>
                                <div class="ai-select-wrapper">
                                    <select id="ai-post-variations">
                                        <option value="1">1 Post</option>
                                        <option value="2">2 Variations</option>
                                        <option value="3">3 Variations</option>
                                    </select>
                                    <div class="ai-select-arrow">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="ai-post-field">
                                <label for="ai-post-length">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3,3H5V13H9V7H11V13H15V9H17V13H21V15H17V19H15V15H11V21H9V15H5V19H3V15H1V13H3V3M5,5V13H3V11H5V5Z"/>
                                    </svg>
                                    Length
                                </label>
                                <div class="ai-select-wrapper">
                                    <select id="ai-post-length">
                                        <option value="short">📝 Short</option>
                                        <option value="med" selected>📄 Medium</option>
                                        <option value="long">📜 Long</option>
                                    </select>
                                    <div class="ai-select-arrow">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="ai-post-options">
                            <div class="ai-option-card">
                                <label class="ai-switch-container">
                                    <input type="checkbox" id="ai-post-emoji" />
                                    <span class="ai-switch">
                                        <span class="ai-switch-slider"></span>
                                    </span>
                                    <div class="ai-option-content">
                                        <div class="ai-option-title">Add Emojis 🎨</div>
                                        <div class="ai-option-desc">Make posts more engaging</div>
                                    </div>
                                </label>
                            </div>
                            
                            <div class="ai-option-card">
                                <label class="ai-switch-container">
                                    <input type="checkbox" id="ai-hashtag-toggle" checked />
                                    <span class="ai-switch">
                                        <span class="ai-switch-slider"></span>
                                    </span>
                                    <div class="ai-option-content">
                                        <div class="ai-option-title">Generate Hashtags #️⃣</div>
                                        <div class="ai-option-desc">Boost post visibility</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-post-actions">
                        <button id="ai-generate-post-btn" class="ai-post-generate">
                            <span class="ai-btn-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M10,12A1.5,1.5 0 0,1 8.5,10.5A1.5,1.5 0 0,1 10,9A1.5,1.5 0 0,1 11.5,10.5A1.5,1.5 0 0,1 10,12M2.5,12A1.5,1.5 0 0,1 1,10.5A1.5,1.5 0 0,1 2.5,9A1.5,1.5 0 0,1 4,10.5A1.5,1.5 0 0,1 2.5,12Z"/>
                                </svg>
                            </span>
                            <span class="ai-btn-text">Generate Posts</span>
                            <span class="ai-btn-shimmer"></span>
                        </button>
                        
                        <div class="ai-quick-actions">
                            <button id="ai-save-favorite-btn" class="ai-quick-btn" title="Save settings as favorite">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5,3C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19H5V5H12V3H5M17.78,4C17.61,4 17.43,4.07 17.3,4.2L16.08,5.41L18.58,7.91L19.8,6.7C20.06,6.44 20.06,6 19.8,5.75L18.25,4.2C18.12,4.07 17.95,4 17.78,4M15.37,6.12L8,13.5V16H10.5L17.87,8.62L15.37,6.12Z"/>
                                </svg>
                            </button>
                            <button id="ai-load-favorite-btn" class="ai-quick-btn" title="Load favorite settings">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="ai-post-result" class="ai-post-result" style="display: none;">
                    <div class="ai-result-header">
                        <div class="ai-result-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                            </svg>
                            <span>Generated Content</span>
                        </div>
                        <div class="ai-result-stats">
                            <span class="ai-stat-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                </svg>
                                By Muzamil Attiq
                            </span>
                        </div>
                    </div>
                    
                    <div class="ai-post-tabs">
                        <button class="ai-post-tab active" data-tab="posts">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                            </svg>
                            Posts
                        </button>
                        <button class="ai-post-tab" data-tab="hashtags">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5.41,21L6.12,17H2.12L2.47,15H6.47L7.53,9H3.53L3.88,7H7.88L8.59,3H10.59L9.88,7H15.88L16.59,3H18.59L17.88,7H21.88L21.53,9H17.53L16.47,15H20.47L20.12,17H16.12L15.41,21H13.41L14.12,17H8.12L7.41,21H5.41M10.12,9L9.06,15H15.06L16.12,9H10.12Z"/>
                            </svg>
                            Hashtags
                        </button>
                        <button class="ai-post-tab" data-tab="preview">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                            </svg>
                            Preview
                        </button>
                    </div>
                    
                    <div class="ai-post-tab-content">
                        <div id="ai-tab-posts" class="ai-post-tab-panel active">
                            <div id="ai-post-variations-container"></div>
                        </div>
                        
                        <div id="ai-tab-hashtags" class="ai-post-tab-panel">
                            <div id="ai-hashtags-container"></div>
                        </div>
                        
                        <div id="ai-tab-preview" class="ai-post-tab-panel">
                            <div id="ai-preview-content"></div>
                        </div>
                    </div>
                    
                    <div class="ai-post-result-actions">
                        <button id="ai-post-save-generated" class="ai-result-btn ai-result-btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
                            </svg>
                            Save Post
                        </button>
                        <button id="ai-post-regenerate" class="ai-result-btn ai-result-btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                            </svg>
                            Regenerate
                        </button>
                        <button id="ai-post-back" class="ai-result-btn ai-result-btn-ghost">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
                            </svg>
                            Back
                        </button>
                    </div>
                </div>
                
                <!-- Enhanced Modals remain the same but with updated styling -->
                <div id="ai-favorites-modal" class="ai-favorites-modal" style="display: none;">
                    <div class="ai-favorites-header">
                        <h4>📂 Load Favorites</h4>
                        <button class="ai-favorites-close">×</button>
                    </div>
                    <div class="ai-favorites-tabs">
                        <button class="ai-fav-tab active" data-tab="settings">⚙️ Settings</button>
                        <button class="ai-fav-tab" data-tab="saved">💾 Saved Posts</button>
                    </div>
                    <div class="ai-favorites-content">
                        <div id="ai-fav-settings" class="ai-fav-panel active"></div>
                        <div id="ai-fav-saved" class="ai-fav-panel"></div>
                    </div>
                </div>
                
                <div id="ai-save-post-modal" class="ai-save-post-modal" style="display: none;">
                    <div class="ai-save-post-header">
                        <h4>💾 Save Generated Post</h4>
                        <button class="ai-save-post-close">×</button>
                    </div>
                    <div class="ai-save-post-body">
                        <input type="text" id="ai-save-post-title" placeholder="Enter a title for this post..." />
                        <div class="ai-save-post-actions">
                            <button id="ai-save-post-confirm" class="ai-post-generate">Save</button>
                            <button id="ai-save-post-cancel" class="ai-post-btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupPanelEventListeners(panel, composerElement);
        return panel;
    }

    setupPanelEventListeners(panel, composerElement) {
        // Close button
        panel.querySelector('.ai-post-close').addEventListener('click', () => {
            this.closePanel(this.activeButton);
        });

        // Generate button
        panel.querySelector('#ai-generate-post-btn').addEventListener('click', () => {
            this.generatePosts(panel, composerElement);
        });

        // Regenerate button
        panel.querySelector('#ai-post-regenerate').addEventListener('click', async () => {
            const currentTab = panel.querySelector('.ai-post-tab.active').dataset.tab;
            const regenBtn = panel.querySelector('#ai-post-regenerate');
            const originalHTML = regenBtn.innerHTML;
            
            // Show loading state
            regenBtn.disabled = true;
            regenBtn.innerHTML = `
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
                Regenerating...
            `;
            
            try {
                if (currentTab === 'hashtags') {
                    await this.regenerateHashtags(panel);
                } else {
                    await this.generatePosts(panel, composerElement);
                }
            } finally {
                // Restore button
                regenBtn.disabled = false;
                regenBtn.innerHTML = originalHTML;
            }
        });

        // Back button
        panel.querySelector('#ai-post-back').addEventListener('click', () => {
            panel.querySelector('#ai-post-result').style.display = 'none';
            panel.querySelector('.ai-post-form').style.display = 'block';
        });

        // Save generated post
        panel.querySelector('#ai-post-save-generated').addEventListener('click', () => {
            this.showSavePostModal(panel);
        });

        // Save favorite button
        panel.querySelector('#ai-save-favorite-btn').addEventListener('click', () => {
            this.handleSaveFavorite(panel);
        });

        // Load favorite button
        panel.querySelector('#ai-load-favorite-btn').addEventListener('click', async () => {
            await this.showFavoritesModal(panel, composerElement);
        });

        // Tab switching
        panel.querySelectorAll('.ai-post-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(panel, tab.dataset.tab);
            });
        });

        // Enter key on topic field
        panel.querySelector('#ai-post-topic').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generatePosts(panel, composerElement);
            }
        });

        // Fix select dropdown value display - Robust Solution
        const selectElements = panel.querySelectorAll('select');
        selectElements.forEach(select => {
            // Create a custom display overlay for the selected value
            const createValueDisplay = () => {
                const wrapper = select.parentElement;
                let valueDisplay = wrapper.querySelector('.select-value-display');
                
                if (!valueDisplay) {
                    valueDisplay = document.createElement('div');
                    valueDisplay.className = 'select-value-display';
                    valueDisplay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 40px;
                        bottom: 0;
                        padding: 14px 16px;
                        pointer-events: none;
                        color: #1f2937;
                        font-weight: 600;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        z-index: 10005;
                        background: transparent;
                    `;
                    wrapper.appendChild(valueDisplay);
                    wrapper.style.position = 'relative';
                }
                
                return valueDisplay;
            };
            
            const updateDisplay = () => {
                const valueDisplay = createValueDisplay();
                const selectedOption = select.options[select.selectedIndex];
                
                if (selectedOption && selectedOption.value) {
                    valueDisplay.textContent = selectedOption.textContent;
                    valueDisplay.style.display = 'flex';
                    select.style.color = 'transparent';
                } else {
                    valueDisplay.style.display = 'none';
                    select.style.color = '#6b7280';
                }
            };
            
            // Handle all relevant events
            select.addEventListener('change', updateDisplay);
            select.addEventListener('blur', () => setTimeout(updateDisplay, 50));
            select.addEventListener('focus', () => {
                const valueDisplay = select.parentElement.querySelector('.select-value-display');
                if (valueDisplay) valueDisplay.style.display = 'none';
                select.style.color = '#1f2937';
            });
            
            // Initialize display
            setTimeout(updateDisplay, 100);
        });
    }

    async generatePosts(panel, composerElement) {
        const topic = panel.querySelector('#ai-post-topic').value.trim();
        const detail = panel.querySelector('#ai-post-detail').value.trim();
        const tone = panel.querySelector('#ai-post-tone').value;
        const industry = panel.querySelector('#ai-post-industry').value;
        const length = panel.querySelector('#ai-post-length').value;
        const variations = parseInt(panel.querySelector('#ai-post-variations').value);
        const withEmoji = panel.querySelector('#ai-post-emoji').checked;
        const withHashtags = panel.querySelector('#ai-hashtag-toggle').checked;

        if (!topic && !detail) {
            this.showError(panel, 'Please enter topic or detail');
            return;
        }

        const generateBtn = panel.querySelector('#ai-generate-post-btn');
        const originalHTML = generateBtn.innerHTML;
        
    generateBtn.innerHTML = '<span class="ai-post-spinner"></span> Creating...';
        generateBtn.disabled = true;

    // Show global branded writing indicator near the generate button
    try { AIAssistantDOM.showWritingIndicator(generateBtn, { insert: 'after' }); } catch (e) {}

        try {
            this.currentVariations = [];
            this.currentHashtags = [];
            this.selectedVariationIndex = 0;

            // Generate multiple variations in parallel
            const promises = [];
            for (let i = 0; i < variations; i++) {
                const minimalPrompt = this.buildPostMinimalPrompt(topic, detail, tone, industry, length, withEmoji, i);
                promises.push(AIAssistantAPI.generatePostMinimal(minimalPrompt));
            }

            const posts = await Promise.all(promises);
            // Filter out any invalid responses and extract text content
            this.currentVariations = posts.filter(p => p).map(post => {
                if (typeof post === 'string') {
                    return post;
                } else if (post && typeof post === 'object') {
                    // Extract text content from object response
                    return post.post || post.content || post.text || post.fullPost || '[Unable to extract post content]';
                }
                return '[Invalid post response]';
            });

            // Generate hashtags if enabled
            if (withHashtags) {
                const hashtagContent = `${topic} ${detail} ${tone}`;
                this.currentHashtags = await AIAssistantAPI.generateHashtags(hashtagContent, industry);
            }

            if (this.currentVariations.length > 0) {
                this.displayResults(panel, composerElement);
                await AIAssistantAPI.updateStats('postsGenerated');
            } else {
                throw new Error('No content generated');
            }

        } catch (error) {
            console.error('Post generation error:', error);
            this.showError(panel, error.message || 'Failed to generate posts');
        } finally {
            generateBtn.innerHTML = originalHTML;
            generateBtn.disabled = false;
            try { AIAssistantDOM.hideWritingIndicator(generateBtn); } catch (e) {}
        }
    }

    async regenerateHashtags(panel) {
        const topic = panel.querySelector('#ai-post-topic').value.trim();
        const detail = panel.querySelector('#ai-post-detail').value.trim();
        const tone = panel.querySelector('#ai-post-tone').value;
        const industry = panel.querySelector('#ai-post-industry').value;

        if (!topic && !detail) {
            this.showError(panel, 'Need topic/detail to regenerate hashtags');
            return;
        }

        try {
            const hashtagContent = `${topic} ${detail} ${tone}`;
            this.currentHashtags = await AIAssistantAPI.generateHashtags(hashtagContent, industry);
            this.displayHashtags(panel);
        } catch (error) {
            console.error('Hashtag regeneration error:', error);
        }
    }

    displayResults(panel, composerElement) {
        // Display variations
        const variationsContainer = panel.querySelector('#ai-post-variations-container');
        variationsContainer.innerHTML = '';

        this.currentVariations.forEach((post, index) => {
            const isSelected = index === this.selectedVariationIndex;
            const variationDiv = document.createElement('div');
            variationDiv.className = 'ai-post-variation';
            variationDiv.innerHTML = `
                <div class="ai-variation-header">
                    <label class="ai-variation-select">
                        <input type="radio" name="variation" value="${index}" ${isSelected ? 'checked' : ''} />
                        <span>Variation ${index + 1}</span>
                    </label>
                    <div class="ai-variation-actions">
                        <button class="ai-var-copy" data-index="${index}">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                            Copy
                        </button>
                        <button class="ai-var-use" data-index="${index}">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                            </svg>
                            Use
                        </button>
                    </div>
                </div>
                <div class="ai-variation-content">${post}</div>
            `;
            variationsContainer.appendChild(variationDiv);

            // Radio selection
            variationDiv.querySelector('input[type="radio"]').addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedVariationIndex = index;
                    this.updatePreview(panel);
                }
            });

            // Copy button
            variationDiv.querySelector('.ai-var-copy').addEventListener('click', () => {
                navigator.clipboard.writeText(post).then(() => {
                    const btn = variationDiv.querySelector('.ai-var-copy');
                    const original = btn.innerHTML;
                    btn.innerHTML = '<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg> Copied';
                    setTimeout(() => btn.innerHTML = original, 2000);
                });
            });

            // Use button
            variationDiv.querySelector('.ai-var-use').addEventListener('click', () => {
                this.insertContent(composerElement, post);
            });
        });

        // Display hashtags
        this.displayHashtags(panel);

        // Display preview
        this.updatePreview(panel);

        // Show results
        panel.querySelector('#ai-post-result').style.display = 'block';
        panel.querySelector('.ai-post-form').style.display = 'none';
    }

    updatePreview(panel) {
        const previewPanel = panel.querySelector('#ai-tab-preview');
        previewPanel.innerHTML = '';
        
        // Create preview for each variation
        this.currentVariations.forEach((post, index) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'linkedin-preview-card';
            
            let cardHTML = '';
            if (this.currentVariations.length > 1) {
                cardHTML += `<div class="preview-variation-label">Variation ${index + 1}</div>`;
            }
            
            cardHTML += `
                <div class="linkedin-feed-preview">
                    <div class="linkedin-post-card">
                        <div class="linkedin-post-header">
                            <div class="linkedin-avatar">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="24" fill="#0077B5"/>
                                    <path d="M24 14c-5.522 0-10 4.478-10 10s4.478 10 10 10 10-4.478 10-10-4.478-10-10-10zm0 16c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" fill="white"/>
                                </svg>
                            </div>
                            <div class="linkedin-user-info">
                                <div class="linkedin-name">Your Name</div>
                                <div class="linkedin-headline">Your Headline • Just now</div>
                            </div>
                            <button class="linkedin-dots">•••</button>
                        </div>
                        <div class="linkedin-post-content">${post}</div>
                        <div class="linkedin-post-stats">
                            <span class="linkedin-stat-item">👍 10</span>
                            <span class="linkedin-stat-separator"></span>
                            <span class="linkedin-stat-item">5 comments</span>
                        </div>
                        <div class="linkedin-post-actions">
                            <button class="linkedin-action-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a9.84 9.84 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733.058.119.103.242.138.363.077.27.113.567.113.856 0 .289-.036.586-.113.856-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.163 3.163 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16H8c-.605 0-1.07-.081-1.466-.218a4.82 4.82 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"/>
                                </svg>
                                Like
                            </button>
                            <button class="linkedin-action-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                                </svg>
                                Comment
                            </button>
                            <button class="linkedin-action-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z"/>
                                </svg>
                                Share
                            </button>
                            <button class="linkedin-action-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M6.598 11.049a.5.5 0 0 0 .223.418l.405.27a1.5 1.5 0 0 0 1.748 0l.405-.27a.5.5 0 0 0 .223-.418c0-.145-.062-.286-.173-.388a.513.513 0 0 0-.398-.162.513.513 0 0 0-.398.162.5.5 0 0 0-.173.388.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 0-.173-.388.513.513 0 0 0-.398-.162.513.513 0 0 0-.398.162.5.5 0 0 0-.173.388zm3.61-4.36a.5.5 0 0 1 .173-.387.514.514 0 0 1 .398-.162.514.514 0 0 1 .398.162.5.5 0 0 1 .173.387.5.5 0 0 0 .5.5.5.5 0 0 0 .5-.5 1.5 1.5 0 0 0-2.621-1.035l-.405.27a.5.5 0 0 0-.223.418.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 0-.223-.418l-.405-.27A1.5 1.5 0 0 0 5.402 6.19a.5.5 0 0 0 .5.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .173-.387.514.514 0 0 1 .398-.162.514.514 0 0 1 .398.162.5.5 0 0 1 .173.387.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 0-.223-.418l-.405-.27A1.5 1.5 0 0 0 3.794 6.69a.5.5 0 0 0 .5.5.5.5 0 0 0 .5-.5z"/>
                                </svg>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            previewCard.innerHTML = cardHTML;
            previewPanel.appendChild(previewCard);
        });
    }

    displayHashtags(panel) {
        const hashtagsContainer = panel.querySelector('#ai-hashtags-container');
        hashtagsContainer.innerHTML = '';

        if (this.currentHashtags && this.currentHashtags.length > 0) {
            const hashtagsDiv = document.createElement('div');
            hashtagsDiv.className = 'ai-hashtags-list';
            
            const tagsHtml = this.currentHashtags.map((tag, index) => {
                const tagText = typeof tag === 'string' ? tag : (tag.tag || tag);
                const hashTag = tagText.startsWith('#') ? tagText : `#${tagText}`;
                return `
                    <div class="ai-hashtag-item-wrapper">
                        <span class="ai-hashtag-item">${hashTag}</span>
                        <button class="ai-hashtag-insert" data-index="${index}">
                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                        </button>
                    </div>
                `;
            }).join('');
            
            hashtagsDiv.innerHTML = `
                <div class="ai-hashtags-title">Suggested Hashtags</div>
                <div class="ai-hashtags-tags">${tagsHtml}</div>
                <div class="ai-hashtags-actions">
                    <button id="ai-copy-hashtags" class="ai-post-btn-sm">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                        Copy All
                    </button>
                    <button id="ai-add-hashtags" class="ai-post-btn-sm">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        Add to Post
                    </button>
                </div>
            `;
            
            hashtagsContainer.appendChild(hashtagsDiv);

            // Individual hashtag insert
            hashtagsDiv.querySelectorAll('.ai-hashtag-insert').forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    const tag = this.currentHashtags[index];
                    const tagText = typeof tag === 'string' ? tag : tag.tag;
                    const hashTag = tagText.startsWith('#') ? tagText : `#${tagText}`;
                    
                    this.currentVariations[this.selectedVariationIndex] += ` ${hashTag}`;
                    this.displayResults(panel, composerElement);
                    
                    btn.innerHTML = '<svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg>';
                    setTimeout(() => {
                        const insertBtn = hashtagsDiv.querySelectorAll('.ai-hashtag-insert')[index];
                        if (insertBtn) {
                            insertBtn.innerHTML = '<svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>';
                        }
                    }, 1500);
                });
            });

            // Copy hashtags
            panel.querySelector('#ai-copy-hashtags').addEventListener('click', () => {
                const hashtagsText = this.currentHashtags.map(tag => {
                    const t = typeof tag === 'string' ? tag : tag.tag;
                    return t.startsWith('#') ? t : `#${t}`;
                }).join(' ');
                
                navigator.clipboard.writeText(hashtagsText).then(() => {
                    const btn = panel.querySelector('#ai-copy-hashtags');
                    const original = btn.innerHTML;
                    btn.innerHTML = '<svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg> Copied!';
                    setTimeout(() => btn.innerHTML = original, 2000);
                });
            });

            // Add hashtags to selected post
            panel.querySelector('#ai-add-hashtags').addEventListener('click', () => {
                const hashtagsText = this.currentHashtags.map(tag => {
                    const t = typeof tag === 'string' ? tag : tag.tag;
                    return t.startsWith('#') ? t : `#${t}`;
                }).join(' ');
                
                this.currentVariations[this.selectedVariationIndex] += `\n\n${hashtagsText}`;
                this.displayResults(panel, composerElement);
            });
        } else {
            hashtagsContainer.innerHTML = '<div class="ai-no-hashtags">No hashtags generated</div>';
        }
    }

    buildPostMinimalPrompt(topic, detail, tone, industry, length, withEmoji, variation) {
        let prompt = '';
        
        if (topic) {
            const topicShort = topic.split(' ').slice(0, 3).join(' ');
            prompt += topicShort;
        }
        
        if (detail) {
            const detailShort = detail.length > 50 ? detail.substring(0, 50) : detail;
            prompt += `|${detailShort}`;
        }
        
        prompt += `|${tone}`;
        
        if (industry) {
            prompt += `|${industry}`;
        }
        
        prompt += `|${length}`;
        
        if (withEmoji) {
            prompt += `|emoji`;
        }
        
        if (variation > 0) {
            prompt += `|v${variation}`;
        }
        
        prompt += `|engage`;
        
        return prompt;
    }

    async handleSaveFavorite(panel) {
        const topic = panel.querySelector('#ai-post-topic').value.trim();
        const detail = panel.querySelector('#ai-post-detail').value.trim();
        const tone = panel.querySelector('#ai-post-tone').value;
        const industry = panel.querySelector('#ai-post-industry').value;
        const length = panel.querySelector('#ai-post-length').value;

        if (!topic && !detail) {
            this.showError(panel, 'Enter topic/detail to save');
            return;
        }

        await this.saveFavorite(topic, detail, tone, industry, length);
        
        const btn = panel.querySelector('#ai-save-favorite-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg>';
        setTimeout(() => btn.innerHTML = original, 2000);
    }

    showSavePostModal(panel) {
        const modal = panel.querySelector('#ai-save-post-modal');
        const titleInput = modal.querySelector('#ai-save-post-title');
        
        titleInput.value = '';
        modal.style.display = 'block';
        setTimeout(() => titleInput.focus(), 100);
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        modal.querySelector('.ai-save-post-close').onclick = closeModal;
        modal.querySelector('#ai-save-post-cancel').onclick = closeModal;
        
        modal.querySelector('#ai-save-post-confirm').onclick = async () => {
            const title = titleInput.value.trim();
            if (!title) {
                titleInput.style.borderColor = '#ef4444';
                return;
            }
            
            const metadata = {
                topic: panel.querySelector('#ai-post-topic').value,
                detail: panel.querySelector('#ai-post-detail').value,
                tone: panel.querySelector('#ai-post-tone').value,
                industry: panel.querySelector('#ai-post-industry').value,
                length: panel.querySelector('#ai-post-length').value,
                withEmoji: panel.querySelector('#ai-post-emoji').checked,
                variations: panel.querySelector('#ai-post-variations').value
            };
            
            await this.savePost(title, this.currentVariations, this.currentHashtags, metadata);
            closeModal();
            this.showSuccess(panel, 'Post saved!');
        };
    }

    async showFavoritesModal(panel, composerElement) {
        const modal = panel.querySelector('#ai-favorites-modal');
        
        await this.loadFavorites();
        await this.loadSavedPosts();
        
        this.displayFavoriteSettings(panel);
        this.displaySavedPosts(panel, composerElement);
        
        modal.style.display = 'block';
        
        // Tab switching
        modal.querySelectorAll('.ai-fav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.ai-fav-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.ai-fav-panel').forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                modal.querySelector(`#ai-fav-${tab.dataset.tab}`).classList.add('active');
            });
        });
        
        modal.querySelector('.ai-favorites-close').onclick = () => {
            modal.style.display = 'none';
        };
    }

    displayFavoriteSettings(panel) {
        const container = panel.querySelector('#ai-fav-settings');
        
        if (this.favorites.length === 0) {
            container.innerHTML = '<div class="ai-no-favorites">No settings saved yet</div>';
        } else {
            container.innerHTML = this.favorites.map(fav => `
                <div class="ai-favorite-item">
                    <div class="ai-fav-content">
                        <div class="ai-fav-topic">${fav.topic || fav.detail}</div>
                        <div class="ai-fav-meta">${fav.tone}${fav.industry ? ' • ' + fav.industry : ''} • ${fav.length}</div>
                    </div>
                    <button class="ai-fav-load" data-id="${fav.id}">Load</button>
                </div>
            `).join('');

            container.querySelectorAll('.ai-fav-load').forEach(btn => {
                btn.addEventListener('click', () => {
                    const favId = parseInt(btn.dataset.id);
                    const fav = this.favorites.find(f => f.id === favId);
                    if (fav) {
                        panel.querySelector('#ai-post-topic').value = fav.topic || '';
                        panel.querySelector('#ai-post-detail').value = fav.detail || '';
                        panel.querySelector('#ai-post-tone').value = fav.tone || 'prof';
                        panel.querySelector('#ai-post-industry').value = fav.industry || '';
                        panel.querySelector('#ai-post-length').value = fav.length || 'med';
                        panel.querySelector('#ai-favorites-modal').style.display = 'none';
                    }
                });
            });
        }
    }

    displaySavedPosts(panel, composerElement) {
        const container = panel.querySelector('#ai-fav-saved');
        
        if (this.savedPosts.length === 0) {
            container.innerHTML = '<div class="ai-no-favorites">No posts saved yet</div>';
        } else {
            container.innerHTML = this.savedPosts.map(saved => `
                <div class="ai-saved-post-item">
                    <div class="ai-saved-content">
                        <div class="ai-saved-title">${saved.title}</div>
                        <div class="ai-saved-meta">${saved.posts.length} variation${saved.posts.length > 1 ? 's' : ''} • ${new Date(saved.date).toLocaleDateString()}</div>
                    </div>
                    <div class="ai-saved-actions">
                        <button class="ai-saved-regenerate" data-id="${saved.id}">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                            </svg>
                        </button>
                        <button class="ai-saved-use" data-id="${saved.id}">Use</button>
                    </div>
                </div>
            `).join('');

            // Regenerate saved post
            container.querySelectorAll('.ai-saved-regenerate').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const savedId = parseInt(btn.dataset.id);
                    const saved = this.savedPosts.find(s => s.id === savedId);
                    if (saved && saved.metadata) {
                        // Load settings and regenerate
                        panel.querySelector('#ai-post-topic').value = saved.metadata.topic || '';
                        panel.querySelector('#ai-post-detail').value = saved.metadata.detail || '';
                        panel.querySelector('#ai-post-tone').value = saved.metadata.tone || 'prof';
                        panel.querySelector('#ai-post-industry').value = saved.metadata.industry || '';
                        panel.querySelector('#ai-post-length').value = saved.metadata.length || 'med';
                        panel.querySelector('#ai-post-emoji').checked = saved.metadata.withEmoji || false;
                        panel.querySelector('#ai-post-variations').value = saved.metadata.variations || '1';
                        
                        panel.querySelector('#ai-favorites-modal').style.display = 'none';
                        await this.generatePosts(panel, composerElement);
                    }
                });
            });

            // Use saved post
            container.querySelectorAll('.ai-saved-use').forEach(btn => {
                btn.addEventListener('click', () => {
                    const savedId = parseInt(btn.dataset.id);
                    const saved = this.savedPosts.find(s => s.id === savedId);
                    if (saved && saved.posts.length > 0) {
                        this.insertContent(composerElement, saved.posts[0]);
                        panel.querySelector('#ai-favorites-modal').style.display = 'none';
                        this.closePanel(this.activeButton);
                    }
                });
            });
        }
    }

    switchTab(panel, tabName) {
        panel.querySelectorAll('.ai-post-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        panel.querySelectorAll('.ai-post-tab-panel').forEach(tabPanel => {
            tabPanel.classList.toggle('active', tabPanel.id === `ai-tab-${tabName}`);
        });
    }

    insertContent(composerElement, content) {
        const editor = composerElement.querySelector('.ql-editor, [contenteditable="true"]') || composerElement;
        
        AIAssistantDOM.setEditableText(editor, content);
        
        editor.focus();
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        
        this.showSuccess(this.activePanel, 'Post inserted!');
        setTimeout(() => this.closePanel(this.activeButton), 1000);
    }

    showError(panel, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-post-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #fee2e2;
            color: #991b1b;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 13px;
        `;
        
        const form = panel.querySelector('.ai-post-form');
        const existing = panel.querySelector('.ai-post-error');
        if (existing) existing.remove();
        form.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }

    showSuccess(panel, message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'ai-post-success';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d1fae5;
            color: #065f46;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 13px;
        `;
        
        const body = panel.querySelector('.ai-post-body');
        body.appendChild(successDiv);
        
        setTimeout(() => successDiv.remove(), 2000);
    }

    closePanel(aiButton) {
        if (this.activePanel) {
            if (this.activePanel._escapeHandler) {
                document.removeEventListener('keydown', this.activePanel._escapeHandler);
            }
            // remove resize/scroll listeners if set
            if (this._aiPanelPositionHandler) {
                window.removeEventListener('resize', this._aiPanelPositionHandler);
                window.removeEventListener('scroll', this._aiPanelPositionHandler, true);
                this._aiPanelPositionHandler = null;
            }

            this.activePanel.remove();
            // remove joined modal class if applied (remove both side-specific markers)
            if (this.activePanel._joinedModal) {
                try {
                    this.activePanel._joinedModal.classList.remove('ai-panel-joined-right', 'ai-panel-joined-left');
                    this.activePanel.classList.remove('joined-right', 'joined-left');
                } catch (e) {}
            }
            // remove context indicator if we appended it to body
            try {
                if (this.activePanel._contextIndicator) {
                    this.activePanel._contextIndicator.remove();
                    this.activePanel._contextIndicator = null;
                }
            } catch (e) {}
            this.activePanel = null;
        }
        
        // Show AI button when panel closes
        if (aiButton) {
            aiButton.style.display = 'flex';
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    cleanup() {
        this.closePanel(this.activeButton);
        document.querySelectorAll('.ai-post-creator-btn').forEach(btn => btn.remove());
        this.attachedComposers = new WeakMap();
    }
}

window.AIPostCreator = AIPostCreator;
