// AI Post Creator Component
// Handles LinkedIn post generation with floating panel interface

class AIPostCreator {
    constructor(settings) {
        this.settings = settings;
        this.attachedComposers = new WeakSet();
        this.activePanel = null;
    }

    async attachToComposer(composerElement) {
        if (this.attachedComposers.has(composerElement)) {
            return;
        }

        this.attachedComposers.add(composerElement);

        // Create AI assistant button
        const aiButton = this.createAIButton();
        this.positionAIButton(aiButton, composerElement);

        aiButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showPostCreatorPanel(composerElement);
        });

        // Insert button into DOM
        const parentContainer = composerElement.closest('.share-creation-state, .ql-container') || composerElement.parentElement;
        if (parentContainer) {
            parentContainer.style.position = 'relative';
            parentContainer.appendChild(aiButton);
        }
    }

    createAIButton() {
        const button = document.createElement('button');
        button.className = 'ai-post-creator-btn';
        button.innerHTML = '✨ AI Post Assistant';
        button.type = 'button';
        
        button.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #0077B5, #00A0DC);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 119, 181, 0.3);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 8px rgba(0, 119, 181, 0.3)';
        });

        return button;
    }

    positionAIButton(button, composerElement) {
        const rect = composerElement.getBoundingClientRect();
        const parentRect = composerElement.offsetParent?.getBoundingClientRect() || rect;
        
        button.style.top = `${Math.max(8, rect.top - parentRect.top)}px`;
        button.style.right = '8px';
    }

    showPostCreatorPanel(composerElement) {
        if (this.activePanel) {
            this.activePanel.remove();
        }

        this.activePanel = this.createPostCreatorPanel(composerElement);
        document.body.appendChild(this.activePanel);
        
        // Position panel
        this.positionPanel(this.activePanel, composerElement);
        
        // Focus on topic input
        const topicInput = this.activePanel.querySelector('#ai-post-topic');
        if (topicInput) {
            setTimeout(() => topicInput.focus(), 100);
        }
    }

    createPostCreatorPanel(composerElement) {
        const panel = document.createElement('div');
        panel.className = 'ai-post-creator-panel';
        
        panel.innerHTML = `
            <div class="ai-panel-header">
                <div class="ai-panel-title">
                    <i class="fas fa-edit"></i>
                    <span>AI Post Creator</span>
                </div>
                <div class="ai-panel-actions">
                    <button class="ai-panel-minimize" title="Minimize">-</button>
                    <button class="ai-panel-close" title="Close">×</button>
                </div>
            </div>
            
            <div class="ai-panel-content">
                <div class="ai-form-group">
                    <label for="ai-post-topic">Topic or Keywords</label>
                    <input type="text" id="ai-post-topic" placeholder="e.g., Digital transformation in healthcare" />
                </div>
                
                <div class="ai-form-group">
                    <label for="ai-post-tone">Tone</label>
                    <select id="ai-post-tone">
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="persuasive">Persuasive</option>
                        <option value="storytelling">Storytelling</option>
                        <option value="humorous">Humorous</option>
                    </select>
                </div>
                
                <div class="ai-form-group">
                    <label for="ai-post-type">Content Type</label>
                    <select id="ai-post-type">
                        <option value="post">Standard Post</option>
                        <option value="thought-leadership">Thought Leadership</option>
                        <option value="announcement">Announcement</option>
                        <option value="question">Question/Poll</option>
                        <option value="story">Personal Story</option>
                    </select>
                </div>
                
                <div class="ai-form-actions">
                    <button id="ai-generate-post" class="ai-btn ai-btn-primary">
                        <i class="fas fa-magic"></i>
                        Generate Post
                    </button>
                </div>
                
                <div id="ai-post-results" class="ai-results" style="display: none;">
                    <div class="ai-results-header">
                        <h4>Generated Content</h4>
                        <div class="ai-results-actions">
                            <button id="ai-regenerate" class="ai-btn ai-btn-secondary">Regenerate</button>
                        </div>
                    </div>
                    
                    <div class="ai-content-tabs">
                        <button class="ai-tab active" data-tab="hook">Hook</button>
                        <button class="ai-tab" data-tab="description">Description</button>
                        <button class="ai-tab" data-tab="full">Full Post</button>
                        <button class="ai-tab" data-tab="hashtags">Hashtags</button>
                    </div>
                    
                    <div class="ai-tab-content">
                        <div id="ai-tab-hook" class="ai-tab-panel active">
                            <div class="ai-content-item">
                                <div class="ai-content-text" id="ai-hook-text"></div>
                                <div class="ai-content-actions">
                                    <button class="ai-btn ai-btn-small ai-insert-hook">Insert Hook</button>
                                    <button class="ai-btn ai-btn-small ai-rewrite-hook">Rewrite</button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="ai-tab-description" class="ai-tab-panel">
                            <div class="ai-content-item">
                                <div class="ai-content-text" id="ai-description-text"></div>
                                <div class="ai-content-actions">
                                    <button class="ai-btn ai-btn-small ai-insert-description">Insert Description</button>
                                    <button class="ai-btn ai-btn-small ai-rewrite-description">Rewrite</button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="ai-tab-full" class="ai-tab-panel">
                            <div class="ai-content-item">
                                <div class="ai-content-text" id="ai-full-text"></div>
                                <div class="ai-content-actions">
                                    <button class="ai-btn ai-btn-small ai-insert-full">Insert Full Post</button>
                                    <button class="ai-btn ai-btn-small ai-rewrite-full">Rewrite</button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="ai-tab-hashtags" class="ai-tab-panel">
                            <div class="ai-content-item">
                                <div class="ai-content-text" id="ai-hashtags-text"></div>
                                <div class="ai-content-actions">
                                    <button class="ai-btn ai-btn-small ai-insert-hashtags">Insert Hashtags</button>
                                    <button class="ai-btn ai-btn-small ai-generate-more-hashtags">Generate More</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupPanelEventListeners(panel, composerElement);
        return panel;
    }

    setupPanelEventListeners(panel, composerElement) {
        // Close panel
        panel.querySelector('.ai-panel-close').addEventListener('click', () => {
            panel.remove();
            this.activePanel = null;
        });

        // Minimize panel
        const minimizeBtn = panel.querySelector('.ai-panel-minimize');
        minimizeBtn.addEventListener('click', () => {
            const content = panel.querySelector('.ai-panel-content');
            const isMinimized = content.style.display === 'none';
            content.style.display = isMinimized ? 'block' : 'none';
            minimizeBtn.textContent = isMinimized ? '-' : '+';
        });

        // Tab switching
        panel.querySelectorAll('.ai-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(panel, tabName);
            });
        });

        // Generate post
        panel.querySelector('#ai-generate-post').addEventListener('click', () => {
            this.generatePost(panel, composerElement);
        });

        // Regenerate
        panel.querySelector('#ai-regenerate').addEventListener('click', () => {
            this.generatePost(panel, composerElement);
        });

        // Insert content buttons
        this.setupInsertButtons(panel, composerElement);

        // Make panel draggable
        this.makeDraggable(panel);

        // Set default tone
        const toneSelect = panel.querySelector('#ai-post-tone');
        toneSelect.value = this.settings.globalTone || 'professional';
    }

    setupInsertButtons(panel, composerElement) {
        const insertButtons = {
            '.ai-insert-hook': () => this.insertContent(composerElement, panel.querySelector('#ai-hook-text').textContent),
            '.ai-insert-description': () => this.insertContent(composerElement, panel.querySelector('#ai-description-text').textContent),
            '.ai-insert-full': () => this.insertContent(composerElement, panel.querySelector('#ai-full-text').textContent),
            '.ai-insert-hashtags': () => this.insertContent(composerElement, '\n\n' + panel.querySelector('#ai-hashtags-text').textContent)
        };

        Object.keys(insertButtons).forEach(selector => {
            const button = panel.querySelector(selector);
            if (button) {
                button.addEventListener('click', insertButtons[selector]);
            }
        });

        // Rewrite buttons
        const rewriteButtons = {
            '.ai-rewrite-hook': () => this.rewriteContent(panel, 'hook'),
            '.ai-rewrite-description': () => this.rewriteContent(panel, 'description'),
            '.ai-rewrite-full': () => this.rewriteContent(panel, 'full')
        };

        Object.keys(rewriteButtons).forEach(selector => {
            const button = panel.querySelector(selector);
            if (button) {
                button.addEventListener('click', rewriteButtons[selector]);
            }
        });

        // Generate more hashtags
        panel.querySelector('.ai-generate-more-hashtags')?.addEventListener('click', () => {
            this.generateMoreHashtags(panel);
        });
    }

    async generatePost(panel, composerElement) {
        const topic = panel.querySelector('#ai-post-topic').value.trim();
        const tone = panel.querySelector('#ai-post-tone').value;
        const contentType = panel.querySelector('#ai-post-type').value;

        if (!topic) {
            AIAssistantAPI.showError(new Error('Please enter a topic or keywords'), panel.querySelector('.ai-form-actions'));
            return;
        }

        const generateBtn = panel.querySelector('#ai-generate-post');
        const originalText = generateBtn.innerHTML;
        
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        try {
            const content = await AIAssistantAPI.generateContent(topic, tone, contentType);
            
            // Update content displays
            panel.querySelector('#ai-hook-text').textContent = content.hook || '';
            panel.querySelector('#ai-description-text').textContent = content.shortDescription || '';
            panel.querySelector('#ai-full-text').textContent = content.fullPost || '';
            
            if (content.hashtags && Array.isArray(content.hashtags)) {
                panel.querySelector('#ai-hashtags-text').textContent = content.hashtags.map(tag => 
                    tag.startsWith('#') ? tag : `#${tag}`
                ).join(' ');
            }

            // Show results
            panel.querySelector('#ai-post-results').style.display = 'block';
            
            // Update stats
            await AIAssistantAPI.updateStats('postsGenerated');
            
            AIAssistantAPI.showSuccess('Post content generated successfully!', panel.querySelector('.ai-panel-content'));

        } catch (error) {
            console.error('Error generating post:', error);
            AIAssistantAPI.showError(error, panel.querySelector('.ai-form-actions'));
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    async rewriteContent(panel, contentType) {
        const contentElement = panel.querySelector(`#ai-${contentType}-text`);
        const currentContent = contentElement.textContent;
        const tone = panel.querySelector('#ai-post-tone').value;

        if (!currentContent) return;

        try {
            const rewrittenContent = await AIAssistantAPI.rewriteText(currentContent, tone, 'Make it more engaging for LinkedIn audience');
            
            if (rewrittenContent && rewrittenContent.rewritten) {
                contentElement.textContent = rewrittenContent.rewritten;
                AIAssistantAPI.showSuccess('Content rewritten successfully!', panel.querySelector('.ai-tab-content'));
            }
        } catch (error) {
            console.error('Error rewriting content:', error);
            AIAssistantAPI.showError(error, panel.querySelector('.ai-tab-content'));
        }
    }

    async generateMoreHashtags(panel) {
        const fullText = panel.querySelector('#ai-full-text').textContent;
        const topic = panel.querySelector('#ai-post-topic').value;

        if (!fullText && !topic) return;

        try {
            const hashtags = await AIAssistantAPI.generateHashtags(fullText || topic);
            
            if (hashtags && Array.isArray(hashtags)) {
                const hashtagText = hashtags.map(item => {
                    const tag = typeof item === 'string' ? item : item.tag;
                    return tag.startsWith('#') ? tag : `#${tag}`;
                }).join(' ');
                
                panel.querySelector('#ai-hashtags-text').textContent = hashtagText;
                AIAssistantAPI.showSuccess('New hashtags generated!', panel.querySelector('.ai-tab-content'));
            }
        } catch (error) {
            console.error('Error generating hashtags:', error);
            AIAssistantAPI.showError(error, panel.querySelector('.ai-tab-content'));
        }
    }

    insertContent(composerElement, content) {
        if (!content) return;

        AIAssistantDOM.setEditableText(composerElement, content);
        
        // Trigger focus and input events to ensure LinkedIn recognizes the change
        composerElement.focus();
        composerElement.dispatchEvent(new Event('input', { bubbles: true }));
        composerElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        AIAssistantAPI.showSuccess('Content inserted successfully!', composerElement.parentElement);
        
        // Close panel after insertion
        if (this.activePanel) {
            setTimeout(() => {
                this.activePanel.remove();
                this.activePanel = null;
            }, 1000);
        }
    }

    switchTab(panel, tabName) {
        // Update tab buttons
        panel.querySelectorAll('.ai-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panels
        panel.querySelectorAll('.ai-tab-panel').forEach(tabPanel => {
            tabPanel.classList.toggle('active', tabPanel.id === `ai-tab-${tabName}`);
        });
    }

    positionPanel(panel, composerElement) {
        const rect = composerElement.getBoundingClientRect();
        const panelWidth = 400;
        const panelHeight = 500;
        
        let left = rect.right + 10;
        let top = rect.top;

        // Adjust if panel would go off-screen
        if (left + panelWidth > window.innerWidth) {
            left = rect.left - panelWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }
        
        if (top + panelHeight > window.innerHeight) {
            top = window.innerHeight - panelHeight - 10;
        }
        if (top < 10) {
            top = 10;
        }

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
    }

    makeDraggable(panel) {
        const header = panel.querySelector('.ai-panel-header');
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.style.cursor = 'move';

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ai-panel-actions')) return;
            
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
        });

        function handleDrag(e) {
            if (!isDragging) return;
            
            let left = e.clientX - dragOffset.x;
            let top = e.clientY - dragOffset.y;
            
            // Keep panel within viewport
            left = Math.max(0, Math.min(left, window.innerWidth - panel.offsetWidth));
            top = Math.max(0, Math.min(top, window.innerHeight - panel.offsetHeight));
            
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }

        function handleDragEnd() {
            isDragging = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    cleanup() {
        if (this.activePanel) {
            this.activePanel.remove();
            this.activePanel = null;
        }
        
        // Remove all AI buttons
        document.querySelectorAll('.ai-post-creator-btn').forEach(btn => btn.remove());
        
        this.attachedComposers = new WeakSet();
    }
}

// Export for use by content script
window.AIPostCreator = AIPostCreator;
