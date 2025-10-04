// AI Inbox Assistant Component
// Handles LinkedIn message reply suggestions and smart categorization

class AIInboxAssistant {
    constructor(settings) {
        this.settings = settings;
        this.attachedComposers = new WeakSet();
        this.activeReplies = new Map();
    }

    async attachToMessageComposer(composerElement) {
        if (this.attachedComposers.has(composerElement)) {
            return;
        }

        this.attachedComposers.add(composerElement);

        // Add smart reply suggestions
        this.addSmartReplyBox(composerElement);
        
        // Monitor for message context changes
        this.monitorConversationChanges(composerElement);
    }

    addSmartReplyBox(composerElement) {
        const replyBox = this.createSmartReplyBox();
        this.positionReplyBox(replyBox, composerElement);
        
        // Insert reply box into DOM
        const container = this.findMessageContainer(composerElement);
        if (container) {
            container.appendChild(replyBox);
        }

        this.setupReplyBoxEvents(replyBox, composerElement);
    }

    createSmartReplyBox() {
        const replyBox = document.createElement('div');
        replyBox.className = 'ai-smart-reply-box';
        
        replyBox.innerHTML = `
            <div class="ai-reply-header">
                <div class="ai-reply-title">
                    <i class="fas fa-inbox"></i>
                    <span>Smart Replies</span>
                </div>
                <div class="ai-reply-controls">
                    <select class="ai-reply-tone">
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="persuasive">Persuasive</option>
                    </select>
                    <button class="ai-reply-refresh" title="Refresh suggestions">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="ai-reply-toggle" title="Minimize/Expand">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
            </div>
            
            <div class="ai-reply-content">
                <div class="ai-reply-loading" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Analyzing conversation...</span>
                </div>
                
                <div class="ai-reply-suggestions" style="display: none;">
                    <div class="ai-reply-list"></div>
                    
                    <div class="ai-reply-actions">
                        <button class="ai-reply-generate-more">Generate More</button>
                        <button class="ai-reply-custom-prompt">Custom Request</button>
                    </div>
                </div>
                
                <div class="ai-reply-empty">
                    <div class="ai-reply-empty-content">
                        <i class="fas fa-comments"></i>
                        <p>Start a conversation to see smart reply suggestions</p>
                        <button class="ai-reply-generate-initial">Generate Suggestions</button>
                    </div>
                </div>
            </div>
        `;

        return replyBox;
    }

    setupReplyBoxEvents(replyBox, composerElement) {
        // Toggle minimize/expand
        const toggleBtn = replyBox.querySelector('.ai-reply-toggle');
        const content = replyBox.querySelector('.ai-reply-content');
        
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            toggleBtn.querySelector('i').className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        });

        // Refresh suggestions
        const refreshBtn = replyBox.querySelector('.ai-reply-refresh');
        refreshBtn.addEventListener('click', () => {
            this.generateReplySuggestions(composerElement, replyBox);
        });

        // Tone change
        const toneSelect = replyBox.querySelector('.ai-reply-tone');
        toneSelect.value = this.settings.globalTone || 'professional';
        toneSelect.addEventListener('change', () => {
            this.generateReplySuggestions(composerElement, replyBox);
        });

        // Generate initial suggestions
        const generateInitialBtn = replyBox.querySelector('.ai-reply-generate-initial');
        generateInitialBtn.addEventListener('click', () => {
            this.generateReplySuggestions(composerElement, replyBox);
        });

        // Generate more suggestions
        const generateMoreBtn = replyBox.querySelector('.ai-reply-generate-more');
        generateMoreBtn.addEventListener('click', () => {
            this.generateReplySuggestions(composerElement, replyBox, true);
        });

        // Custom prompt
        const customPromptBtn = replyBox.querySelector('.ai-reply-custom-prompt');
        customPromptBtn.addEventListener('click', () => {
            this.showCustomPromptDialog(composerElement, replyBox);
        });

        // Auto-generate on conversation changes
        setTimeout(() => {
            this.generateReplySuggestions(composerElement, replyBox);
        }, 1000);
    }

    async generateReplySuggestions(composerElement, replyBox, append = false) {
        const conversationHistory = this.extractConversationHistory(composerElement);
        const messageType = this.detectMessageType(conversationHistory);
        const tone = replyBox.querySelector('.ai-reply-tone').value;

        if (!conversationHistory.length) {
            this.showEmptyState(replyBox);
            return;
        }

        this.showLoadingState(replyBox);

        try {
            const replies = await AIAssistantAPI.generateInboxReply(conversationHistory, tone, messageType);
            
            if (replies && Array.isArray(replies)) {
                this.displayReplySuggestions(replyBox, replies, composerElement, append);
                await AIAssistantAPI.updateStats('messagesReplied');
            }

        } catch (error) {
            console.error('Error generating inbox reply:', error);
            AIAssistantAPI.showError(error, replyBox.querySelector('.ai-reply-content'));
            this.showEmptyState(replyBox);
        }
    }

    extractConversationHistory(composerElement) {
        const messageContainer = composerElement.closest('.msg-overlay-bubble-header, .messaging-thread-item, .msg-conversation-card');
        if (!messageContainer) return [];

        const messages = [];
        const messageElements = messageContainer.querySelectorAll('.msg-s-message-list__event, .message-item, .msg-s-event-listitem');

        messageElements.forEach((msgElement, index) => {
            if (index >= 10) return; // Limit to last 10 messages

            const isOwn = msgElement.classList.contains('msg-s-message-list__event--own') || 
                         msgElement.querySelector('.msg-s-message-group--own');
            
            const textElement = msgElement.querySelector('.msg-s-event-listitem__body, .message-body, p');
            const text = textElement ? textElement.textContent.trim() : '';
            
            if (text) {
                messages.push({
                    text,
                    isOwn,
                    timestamp: Date.now() - (messageElements.length - index) * 60000 // Approximate
                });
            }
        });

        return messages.slice(-5); // Get last 5 messages for context
    }

    detectMessageType(conversationHistory) {
        if (!conversationHistory.length) return 'general';

        const lastMessage = conversationHistory[conversationHistory.length - 1];
        const text = lastMessage.text.toLowerCase();

        if (text.includes('job') || text.includes('position') || text.includes('role') || text.includes('hire')) {
            return 'job_inquiry';
        } else if (text.includes('connect') || text.includes('network') || text.includes('introduction')) {
            return 'networking';
        } else if (text.includes('sale') || text.includes('product') || text.includes('service') || text.includes('buy')) {
            return 'sales';
        } else if (text.includes('collaboration') || text.includes('partner') || text.includes('project')) {
            return 'collaboration';
        } else if (text.includes('thanks') || text.includes('thank you')) {
            return 'gratitude';
        }

        return 'general';
    }

    displayReplySuggestions(replyBox, replies, composerElement, append = false) {
        const listContainer = replyBox.querySelector('.ai-reply-list');
        
        if (!append) {
            listContainer.innerHTML = '';
        }

        replies.forEach((reply, index) => {
            const replyItem = this.createReplyItem(reply, index, composerElement);
            listContainer.appendChild(replyItem);
        });

        // Show suggestions section
        replyBox.querySelector('.ai-reply-loading').style.display = 'none';
        replyBox.querySelector('.ai-reply-empty').style.display = 'none';
        replyBox.querySelector('.ai-reply-suggestions').style.display = 'block';
    }

    createReplyItem(reply, index, composerElement) {
        const item = document.createElement('div');
        item.className = 'ai-reply-item';
        
        const replyText = typeof reply === 'string' ? reply : reply.text;
        const replyType = typeof reply === 'object' ? reply.type : 'standard';
        const sentiment = typeof reply === 'object' ? reply.sentiment : 'neutral';

        item.innerHTML = `
            <div class="ai-reply-text">${replyText}</div>
            <div class="ai-reply-meta">
                <div class="ai-reply-tags">
                    <span class="ai-reply-tag ai-reply-tag-${replyType}">${this.formatReplyType(replyType)}</span>
                    <span class="ai-reply-tag ai-reply-tag-sentiment-${sentiment}">${this.formatSentiment(sentiment)}</span>
                </div>
                <div class="ai-reply-actions">
                    <button class="ai-reply-use" title="Use this reply">
                        <i class="fas fa-check"></i>
                        Use
                    </button>
                    <button class="ai-reply-edit" title="Edit before using">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="ai-reply-rewrite" title="Rewrite this reply">
                        <i class="fas fa-sync"></i>
                        Rewrite
                    </button>
                </div>
            </div>
        `;

        this.setupReplyItemEvents(item, replyText, composerElement);
        return item;
    }

    setupReplyItemEvents(item, replyText, composerElement) {
        // Use reply
        item.querySelector('.ai-reply-use').addEventListener('click', () => {
            this.insertReply(composerElement, replyText);
        });

        // Edit reply
        item.querySelector('.ai-reply-edit').addEventListener('click', () => {
            this.editReply(composerElement, replyText);
        });

        // Rewrite reply
        item.querySelector('.ai-reply-rewrite').addEventListener('click', () => {
            this.rewriteReply(item, replyText);
        });

        // Hover effects
        item.addEventListener('mouseenter', () => {
            item.classList.add('ai-reply-item-hover');
        });

        item.addEventListener('mouseleave', () => {
            item.classList.remove('ai-reply-item-hover');
        });
    }

    insertReply(composerElement, replyText) {
        AIAssistantDOM.setEditableText(composerElement, replyText);
        composerElement.focus();
        AIAssistantAPI.showSuccess('Reply inserted!', composerElement.parentElement);
    }

    editReply(composerElement, replyText) {
        AIAssistantDOM.setEditableText(composerElement, replyText);
        composerElement.focus();
        
        // Position cursor at end
        if (composerElement.setSelectionRange) {
            composerElement.setSelectionRange(replyText.length, replyText.length);
        }
        
        AIAssistantAPI.showSuccess('Reply ready for editing!', composerElement.parentElement);
    }

    async rewriteReply(replyItem, originalText) {
        const rewriteBtn = replyItem.querySelector('.ai-reply-rewrite');
        const originalIcon = rewriteBtn.innerHTML;
        
        rewriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        rewriteBtn.disabled = true;

        try {
            const tone = replyItem.closest('.ai-smart-reply-box').querySelector('.ai-reply-tone').value;
            const rewrittenContent = await AIAssistantAPI.rewriteText(originalText, tone, 'Make it more engaging and professional');

            if (rewrittenContent && rewrittenContent.rewritten) {
                const textElement = replyItem.querySelector('.ai-reply-text');
                textElement.textContent = rewrittenContent.rewritten;
                
                // Update the reply text for future use
                this.setupReplyItemEvents(replyItem, rewrittenContent.rewritten, 
                    document.querySelector('.msg-form__contenteditable, .compose-form__message-texteditor .ql-editor'));
            }

        } catch (error) {
            console.error('Error rewriting reply:', error);
            AIAssistantAPI.showError(error, replyItem);
        } finally {
            rewriteBtn.innerHTML = originalIcon;
            rewriteBtn.disabled = false;
        }
    }

    showCustomPromptDialog(composerElement, replyBox) {
        const modal = AIAssistantDOM.createModal('Custom Reply Request', `
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">What kind of reply do you need?</label>
                <textarea id="custom-prompt" placeholder="e.g., Write a polite decline for this job offer..." style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancel-custom" style="padding: 8px 16px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="generate-custom" style="padding: 8px 16px; background: #0077b5; color: white; border: none; border-radius: 4px; cursor: pointer;">Generate</button>
            </div>
        `);

        const promptTextarea = modal.modal.querySelector('#custom-prompt');
        const cancelBtn = modal.modal.querySelector('#cancel-custom');
        const generateBtn = modal.modal.querySelector('#generate-custom');

        cancelBtn.addEventListener('click', modal.close);
        
        generateBtn.addEventListener('click', async () => {
            const customPrompt = promptTextarea.value.trim();
            if (!customPrompt) return;

            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;

            try {
                const conversationHistory = this.extractConversationHistory(composerElement);
                const tone = replyBox.querySelector('.ai-reply-tone').value;
                
                // Create custom context for the prompt
                const customContext = conversationHistory.concat([{
                    text: `Custom request: ${customPrompt}`,
                    isOwn: true,
                    timestamp: Date.now()
                }]);

                const replies = await AIAssistantAPI.generateInboxReply(customContext, tone, 'custom');
                
                if (replies && Array.isArray(replies)) {
                    this.displayReplySuggestions(replyBox, replies, composerElement);
                    modal.close();
                }

            } catch (error) {
                console.error('Error generating custom reply:', error);
                AIAssistantAPI.showError(error, modal.modal);
            } finally {
                generateBtn.innerHTML = 'Generate';
                generateBtn.disabled = false;
            }
        });

        promptTextarea.focus();
    }

    showLoadingState(replyBox) {
        replyBox.querySelector('.ai-reply-loading').style.display = 'flex';
        replyBox.querySelector('.ai-reply-suggestions').style.display = 'none';
        replyBox.querySelector('.ai-reply-empty').style.display = 'none';
    }

    showEmptyState(replyBox) {
        replyBox.querySelector('.ai-reply-loading').style.display = 'none';
        replyBox.querySelector('.ai-reply-suggestions').style.display = 'none';
        replyBox.querySelector('.ai-reply-empty').style.display = 'block';
    }

    positionReplyBox(replyBox, composerElement) {
        const container = this.findMessageContainer(composerElement);
        if (container) {
            container.style.position = 'relative';
        }
    }

    findMessageContainer(composerElement) {
        return composerElement.closest('.msg-form, .msg-overlay-bubble-header, .compose-form') || 
               composerElement.parentElement;
    }

    monitorConversationChanges(composerElement) {
        const container = this.findMessageContainer(composerElement);
        if (!container) return;

        // Watch for new messages
        const observer = new MutationObserver((mutations) => {
            let hasNewMessages = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            (node.classList.contains('msg-s-message-list__event') || 
                             node.classList.contains('message-item'))) {
                            hasNewMessages = true;
                        }
                    });
                }
            });

            if (hasNewMessages) {
                const replyBox = container.querySelector('.ai-smart-reply-box');
                if (replyBox) {
                    setTimeout(() => {
                        this.generateReplySuggestions(composerElement, replyBox);
                    }, 1000);
                }
            }
        });

        observer.observe(container, { childList: true, subtree: true });
    }

    formatReplyType(type) {
        const typeMap = {
            brief: 'Brief',
            detailed: 'Detailed',
            question: 'Question',
            standard: 'Standard',
            custom: 'Custom'
        };
        return typeMap[type] || 'Standard';
    }

    formatSentiment(sentiment) {
        const sentimentMap = {
            positive: '😊 Positive',
            neutral: '😐 Neutral',
            interested: '🤔 Interested',
            professional: '💼 Professional'
        };
        return sentimentMap[sentiment] || '😐 Neutral';
    }

    showSuggestions(composerElement) {
        const replyBox = composerElement.parentElement?.querySelector('.ai-smart-reply-box');
        if (replyBox) {
            this.generateReplySuggestions(composerElement, replyBox);
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    cleanup() {
        this.activeReplies.forEach(reply => {
            if (reply.parentElement) {
                reply.remove();
            }
        });
        this.activeReplies.clear();

        document.querySelectorAll('.ai-smart-reply-box').forEach(box => box.remove());
        
        this.attachedComposers = new WeakSet();
    }
}

// Export for use by content script
window.AIInboxAssistant = AIInboxAssistant;
