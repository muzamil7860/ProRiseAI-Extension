// AI Reply Suggester Component
// Handles reply suggestions for existing comments

class AIReplySuggester {
    constructor(settings) {
        this.settings = settings;
        this.attachedReplyBoxes = new WeakSet();
        this.activeSuggestions = new Map();

        this.observeDynamicReplyBoxes();
    }

    observeDynamicReplyBoxes() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const replyBoxes = node.querySelectorAll('.comments-comment-texteditor, .comments-comment-box');
                        replyBoxes.forEach(box => this.attachToReplyBox(box));
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => this.scanForReplyBoxes(), 1000);
    }

    scanForReplyBoxes() {
        const allBoxes = document.querySelectorAll('.comments-comment-texteditor, .comments-comment-box');
        allBoxes.forEach(box => {
            if (!this.attachedReplyBoxes.has(box)) {
                this.attachToReplyBox(box);
            }
        });
    }

    async attachToReplyBox(replyElement) {
        if (this.attachedReplyBoxes.has(replyElement)) return;
        this.attachedReplyBoxes.add(replyElement);

        if (this.settings.commentSuggestionsEnabled) {
            this.addSuggestionsButton(replyElement);
        }
    }

    addSuggestionsButton(replyElement) {
        // Wait for the .ql-editor to be added
        setTimeout(() => {
            const container = replyElement.closest('.comments-comment-box, .comments-comment-texteditor');
            if (!container) return;

            // Check if this is a reply box by looking for "reply" in placeholder
            const editor = container.querySelector('.ql-editor[data-placeholder]');
            const placeholder = editor?.getAttribute('data-placeholder') || '';
            const isReply = placeholder.toLowerCase().includes('reply');

            console.log('[Reply Suggester] Placeholder:', placeholder, 'Is reply?', isReply);

            if (!isReply) {
                console.log('[Reply Suggester] ⚠️ Skipping main comment box');
                return;
            }

            // Remove any comment-enhancer buttons that shouldn't be here
            const wrongBtn = container.querySelector('.ai-comment-suggestions-btn');
            if (wrongBtn) {
                console.log('[Reply Suggester] ⚠️ Removing comment-enhancer button from reply box');
                wrongBtn.remove();
            }

            // Check if reply button already exists
            const existingBtn = container.querySelector('.ai-reply-suggestions-btn');
            if (existingBtn) return;

            console.log('[Reply Suggester] ✅ Adding button to REPLY box');

            const suggestionsBtn = this.createSuggestionsButton();
            this.positionButton(suggestionsBtn, replyElement);

            suggestionsBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                this.showReplySuggestions(replyElement);
            });

            this.insertButton(suggestionsBtn, replyElement);
        }, 300);
    }

    createSuggestionsButton() {
        const button = document.createElement('button');
        button.className = 'ai-reply-suggestions-btn';
        button.innerHTML = '💬 Reply to Comment';
        button.type = 'button';
        button.title = 'Get AI reply suggestions for this comment';
        button.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.4)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
        });
        
        return button;
    }

    positionButton(button, replyElement) {
        button.style.top = '8px';
        button.style.right = '8px';
    }

    insertButton(button, replyElement) {
        const container = replyElement.closest('.comments-comment-box, .comments-comment-texteditor');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(button);
        }
    }

    async showReplySuggestions(replyElement) {
        const suggestionsBtn = replyElement.parentElement?.querySelector('.ai-reply-suggestions-btn');
        
        // Extract context
        const postContent = this.extractPostContent(replyElement);
        const parentComment = this.extractParentComment(replyElement);
        const commentAuthor = this.extractCommentAuthor(replyElement);

        console.log('[Reply Suggester] Context extracted:', { postContent: postContent.substring(0, 100), parentComment: parentComment.substring(0, 100), commentAuthor });

        if (!parentComment || parentComment === 'the comment above') {
            AIAssistantAPI.showError(new Error('Could not find the comment text. Please try again.'), replyElement.parentElement);
            return;
        }

        // Get reply length setting from storage
        const result = await chrome.storage.sync.get(['replyLength']);
        const replyLength = result.replyLength || 'short';

        if (suggestionsBtn) {
            suggestionsBtn.innerHTML = '⏳ Generating...';
            suggestionsBtn.disabled = true;
        }

        // Show loading dropdown immediately
        this.showLoadingDropdown(replyElement);

        try {
            const suggestionsResponse = await AIAssistantAPI.generateReplySuggestions(
                postContent,
                parentComment,
                commentAuthor,
                this.settings.globalTone,
                replyLength
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
                this.showSuggestionsDropdown(replyElement, suggestions);
            } else {
                this.removeLoadingDropdown(replyElement);
                AIAssistantAPI.showError(new Error('No suggestions generated. Please try again.'), replyElement.parentElement);
            }
        } catch (error) {
            console.error('Error generating reply suggestions:', error);
            this.removeLoadingDropdown(replyElement);
            AIAssistantAPI.showError(error, replyElement.parentElement);
        } finally {
            if (suggestionsBtn) {
                suggestionsBtn.innerHTML = '💬 Reply to Comment';
                suggestionsBtn.disabled = false;
            }
        }
    }

    showLoadingDropdown(replyElement) {
        const existingDropdown = document.querySelector('.ai-reply-suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'ai-reply-suggestions-dropdown';
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
            margin-top: 4px;
            padding: 20px;
        `;

        dropdown.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="font-size: 14px; color: #666; font-weight: 500;">Generating smart replies...</div>
                <div style="font-size: 12px; color: #999;">Reading post and comment context</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        const container = replyElement.closest('.comments-comment-box, .comments-comment-texteditor');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(dropdown);
        }

        this.activeSuggestions.set(replyElement, dropdown);
    }

    removeLoadingDropdown(replyElement) {
        const dropdown = document.querySelector('.ai-reply-suggestions-dropdown');
        if (dropdown) dropdown.remove();
    }

    showSuggestionsDropdown(replyElement, suggestions) {
        const existingDropdown = document.querySelector('.ai-reply-suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'ai-reply-suggestions-dropdown';
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

        // Header - matching comment suggestions style
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
        header.innerHTML = `<span>💬 Reply Suggestions</span>
                            <button style="background:none;border:none;font-size:18px;cursor:pointer;color:#666;">&times;</button>`;
        header.querySelector('button').addEventListener('click', () => dropdown.remove());
        dropdown.appendChild(header);

        suggestions.forEach((suggestion, index) => {
            dropdown.appendChild(this.createSuggestionItem(suggestion, index, replyElement));
        });

        const container = replyElement.closest('.comments-comment-box, .comments-comment-texteditor');
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

        this.activeSuggestions.set(replyElement, dropdown);
    }

    createSuggestionItem(suggestion, index, replyElement) {
        const item = document.createElement('div');
        item.className = 'ai-suggestion-item';
        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
        const suggestionType = typeof suggestion === 'object' ? suggestion.type : 'reply';
        const suggestionLength = typeof suggestion === 'object' ? suggestion.length : 'short';

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
                    <button class="ai-suggestion-insert" style="background:#3B82F6;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">Insert</button>
                </div>
            </div>
        `;

        item.querySelector('.ai-suggestion-insert').addEventListener('click', e => {
            e.stopPropagation();
            this.insertSuggestion(replyElement, suggestionText);
        });

        item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f8f9fa');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = 'white');

        return item;
    }

    formatSuggestionType(type) {
        const typeMap = {
            'supportive': 'Supportive',
            'question': 'Question',
            'insight': 'Insight',
            'personal_experience': 'Personal',
            'congratulatory': 'Congratulations',
            'reply': 'Reply',
            'general': 'General'
        };
        return typeMap[type] || 'Reply';
    }

    insertSuggestion(replyElement, suggestionText) {
        // Find the specific editor within this reply box
        const editor = replyElement.querySelector('.ql-editor');
        if (editor) {
            AIAssistantDOM.setEditableText(editor, suggestionText);
            editor.focus();
        } else {
            // Fallback to the reply element itself
            AIAssistantDOM.setEditableText(replyElement, suggestionText);
            replyElement.focus();
        }
        
        const dropdown = this.activeSuggestions.get(replyElement);
        if (dropdown) {
            dropdown.remove();
            this.activeSuggestions.delete(replyElement);
        }
        AIAssistantAPI.showSuccess('Reply inserted!', replyElement.parentElement);
    }

    extractPostContent(replyElement) {
        // Strategy 1: Walk UP from reply element to find parent comment, then parent post (most reliable for feed & single page)
        const commentItem = replyElement.closest('.comments-comment-item');
        if (commentItem) {
            // Now find the post that contains this comment - works for both feed and single post page
            const postContainer = commentItem.closest('article, .feed-shared-update-v2, [data-urn], main');
            if (postContainer) {
                const postTextSelectors = [
                    '.feed-shared-update-v2__description',
                    '.feed-shared-text',
                    '.update-components-text__text-view',
                    '.feed-shared-inline-show-more-text',
                    '.break-words',
                    '[dir="ltr"].break-words'
                ];

                for (const selector of postTextSelectors) {
                    const postTextEl = postContainer.querySelector(selector);
                    // Make sure it's NOT inside a comment and has actual content
                    if (postTextEl && !postTextEl.closest('.comments-comment-item, .comments-comments-list')) {
                        const text = postTextEl.innerText.trim();
                        if (text && text.length > 20 && !text.startsWith('•')) {
                            console.log('[Reply Suggester] Found post via DOM traversal:', text.substring(0, 100));
                            return text.substring(0, 500);
                        }
                    }
                }
            }
        }

        // Strategy 2: Single post page - try detail view or main content area
        const detailView = document.querySelector('.scaffold-layout__detail, .artdeco-modal__content, main.scaffold-layout__main');
        if (detailView) {
            const postTextSelectors = [
                '.feed-shared-update-v2__description',
                '.feed-shared-text',
                '.update-components-text__text-view',
                '.feed-shared-inline-show-more-text',
                '.break-words'
            ];

            for (const selector of postTextSelectors) {
                const postTextEl = detailView.querySelector(selector);
                if (postTextEl && !postTextEl.closest('.comments-comment-item, .comments-comments-list')) {
                    const text = postTextEl.innerText.trim();
                    if (text && text.length > 20 && !text.startsWith('•')) {
                        console.log('[Reply Suggester] Found post via detail view:', text.substring(0, 100));
                        return text.substring(0, 500);
                    }
                }
            }
        }

        // Strategy 3: Feed view - search for the most visible/active post in viewport
        const allPosts = document.querySelectorAll('article.feed-shared-update-v2, [data-urn*="activity"]');
        for (const post of allPosts) {
            const rect = post.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.top <= window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                const postTextSelectors = [
                    '.feed-shared-update-v2__description',
                    '.feed-shared-text',
                    '.update-components-text__text-view',
                    '.break-words'
                ];

                for (const selector of postTextSelectors) {
                    const postTextEl = post.querySelector(selector);
                    if (postTextEl && !postTextEl.closest('.comments-comment-item, .comments-comments-list')) {
                        const text = postTextEl.innerText.trim();
                        if (text && text.length > 20 && !text.startsWith('•')) {
                            console.log('[Reply Suggester] Found post via viewport:', text.substring(0, 100));
                            return text.substring(0, 500);
                        }
                    }
                }
            }
        }

        console.log('[Reply Suggester] Could not find post content');
        return '';
    }

    extractParentComment(replyElement) {
        // Try multiple approaches to find the parent comment
        
        // Approach 1: Look for the closest comment container
        let commentContainer = replyElement.closest('.comments-comment-item');
        
        if (commentContainer) {
            // Find the comment text within this container, excluding the reply box itself
            const commentBody = commentContainer.querySelector('.comments-comment-item-content-body');
            if (commentBody) {
                // Get all text but exclude the reply form
                const textNodes = [];
                const walker = document.createTreeWalker(commentBody, NodeFilter.SHOW_TEXT, null, false);
                let node;
                while (node = walker.nextNode()) {
                    // Skip if inside the reply form
                    if (!node.parentElement.closest('.comments-comment-texteditor')) {
                        textNodes.push(node.textContent);
                    }
                }
                const commentText = textNodes.join(' ').trim();
                if (commentText) return commentText.substring(0, 300);
            }
        }
        
        // Approach 2: Look for any visible comment text nearby
        const nearbyComments = replyElement.closest('article')?.querySelectorAll('.comments-comment-item__main-content, .attributed-text-segment-list__content');
        if (nearbyComments && nearbyComments.length > 0) {
            // Get the last comment before the reply box
            for (let i = nearbyComments.length - 1; i >= 0; i--) {
                const text = nearbyComments[i].innerText.trim();
                if (text && text.length > 10) {
                    return text.substring(0, 300);
                }
            }
        }

        return 'the comment above';
    }

    extractCommentAuthor(replyElement) {
        const commentContainer = replyElement.closest('.comments-comment-item');
        if (!commentContainer) {
            console.log('[Reply Suggester] No comment container found');
            return '';
        }

        // Try multiple selectors for author name - LinkedIn updates these often
        const authorSelectors = [
            '.comments-post-meta__name-text .visually-hidden',
            '.comments-post-meta__name-text',
            '.comments-post-meta__profile-link span',
            'a.app-aware-link span[aria-hidden="true"]',
            '.update-components-actor__name',
            '.comments-comment-item__main-content a span[aria-hidden="true"]',
            '.comments-post-meta a span[aria-hidden="true"]',
            '[data-anonymize="person-name"]',
            '.comments-post-meta span[dir="ltr"]'
        ];

        for (const selector of authorSelectors) {
            const authorEl = commentContainer.querySelector(selector);
            if (authorEl && authorEl.textContent) {
                const fullName = authorEl.textContent.trim();
                if (fullName && fullName.length > 0 && fullName.length < 50 && !fullName.includes('•')) {
                    console.log('[Reply Suggester] Found author via selector:', selector, fullName);
                    return fullName.split(' ')[0]; // First name only
                }
            }
        }

        // Fallback: try to find ANY link with a person's name in the comment header
        const headerLinks = commentContainer.querySelectorAll('a[href*="/in/"]');
        for (const link of headerLinks) {
            const spans = link.querySelectorAll('span');
            for (const span of spans) {
                const text = span.textContent.trim();
                if (text && text.length > 1 && text.length < 50 && !text.includes('•') && !text.includes('following')) {
                    console.log('[Reply Suggester] Found author via link:', text);
                    return text.split(' ')[0];
                }
            }
        }

        console.log('[Reply Suggester] Could not find author name');
        return '';
    }
}

// Initialize when DOM is ready
if (typeof AIAssistantAPI !== 'undefined' && typeof AIAssistantDOM !== 'undefined') {
    window.aiReplySuggester = null;
    
    AIAssistantStorage.getSettings().then(settings => {
        if (settings.commentSuggestionsEnabled) {
            window.aiReplySuggester = new AIReplySuggester(settings);
            console.log('AI Reply Suggester initialized');
        }
    });
}
