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
        const suggestionsBtn = this.createSuggestionsButton();
        this.positionButton(suggestionsBtn, commentElement, 'suggestions');

        suggestionsBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.showCommentSuggestions(commentElement);
        });

        this.insertButton(suggestionsBtn, commentElement);
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
        button.innerHTML = '💡 Suggestions';
        button.type = 'button';
        button.title = 'Get AI comment suggestions';
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
                button.style.top = '8px';
                button.style.right = '8px';
            } else if (type === 'rewrite') {
                button.style.top = '8px';
                button.style.right = '90px';
            }
        }
    }

    insertButton(button, commentElement) {
        const container = commentElement.closest('.comments-comment-box, .comments-comment-texteditor') || commentElement.parentElement;
        if (container) container.appendChild(button);
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

        if (!postContent) {
            AIAssistantAPI.showError(new Error('Could not find post content to analyze'), commentElement.parentElement);
            return;
        }

        const suggestionsBtn = commentElement.parentElement?.querySelector('.ai-comment-suggestions-btn');
        if (suggestionsBtn) {
            suggestionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            suggestionsBtn.disabled = true;
        }

        try {
            const suggestionsResponse = await AIAssistantAPI.generateCommentSuggestions(
                postContent, 
                this.settings.globalTone, 
                authorName
            );

            let suggestions = [];
            if (suggestionsResponse) {
                if (Array.isArray(suggestionsResponse)) suggestions = suggestionsResponse;
                else if (Array.isArray(suggestionsResponse.suggestions)) suggestions = suggestionsResponse.suggestions;
            }

            if (suggestions.length > 0) {
                this.showSuggestionsDropdown(commentElement, suggestions);
                await AIAssistantAPI.updateStats('commentsAssisted');
            } else {
                AIAssistantAPI.showError(new Error('No suggestions returned'), commentElement.parentElement);
            }
        } catch (error) {
            console.error('Error generating comment suggestions:', error);
            AIAssistantAPI.showError(error, commentElement.parentElement);
        } finally {
            if (suggestionsBtn) {
                suggestionsBtn.innerHTML = '💡 Suggestions';
                suggestionsBtn.disabled = false;
            }
        }
    }

    showSuggestionsDropdown(commentElement, suggestions) {
        const existingDropdown = document.querySelector('.ai-comment-suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'ai-comment-suggestions-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 10000;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 4px;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            font-weight: 600;
            font-size: 14px;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `<span>💡 Comment Suggestions</span>
                            <button style="background:none;border:none;font-size:18px;cursor:pointer;color:#666;">&times;</button>`;
        header.querySelector('button').addEventListener('click', () => dropdown.remove());
        dropdown.appendChild(header);

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
        if (rewriteBtn) { rewriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; rewriteBtn.disabled = true; }

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
        AIAssistantDOM.setEditableText(commentElement, suggestionText);
        commentElement.focus();
        const dropdown = this.activeSuggestions.get(commentElement);
        if (dropdown) { dropdown.remove(); this.activeSuggestions.delete(commentElement); }
        AIAssistantAPI.showSuccess('Suggestion inserted!', commentElement.parentElement);
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
