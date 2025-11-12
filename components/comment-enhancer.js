// AI Comment Enhancer Component
// Handles comment suggestions and rewriting functionality

class AICommentEnhancer {
    constructor(settings) {
        this.settings = settings;
        this.attachedCommentBoxes = new WeakSet();
        this.activeSuggestions = new Map();

        this.observeDynamicEditors();
    }

    observeDynamicEditors() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const editors = node.querySelectorAll('.comments-comment-texteditor, .comments-comment-box');
                        editors.forEach(editor => this.attachToCommentBox(editor));
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    async attachToCommentBox(commentElement) {
        if (this.attachedCommentBoxes.has(commentElement)) return;
        this.attachedCommentBoxes.add(commentElement);

        if (this.settings.commentSuggestionsEnabled) this.addSuggestionsButton(commentElement);
        if (this.settings.commentRewriterEnabled) this.addRewriteButton(commentElement);
        this.monitorTextChanges(commentElement);
    }

    addSuggestionsButton(commentElement) {
        // Wait a bit for the .ql-editor to be added
        setTimeout(() => {
            const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor');
            if (!container) return;

            // Check if this is a reply box by looking for "reply" in placeholder
            const editor = container.querySelector('.ql-editor[data-placeholder]');
            const placeholder = editor?.getAttribute('data-placeholder') || '';
            const isReply = placeholder.toLowerCase().includes('reply');

            console.log('[Comment Enhancer] Placeholder:', placeholder, 'Is reply?', isReply);

            if (isReply) {
                console.log('[Comment Enhancer] ⚠️ Skipping reply box');
                return;
            }

            // Check if button already exists inside the container or immediately after it (we insert below)
            const nextSibling = container.nextElementSibling;
            const existingBtn = container.querySelector('.ai-comment-suggestions-btn') || (nextSibling && nextSibling.classList && nextSibling.classList.contains('ai-comment-suggestions-btn') ? nextSibling : null);
            if (existingBtn) return;

            console.log('[Comment Enhancer] ✅ Adding button to MAIN COMMENT box');

            const suggestionsBtn = this.createSuggestionsButton();
            this.positionButton(suggestionsBtn, commentElement, 'suggestions');

            suggestionsBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                this.showCommentSuggestions(commentElement);
            });

            this.insertButton(suggestionsBtn, commentElement);
        }, 200);
    }

    addRewriteButton(commentElement) {
        const rewriteBtn = this.createRewriteButton();
        this.positionButton(rewriteBtn, commentElement, 'rewrite');
        rewriteBtn.style.display = 'none';

        rewriteBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.rewriteComment(commentElement);
        });

        this.insertButton(rewriteBtn, commentElement);
    }

    createSuggestionsButton() {
        const button = document.createElement('button');
        button.className = 'ai-comment-suggestions-btn';
        button.innerHTML = '💡 Comment Ideas';
        button.type = 'button';
        button.title = 'Get AI comment suggestions for this post';
        button.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        this.addButtonHoverEffects(button, '#22C55E');
        return button;
    }

    createRewriteButton() {
        const button = document.createElement('button');
        button.className = 'ai-comment-rewrite-btn';
        button.innerHTML = '✨ Rewrite';
        button.type = 'button';
        button.title = 'Rewrite with AI';
        button.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        this.addButtonHoverEffects(button, '#8B5CF6');
        return button;
    }

    addButtonHoverEffects(button, baseColor) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = `0 4px 10px ${baseColor}40`;
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = `0 2px 6px ${baseColor}30`;
        });
    }

    positionButton(button, commentElement, type) {
        const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor');
        if (container) {
            container.style.position = 'relative';
            if (type === 'suggestions') {
                // mark suggestion button to be inserted below the input (outside the box)
                button.dataset.position = 'below';
                // reset absolute positioning so it flows normally when inserted after container
                button.style.position = 'relative';
                button.style.top = 'auto';
                button.style.right = 'auto';
                button.style.marginTop = '8px';
                button.style.marginLeft = '0';
            } else if (type === 'rewrite') {
                button.style.top = '8px';
                button.style.right = '90px';
            }
        }
    }

    insertButton(button, commentElement) {
        const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor') || commentElement.parentElement;
        if (!container) return;
        // If the button is marked to sit below the input, insert it after the container so it doesn't overlap the composer controls
        if (button.dataset && button.dataset.position === 'below') {
            const parent = container.parentNode || container;
            if (parent && parent.insertBefore) {
                parent.insertBefore(button, container.nextSibling);
                // align right so it appears below the input on the right side
                button.style.float = 'right';
                button.style.marginTop = button.style.marginTop || '8px';
                button.style.marginRight = '8px';
            } else {
                container.appendChild(button);
            }
        } else {
            container.appendChild(button);
        }
    }

    monitorTextChanges(commentElement) {
        let timeout;
        const handler = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const text = AIAssistantDOM.getEditableText(commentElement);
                const rewriteBtn = commentElement.parentElement?.querySelector('.ai-comment-rewrite-btn');
                if (rewriteBtn) rewriteBtn.style.display = text.trim().length > 10 ? 'flex' : 'none';
            }, 300);
        };
        commentElement.addEventListener('input', handler);
        commentElement.addEventListener('keyup', handler);
    }

    async showCommentSuggestions(commentElement) {
        const postContent = this.extractPostContent(commentElement);
        const authorName = this.extractAuthorName(commentElement);
        const existingComments = this.extractExistingComments(commentElement);

        if (!postContent) {
            AIAssistantAPI.showError(new Error('Could not find post content to analyze'), commentElement.parentElement);
            return;
        }

        // Get comment length setting from storage
        const result = await chrome.storage.sync.get(['commentLength']);
        const commentLength = result.commentLength || 'medium';

        const suggestionsBtn = commentElement.parentElement?.querySelector('.ai-comment-suggestions-btn');
        if (suggestionsBtn) {
            suggestionsBtn.innerHTML = '<span class="ai-post-spinner"></span> Loading...';
            suggestionsBtn.disabled = true;
        }

    // Show dropdown IMMEDIATELY with loading state (indicator inside the dropdown)
    this.showLoadingDropdown(commentElement);

        try {
            const suggestionsResponse = await AIAssistantAPI.generateCommentSuggestions(
                postContent, 
                this.settings.globalTone, 
                authorName,
                existingComments,
                commentLength
            );

            let suggestions = [];
            if (suggestionsResponse) {
                if (Array.isArray(suggestionsResponse)) {
                    suggestions = suggestionsResponse;
                } else if (suggestionsResponse.suggestions && Array.isArray(suggestionsResponse.suggestions)) {
                    suggestions = suggestionsResponse.suggestions;
                }
            }

            if (suggestions.length > 0) {
                suggestions = this.validateSuggestions(suggestions, authorName);
                this.showSuggestionsDropdown(commentElement, suggestions);
                await AIAssistantAPI.updateStats('commentsAssisted');
            } else {
                this.removeLoadingDropdown(commentElement);
                try { AIAssistantDOM.hideWritingIndicator(commentElement.parentElement || commentElement); } catch (e) {}
                AIAssistantAPI.showError(new Error('No suggestions generated. Please try again.'), commentElement.parentElement);
            }
        } catch (error) {
            console.error('Error generating comment suggestions:', error);
            this.removeLoadingDropdown(commentElement);
            try { AIAssistantDOM.hideWritingIndicator(commentElement.parentElement || commentElement); } catch (e) {}
            AIAssistantAPI.showError(error, commentElement.parentElement);
        } finally {
            if (suggestionsBtn) {
                suggestionsBtn.innerHTML = '💡 Comment Ideas';
                suggestionsBtn.disabled = false;
                try { AIAssistantDOM.hideWritingIndicator(commentElement.parentElement || commentElement); } catch (e) {}
            }
        }
    }

    showSuggestionsDropdown(commentElement, suggestions) {
        const existingDropdown = document.querySelector('.ai-comment-suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        // reuse panel branding classes so it shares visual style with the post creator
        dropdown.className = 'ai-comment-suggestions-dropdown ai-post-panel modern';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10000;
            max-height: 60vh;
            overflow-y: auto;
            margin-top: 6px;
            box-sizing: border-box;
        `;

        // Branded header with handle
        const header = document.createElement('div');
        header.className = 'ai-post-header';
        header.innerHTML = `
            <div class="ai-post-title">
                <div class="ai-title-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>
                </div>
                <div class="ai-title-content">
                    <span class="ai-title-main">AI Comment Suggestions</span>
                    <span class="ai-title-sub">Powered by Muzamil Attiq</span>
                </div>
            </div>
            <button class="ai-post-close" title="Close"> 
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
            </button>
        `;
        // insert a visual handle above the header
        const handle = document.createElement('div');
        handle.className = 'ai-panel-handle';
        dropdown.appendChild(handle);
        dropdown.appendChild(header);
        header.querySelector('.ai-post-close').addEventListener('click', () => dropdown.remove());

        suggestions.forEach((suggestion, index) => {
            dropdown.appendChild(this.createSuggestionItem(suggestion, index, commentElement));
        });

        const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(dropdown);
        }

        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);

        this.activeSuggestions.set(commentElement, dropdown);
    }

    createSuggestionItem(suggestion, index, commentElement) {
        const item = document.createElement('div');
        item.className = 'ai-suggestion-item';
        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
        const suggestionType = typeof suggestion === 'object' ? suggestion.type : 'general';
        const suggestionLength = typeof suggestion === 'object' ? suggestion.length : 'medium';

        item.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background-color 0.2s ease;
            position: relative;
        `;

        item.innerHTML = `
            <div style="font-size:14px;line-height:1.4;margin-bottom:6px;">${suggestionText}</div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="background:#e3f2fd;color:#1976d2;padding:2px 6px;border-radius:12px;font-size:11px;font-weight:500;">
                    ${this.formatSuggestionType(suggestionType)}
                </span>
                <span style="background:#f3e5f5;color:#7b1fa2;padding:2px 6px;border-radius:12px;font-size:11px;font-weight:500;">
                    ${suggestionLength}
                </span>
                <div style="margin-left:auto;display:flex;gap:4px;">
                    <button class="ai-suggestion-insert" style="background:#22c55e;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">Insert</button>
                    <button class="ai-suggestion-rewrite" style="background:#8b5cf6;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">Rewrite</button>
                </div>
            </div>
        `;

        item.querySelector('.ai-suggestion-insert').addEventListener('click', e => {
            e.stopPropagation();
            this.insertSuggestion(commentElement, suggestionText);
        });

        item.querySelector('.ai-suggestion-rewrite').addEventListener('click', e => {
            e.stopPropagation();
            this.rewriteSuggestion(commentElement, suggestionText);
        });

        item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f8f9fa');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = 'white');

        return item;
    }

    async rewriteComment(commentElement) {
        const currentText = AIAssistantDOM.getEditableText(commentElement);
        if (!currentText.trim()) {
            AIAssistantAPI.showError(new Error('Please enter some text to rewrite'), commentElement.parentElement);
            return;
        }

        const rewriteBtn = commentElement.parentElement?.querySelector('.ai-comment-rewrite-btn');
    if (rewriteBtn) { rewriteBtn.innerHTML = '<span class="ai-post-spinner"></span>'; rewriteBtn.disabled = true; }

        try {
            const rewrittenContent = await AIAssistantAPI.rewriteText(currentText, this.settings.globalTone, 'Improve for LinkedIn comment engagement');
            if (rewrittenContent?.rewritten) {
                AIAssistantDOM.setEditableText(commentElement, rewrittenContent.rewritten);
                AIAssistantAPI.showSuccess('Comment rewritten successfully!', commentElement.parentElement);
            }
        } catch (error) {
            console.error('Error rewriting comment:', error);
            AIAssistantAPI.showError(error, commentElement.parentElement);
        } finally {
            if (rewriteBtn) { rewriteBtn.innerHTML = '✨ Rewrite'; rewriteBtn.disabled = false; }
        }
    }

    async rewriteSuggestion(commentElement, suggestionText) {
        try {
            const rewrittenContent = await AIAssistantAPI.rewriteText(suggestionText, this.settings.globalTone, 'Make it more personalized and engaging');
            if (rewrittenContent?.rewritten) {
                AIAssistantDOM.setEditableText(commentElement, rewrittenContent.rewritten);
                const dropdown = this.activeSuggestions.get(commentElement);
                if (dropdown) { dropdown.remove(); this.activeSuggestions.delete(commentElement); }
                AIAssistantAPI.showSuccess('Suggestion rewritten and inserted!', commentElement.parentElement);
            }
        } catch (error) {
            console.error('Error rewriting suggestion:', error);
            AIAssistantAPI.showError(error, commentElement.parentElement);
        }
    }

    insertSuggestion(commentElement, suggestionText) {
        // Find the specific editor within this comment box
        const editor = commentElement.querySelector('.ql-editor');
        if (editor) {
            AIAssistantDOM.setEditableText(editor, suggestionText);
            editor.focus();
        } else {
            // Fallback to the comment element itself
            AIAssistantDOM.setEditableText(commentElement, suggestionText);
            commentElement.focus();
        }
        
        const dropdown = this.activeSuggestions.get(commentElement);
        if (dropdown) { dropdown.remove(); this.activeSuggestions.delete(commentElement); }
        AIAssistantAPI.showSuccess('Comment inserted!', commentElement.parentElement);
    }

    extractPostContent(commentElement) {
        const postContainer = commentElement.closest('article, .feed-shared-update-v2, [data-urn]');
        if (!postContainer) return '';
        const selectors = ['.feed-shared-text','.feed-shared-update-v2__description','.break-words','[data-test-id="main-feed-activity-card"] .break-words'];
        for (const sel of selectors) {
            const el = postContainer.querySelector(sel);
            if (el) return el.textContent.trim();
        }
        return '';
    }

    extractAuthorName(commentElement) {
        const postContainer = commentElement.closest('article, .feed-shared-update-v2, [data-urn]');
        if (!postContainer) return '';
        const selectors = ['.feed-shared-actor__name','.update-components-actor__name','.feed-shared-actor .visually-hidden'];
        for (const sel of selectors) {
            const el = postContainer.querySelector(sel);
            if (el) return el.textContent.trim();
        }
        return '';
    }

    extractExistingComments(commentElement) {
        const postContainer = commentElement.closest('article, .feed-shared-update-v2, [data-urn]');
        if (!postContainer) return [];
        
        const comments = [];
        const commentSelectors = [
            '.comments-comment-item__main-content',
            '.comments-comment-item .comments-comment-item-content-body',
            '.comment-item__content'
        ];
        
        for (const selector of commentSelectors) {
            const commentElements = postContainer.querySelectorAll(selector);
            commentElements.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.length > 10 && text.length < 300) {
                    comments.push(text);
                }
            });
            if (comments.length > 0) break;
        }
        
        return comments.slice(0, 5);
    }

    showLoadingDropdown(commentElement) {
        const existingDropdown = document.querySelector('.ai-comment-suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'ai-comment-suggestions-dropdown ai-post-panel modern ai-loading-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10000;
            margin-top: 6px;
            max-height: 40vh;
            overflow: hidden;
            box-sizing: border-box;
        `;

        // branded loading header + handle
        const handle = document.createElement('div');
        handle.className = 'ai-panel-handle';
        dropdown.appendChild(handle);

        const header = document.createElement('div');
        header.className = 'ai-post-header';
        header.innerHTML = `
            <div class="ai-post-title">
                <div class="ai-title-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>
                </div>
                <div class="ai-title-content">
                    <span class="ai-title-main">AI Comment Suggestions</span>
                    <span class="ai-title-sub">Generating...</span>
                </div>
            </div>
        `;
        dropdown.appendChild(header);

    const loadingBody = document.createElement('div');
    loadingBody.className = 'ai-loading-body';
    loadingBody.style.cssText = 'padding:24px; display:flex; flex-direction:column; align-items:center; gap:12px; overflow:visible;';
        // Message text
        const msg = document.createElement('div');
        msg.style.cssText = 'font-size:14px;color:#666;font-weight:600;';
        msg.textContent = 'Generating smart comments...';
        loadingBody.appendChild(msg);

        // Show the branded writing indicator inside the loading body
        try {
            AIAssistantDOM.showWritingIndicator(loadingBody, { inline: true });
        } catch (e) {
            // fallback: add basic spinner
            const fallback = document.createElement('div');
            fallback.style.cssText = 'width:36px;height:36px;border:4px solid #f3f3f3;border-top-color:#22c55e;border-radius:50%;animation:spin 0.9s linear infinite;margin-bottom:6px;';
            loadingBody.insertBefore(fallback, msg);
        }

        dropdown.appendChild(loadingBody);

        const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(dropdown);
        }

        this.activeSuggestions.set(commentElement, dropdown);
    }

    removeLoadingDropdown(commentElement) {
        const dropdown = this.activeSuggestions.get(commentElement);
        if (dropdown && dropdown.classList.contains('ai-loading-dropdown')) {
            try { AIAssistantDOM.hideWritingIndicator(dropdown); } catch (e) {}
            dropdown.remove();
            this.activeSuggestions.delete(commentElement);
        }
    }

    validateSuggestions(suggestions, authorName) {
        return suggestions.map(suggestion => {
            let text = typeof suggestion === 'string' ? suggestion : suggestion.text;
            const wordCount = text.trim().split(/\s+/).length;
            
            // If too long, truncate to 15 words
            if (wordCount > 15) {
                const words = text.trim().split(/\s+/).slice(0, 15);
                text = words.join(' ');
                if (!text.endsWith('!') && !text.endsWith('.') && !text.endsWith('?')) {
                    text += '!';
                }
            }
            
            // If author name provided but not mentioned, try to add it naturally
            if (authorName && !text.toLowerCase().includes(authorName.toLowerCase().split(' ')[0].toLowerCase())) {
                const firstName = authorName.split(' ')[0];
                // Add author mention at the start if the comment is supportive or congratulatory
                if (wordCount < 12 && (text.includes('Great') || text.includes('Love') || text.includes('Congrats'))) {
                    text = text.replace(/^(Great|Love|Congrats)/, `$1, ${firstName}`);
                }
            }
            
            return {
                text: text,
                type: typeof suggestion === 'object' ? suggestion.type : 'general',
                length: 'short'
            };
        }).filter(s => s.text.split(/\s+/).length >= 3); // Min 3 words
    }

    formatSuggestionType(type) {
        const map = { supportive: '👍 Supportive', question: '❓ Question', insight: '💡 Insight', personal_experience: '📝 Experience', congratulatory: '🎉 Congrats' };
        return map[type] || '💬 Comment';
    }

    showSuggestions(commentElement) { this.showCommentSuggestions(commentElement); }
    updateSettings(newSettings) { this.settings = { ...this.settings, ...newSettings }; }

    cleanup() {
        this.activeSuggestions.forEach(dropdown => { if(dropdown.parentElement) dropdown.remove(); });
        this.activeSuggestions.clear();
        document.querySelectorAll('.ai-comment-suggestions-btn, .ai-comment-rewrite-btn').forEach(btn => btn.remove());
        this.attachedCommentBoxes = new WeakSet();
    }
}

// Export for use by content script
window.AICommentEnhancer = AICommentEnhancer;
