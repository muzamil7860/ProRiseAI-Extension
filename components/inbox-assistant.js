// AI Inbox Assistant Component - Advanced Version
// Ultra-minimal prompts (1-5 tokens) with smart conversation analysis

class AIInboxAssistant {
    constructor(settings) {
        this.settings = settings;
        this.attachedComposers = new WeakMap();
        this.activeBoxes = new WeakSet();
        this.panelForComposer = new WeakMap();
    }

    // Exposed entry used by keyboard shortcut routing
    showSuggestions(composerElement) {
        this.showAssistantPanel(composerElement);
    }

    async attachToMessageComposer(composerElement) {
        if (this.attachedComposers.has(composerElement)) {
            return;
        }

        const existingBox = this.findExistingBox(composerElement);
        if (existingBox) {
            return;
        }

        this.attachedComposers.set(composerElement, true);
        this.addSmartReplyButton(composerElement);
    }

    findExistingBox(composerElement) {
        // Prefer the panel mapped to this composer (anchored panels live on document.body)
        const mapped = this.panelForComposer.get(composerElement);
        if (mapped && mapped.parentElement) return mapped;

        // Fallback: search for a nearby inline panel inside composer container
        const container = this.findMessageContainer(composerElement);
        return container?.querySelector('.ai-inbox-assistant-box');
    }

    addSmartReplyButton(composerElement) {
        const button = document.createElement('button');
        button.className = 'ai-inbox-assist-btn';
        // Use branded SVG icon similar to post creator
    button.innerHTML = `
            <div class="ai-btn-content" style="display:flex;align-items:center;gap:8px">
                <div class="ai-btn-icon-wrapper" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.06);border-radius:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2A10 10 0 1 0 12 22 10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92C13.45 11.9 13 12.5 13 14h-2v-.5c0-1 .45-1.8 1.17-2.5l1.24-1.26A1.99 1.99 0 0 0 12 6a2 2 0 0 0-2 2H8a4 4 0 0 1 4-4c1.1 0 2 .9 2 2 0 .7-.35 1.2-.93 1.75z"/>
                    </svg>
                </div>
                <span class="ai-btn-text">AI Assist</span>
            </div>`;
        button.title = 'Get AI reply suggestions';

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAssistantPanel(composerElement);
        });

        const container = this.findMessageContainer(composerElement);
        if (container && !container.querySelector('.ai-inbox-assist-btn')) {
            container.style.position = 'relative';
            container.appendChild(button);
        }
    }

    async showAssistantPanel(composerElement) {
        const existingPanel = this.findExistingBox(composerElement);
        if (existingPanel) {
            // toggle behavior: remove if already shown
            existingPanel.remove();
            // cleanup mapping
            this.panelForComposer.delete(composerElement);
            return;
        }

        const panel = this.createAssistantPanel(composerElement);

        // Append anchored panel to body for consistent z-index and positioning
        document.body.appendChild(panel);
        this.activeBoxes.add(panel);
        this.panelForComposer.set(composerElement, panel);

        // Position anchored (right by default; will flip if not enough space)
        this.positionAnchoredPanel(panel, composerElement);

        // Reposition on resize/scroll
        const updatePos = () => this.positionAnchoredPanel(panel, composerElement);
        window.addEventListener('resize', updatePos, { passive: true });
        window.addEventListener('scroll', updatePos, { passive: true });
        panel._cleanup = () => {
            window.removeEventListener('resize', updatePos);
            window.removeEventListener('scroll', updatePos);
        };

        // Close on panel close handled by createAssistantPanel; generate suggestions
        await this.generateSuggestions(composerElement, panel);
    }

    createAssistantPanel(composerElement) {
        const panel = document.createElement('div');
        panel.className = 'ai-inbox-assistant-box';
        
        panel.innerHTML = `
            <div class="ai-post-header modern" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(0,0,0,0.06);background:linear-gradient(90deg,#0077B5,#00A0DC);color:white">
                <div style="display:flex;align-items:center;gap:8px">
                    <div class="ai-title-main" style="font-weight:700;font-size:14px">AI Reply Suggestions</div>
                    <div class="ai-title-sub" style="font-size:12px;opacity:0.9;">Contextual replies for messaging</div>
                </div>
                <button class="ai-post-close ai-inbox-close" aria-label="Close" style="background:transparent;border:none;color:white;font-size:18px;cursor:pointer">×</button>
            </div>
            
            <div class="ai-inbox-content">
                <div class="ai-inbox-loading">
                    <div class="ai-inbox-writing-holder" style="margin:0 auto 8px;"></div>
                    <span>Analyzing conversation...</span>
                </div>

                <div class="ai-inbox-suggestions" style="display: none;">
                    <div class="ai-inbox-context"></div>

                    <!-- Tabs for reply variants -->
                    <div class="ai-inbox-tabs" style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap"></div>

                    <div class="ai-inbox-replies"></div>
                </div>
            </div>
        `;

        panel.querySelector('.ai-inbox-close').addEventListener('click', () => {
            panel.remove();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeBoxes.has(panel)) {
                panel.remove();
            }
        });

        return panel;
    }

    async generateSuggestions(composerElement, panel) {
        const conversation = this.extractFullConversation(composerElement);
        
        if (!conversation.messages.length) {
            this.showEmptyState(panel);
            return;
        }
        const loadingHolder = panel.querySelector('.ai-inbox-writing-holder');
        try {
            // show branded writing indicator inside loading holder
            try { AIAssistantDOM.showWritingIndicator(loadingHolder, { inline: true }); } catch (e) {}

            // Primary approach: request all reply variants in a single full-generator call
            let replies = [];
            try {
                const full = await AIAssistantAPI.generateInboxReply(conversation.messages, 'all', 'general');

                // Possible shapes: array, { replies: [...] }, { replies: { items: [...] } }, stringified JSON
                if (!full) {
                    replies = [];
                } else if (Array.isArray(full)) {
                    replies = full.map(r => this.normalizeReplyShape(r));
                } else if (Array.isArray(full.replies)) {
                    replies = full.replies.map(r => this.normalizeReplyShape(r));
                } else if (full.replies && Array.isArray(full.replies.items)) {
                    replies = full.replies.items.map(r => this.normalizeReplyShape(r));
                } else if (typeof full === 'string') {
                    // attempt to parse JSON if returned as string
                    try {
                        const parsed = JSON.parse(full);
                        if (Array.isArray(parsed)) replies = parsed.map(r => this.normalizeReplyShape(r));
                        else if (parsed.replies && Array.isArray(parsed.replies)) replies = parsed.replies.map(r => this.normalizeReplyShape(r));
                    } catch (e) {
                        // not JSON, treat string as single reply
                        replies = [{ tone: 'Suggested', icon: '', text: full, toneId: 'suggested' }];
                    }
                }
            } catch (e) {
                console.warn('Primary full generator failed, will fallback to per-tone generator', e);
                replies = [];
            }

            // If we couldn't parse/generate replies, fall back to per-tone generator (best-effort)
            if (!replies || replies.length === 0) {
                replies = await this.generateMultiToneReplies(conversation);
            }

            // Ensure we have up to desired number of suggestions (5). Fill from per-tone generator if needed.
            const DESIRED = 5;
            if (replies.length < DESIRED) {
                const more = await this.generateMultiToneReplies(conversation);
                for (const m of more) {
                    if (replies.length >= DESIRED) break;
                    // avoid exact duplicates
                    if (!replies.some(r => (r.text || '').trim() === (m.text || '').trim())) {
                        replies.push(m);
                    }
                }
            }

            if (!replies || replies.length === 0) {
                throw new Error('No suggestions generated. Please try again.');
            }

            // hide indicator before rendering
            try { AIAssistantDOM.hideWritingIndicator(loadingHolder); } catch (e) {}

            this.displaySuggestions(panel, replies, conversation, composerElement);
            await AIAssistantAPI.updateStats('messagesReplied');
        } catch (error) {
            console.error('Inbox assistant error:', error);
            const loadingEl = panel.querySelector('.ai-inbox-loading');
            const contentEl = panel.querySelector('.ai-inbox-content');
            
            // hide indicator
            try { AIAssistantDOM.hideWritingIndicator(panel.querySelector('.ai-inbox-writing-holder')); } catch (e) {}

            if (loadingEl) loadingEl.style.display = 'none';
            
            // Show user-friendly error message
            const errorMsg = error.message.includes('connection') || error.message.includes('Receiving end') 
                ? 'Extension connection lost. Please reload this page and try again.'
                : error.message;
            
            contentEl.innerHTML = `
                <div class="ai-inbox-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${errorMsg}</p>
                    <button class="ai-btn ai-btn-primary" onclick="window.location.reload()">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    // Normalize different reply shapes into our UI-friendly { tone, icon, text, toneId }
    normalizeReplyShape(raw) {
        if (!raw) return { tone: 'Suggested', icon: '', text: '', toneId: 'suggested' };

        if (typeof raw === 'string') return { tone: 'Suggested', icon: '', text: raw, toneId: 'suggested' };

        // If object with known keys
        const text = raw.text || raw.reply || raw.content || raw.message || raw.summary || '';
        const tone = raw.type || raw.tone || raw.label || 'Suggested';
        const toneId = raw.type || raw.toneId || raw.tone || (typeof tone === 'string' ? tone.toLowerCase() : 'suggested');
        const icon = raw.icon || '';
        return { tone, icon, text, toneId };
    }

    positionAnchoredPanel(panel, composerElement) {
        const panelWidth = 420;
        const margin = 12;
        const viewportW = window.innerWidth;
        let rect = { left: margin, right: viewportW - margin };
        try {
            const elRect = composerElement.getBoundingClientRect();
            rect = elRect;
        } catch (e) {}

        // prefer right side anchor
        let anchor = 'right';
        if (rect.right + panelWidth + margin > viewportW && rect.left > panelWidth + margin) {
            anchor = 'left';
        }

        panel.classList.add('ai-post-panel', 'modern', 'ai-anchored');
        panel.classList.remove('ai-complete');

        if (anchor === 'right') {
            panel.style.right = `${margin}px`;
            panel.style.left = 'auto';
            panel.style.top = `${10}px`;
            panel.style.bottom = `${10}px`;
            panel.style.width = `${panelWidth}px`;
            panel.dataset.anchor = 'right';
            panel.classList.remove('ai-anchored-left');
        } else {
            panel.style.left = `${margin}px`;
            panel.style.right = 'auto';
            panel.style.top = `${10}px`;
            panel.style.bottom = `${10}px`;
            panel.style.width = `${panelWidth}px`;
            panel.dataset.anchor = 'left';
            panel.classList.add('ai-anchored-left');
        }

        panel.style.position = 'fixed';
        panel.style.zIndex = '10001';
        panel.style.overflow = 'hidden';

        const content = panel.querySelector('.ai-inbox-content');
        if (content) {
            content.style.overflowY = 'auto';
            content.style.maxHeight = 'calc(100vh - 120px)';
        }

        panel.tabIndex = -1;
    }

    _toTitleCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1 $2')
                  .replace(/[_-]+/g, ' ')
                  .split(' ')
                  .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
                  .join(' ');
    }

    extractFullConversation(composerElement) {
        const messages = [];
        let context = {
            relationship: 'professional',
            urgency: 'normal',
            sentiment: 'neutral',
            topic: 'general'
        };

        // Strategy 1: Find message container from composer's ancestors
        let container = composerElement.closest('.msg-thread, .msg-overlay-bubble-header, .msg-conversation-card, .msg-s-message-list-container');
        
        // Strategy 2: If not found, search in document for message list (common in newer LinkedIn)
        if (!container) {
            container = document.querySelector('.msg-s-message-list-container, .msg-s-message-list, .messaging-thread, [class*="msg-s-message-list"]');
        }
        
        // Strategy 3: Look for message list in same parent/grandparent area
        if (!container) {
            const formContainer = composerElement.closest('.msg-form, .compose-form');
            if (formContainer && formContainer.parentElement) {
                container = formContainer.parentElement.querySelector('.msg-s-message-list-container, .msg-s-message-list');
            }
        }

        console.log('LinkedIn AI: Message container found:', !!container, container?.className);

        if (!container) {
            console.log('LinkedIn AI: No message container found - trying direct document search');
            // Last resort: search entire document
            container = document.querySelector('ul[class*="msg-s-message-list"], .msg-overlay-list-bubble__message-list');
        }

        if (!container) {
            console.log('LinkedIn AI: No message container found at all');
            return { messages, context };
        }

        // Strategy: Prioritize parent wrappers, only use nested if no parent exists
        let msgElements = [];
        
        // First, try to get parent-level message elements (most reliable)
        const parentElements = container.querySelectorAll('li.msg-s-message-list__event, .msg-s-message-list__event');
        
        if (parentElements.length > 0) {
            // Use parent wrappers (they contain the full message)
            msgElements = Array.from(parentElements);
        } else {
            // Fallback: use nested elements if no parents found
            msgElements = Array.from(container.querySelectorAll('.msg-s-event-listitem, .message-item'));
        }
        
        console.log(`LinkedIn AI: Found ${msgElements.length} message elements in ${container.className}`);
        
        msgElements.forEach((msgEl, index) => {
            
            const isOwn = msgEl.classList.contains('msg-s-message-list__event--own') || 
                         msgEl.querySelector('.msg-s-message-group--own') !== null ||
                         msgEl.classList.toString().includes('--own');
            
            // Get sender first
            const senderEl = msgEl.querySelector('.msg-s-message-group__name, [data-control-name="message_sender_name"]');
            const sender = senderEl?.textContent?.trim() || (isOwn ? 'You' : 'Other');
            
            // Extract message text with comprehensive selectors
            let text = '';
            
            // Strategy 1: Try message bubble body (most common)
            const bubbleBody = msgEl.querySelector('.msg-s-event-listitem__body, .msg-s-message-group__message');
            if (bubbleBody) {
                // Clone to avoid modifying original DOM
                const clone = bubbleBody.cloneNode(true);
                
                // Remove sender names, buttons, reactions from clone
                clone.querySelectorAll('.msg-s-message-group__name, button, [role="button"], .reactions-icon, .msg-s-event-listitem__reactions').forEach(el => el.remove());
                
                text = clone.textContent?.trim() || '';
            }
            
            // Strategy 2: Try paragraph in body
            if (!text) {
                const paragraph = msgEl.querySelector('.msg-s-event-listitem__body p, .msg-s-message-group__message p');
                if (paragraph) {
                    text = paragraph.textContent?.trim() || '';
                }
            }
            
            // Strategy 3: Try any text container
            if (!text) {
                const textContainer = msgEl.querySelector('.t-14, .msg-s-event-listitem__message-bubble span');
                if (textContainer) {
                    text = textContainer.textContent?.trim() || '';
                }
            }
            
            // Clean up the text - remove sender name if it appears at the start
            if (text && text.startsWith(sender)) {
                text = text.substring(sender.length).trim();
            }
            
            console.log(`LinkedIn AI: Message ${index}: "${text.substring(0, 50)}..." from ${sender} (own: ${isOwn})`);
            
            // Only include messages with letters, numbers, or punctuation (excludes emoji-only)
            if (text && /[\p{L}\p{N}\p{P}]/u.test(text)) {
                messages.push({
                    text,
                    isOwn,
                    sender,
                    timestamp: Date.now()
                });
            }
        });

        console.log(`LinkedIn AI: Extracted ${messages.length} messages total`);

        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1].text.toLowerCase();
            
            if (lastMsg.includes('urgent') || lastMsg.includes('asap') || lastMsg.includes('immediately')) {
                context.urgency = 'high';
            }
            
            if (lastMsg.includes('?')) {
                context.sentiment = 'inquisitive';
            } else if (lastMsg.includes('thanks') || lastMsg.includes('appreciate')) {
                context.sentiment = 'grateful';
            } else if (lastMsg.includes('!')) {
                context.sentiment = 'excited';
            }
            
            if (lastMsg.includes('job') || lastMsg.includes('position') || lastMsg.includes('role')) {
                context.topic = 'career';
            } else if (lastMsg.includes('meeting') || lastMsg.includes('call') || lastMsg.includes('discuss')) {
                context.topic = 'meeting';
            } else if (lastMsg.includes('collaboration') || lastMsg.includes('project') || lastMsg.includes('work together')) {
                context.topic = 'collaboration';
            }
        }

        return {
            messages: messages.slice(-10),
            context
        };
    }

    async generateMultiToneReplies(conversation) {
        // Generate 3 suggestions based on conversation tone and topic
        const tones = [
            { id: 'prof', label: 'Professional', icon: '💼' },
            { id: 'friendly', label: 'Friendly', icon: '😊' },
            { id: 'brief', label: 'Brief', icon: '⚡' }
        ];

        const promises = tones.map(async (tone) => {
            try {
                // Use the full generator with conversation history for higher quality
                const full = await AIAssistantAPI.generateInboxReply(conversation.messages, tone.id, 'general');
                let replyText = '';

                if (full) {
                    // full.replies may be structured; try to extract the first reply
                    if (Array.isArray(full.replies) && full.replies.length) {
                        replyText = full.replies[0].text || full.replies[0].reply || full.replies[0];
                    } else if (full.reply) {
                        replyText = full.reply;
                    } else if (typeof full === 'string') {
                        replyText = full;
                    }
                }

                return {
                    tone: tone.label,
                    icon: tone.icon,
                    text: replyText,
                    toneId: tone.id
                };
            } catch (error) {
                console.error(`Error generating ${tone.label} reply:`, error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter(r => r !== null);
    }

    displaySuggestions(panel, replies, conversation, composerElement) {
        const contextEl = panel.querySelector('.ai-inbox-context');
        const repliesEl = panel.querySelector('.ai-inbox-replies');
        const loadingEl = panel.querySelector('.ai-inbox-loading');
        const suggestionsEl = panel.querySelector('.ai-inbox-suggestions');
        const tabsEl = panel.querySelector('.ai-inbox-tabs');

        const { context } = conversation;
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        
        contextEl.innerHTML = `
            <div class="ai-inbox-context-item">
                <span class="ai-inbox-badge ai-inbox-badge-${context.urgency}">${context.urgency}</span>
                <span class="ai-inbox-badge">${context.topic}</span>
                <span class="ai-inbox-badge">${context.sentiment}</span>
            </div>
            <div class="ai-inbox-last-msg">
                <strong>${lastMsg.sender}:</strong> ${lastMsg.text.substring(0, 80)}${lastMsg.text.length > 80 ? '...' : ''}
            </div>
        `;

        repliesEl.innerHTML = '';
    // Build tabs and reply panels
    tabsEl.innerHTML = '';
    replies.forEach((reply, idx) => {
            // Tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = `ai-post-tab ${idx === 0 ? 'active' : ''}`;
            tabBtn.type = 'button';
            tabBtn.textContent = reply.tone ? this._toTitleCase(String(reply.tone)) : `Option ${idx + 1}`;
            tabBtn.dataset.index = String(idx);
            tabsEl.appendChild(tabBtn);

            // Reply panel (one per tab)
            const replyItem = document.createElement('div');
            replyItem.className = 'ai-inbox-reply-item';
            replyItem.style.display = idx === 0 ? 'block' : 'none';

            const header = document.createElement('div');
            header.className = 'ai-inbox-reply-header';
            header.innerHTML = `<span class="ai-inbox-tone-badge">${reply.icon || ''} ${reply.tone}</span>`;

            const textEl = document.createElement('div');
            textEl.className = 'ai-inbox-reply-text';
            textEl.textContent = reply.text || '';

            const actions = document.createElement('div');
            actions.className = 'ai-inbox-reply-actions';
            // Use inline SVG icons for realistic, consistent appearance
            actions.innerHTML = `
                <button class="ai-inbox-use-btn" title="Use">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span>Use</span>
                </button>
                <button class="ai-inbox-send-btn" title="Send">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                    <span>Send</span>
                </button>
                <button class="ai-inbox-copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
                <button class="ai-inbox-rewrite-btn" title="Regenerate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 6V4l-4 4 4 4V8c2.76 0 5 2.24 5 5 0 .34-.03.67-.09 1h2.02c.06-.33.07-.66.07-1 0-3.87-3.13-7-7-7zM6.09 12c-.06.33-.09.66-.09 1 0 3.87 3.13 7 7 7v2l4-4-4-4v2c-2.76 0-5-2.24-5-5 0-.34.03-.67.09-1H6.09z"/></svg>
                </button>
            `;

            replyItem.appendChild(header);
            replyItem.appendChild(textEl);
            replyItem.appendChild(actions);

            // Wire actions
            replyItem.querySelector('.ai-inbox-use-btn').addEventListener('click', () => {
                this.insertReply(composerElement, reply.text);
                panel.remove();
            });

            replyItem.querySelector('.ai-inbox-copy-btn').addEventListener('click', async (e) => {
                await this.copyToClipboard(reply.text, e.currentTarget);
            });

            replyItem.querySelector('.ai-inbox-rewrite-btn').addEventListener('click', async (e) => {
                // disable button while rewriting
                const btn = e.currentTarget;
                const orig = btn.innerHTML;
                btn.innerHTML = '<span class="ai-post-spinner"></span>';
                btn.disabled = true;
                try {
                    const rewritten = await AIAssistantAPI.rewriteText(reply.text, reply.toneId || 'professional', '');
                    if (rewritten?.rewritten) {
                        textEl.textContent = rewritten.rewritten;
                    }
                } catch (err) {
                    console.error('Rewrite failed:', err);
                } finally {
                    btn.innerHTML = orig;
                    btn.disabled = false;
                }
            });

            const sendBtn = replyItem.querySelector('.ai-inbox-send-btn');
            sendBtn.addEventListener('click', async () => {
                await this.sendReply(composerElement, reply.text);
                panel.remove();
            });

            repliesEl.appendChild(replyItem);

            // Tab click handler
            tabBtn.addEventListener('click', () => {
                // activate selected tab
                tabsEl.querySelectorAll('.ai-post-tab').forEach(b => b.classList.remove('active'));
                tabBtn.classList.add('active');

                // show corresponding reply panel only
                repliesEl.querySelectorAll('.ai-inbox-reply-item').forEach((rEl, rIdx) => {
                    rEl.style.display = (rIdx === idx) ? 'block' : 'none';
                });
            });
        });

        loadingEl.style.display = 'none';
        suggestionsEl.style.display = 'block';
    }

    insertReply(composerElement, text) {
        // Focus first to ensure proper event handling
        // Use DOM helper to set content in a way editors expect
        const success = AIAssistantDOM.setEditableText(composerElement, text);
        if (!success) {
            // fallback to insert at cursor
            this.insertReplyFallback(composerElement, text);
        }

        // Ensure composer is focused so LinkedIn shows the send button active
        try { composerElement.focus(); } catch (e) {}

        // Small delay to allow LinkedIn to re-evaluate send-button state
        setTimeout(() => {
            // Try to find and enable send button visually by dispatching key events
            try {
                composerElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
                composerElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                composerElement.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (e) {}
        }, 60);

        AIAssistantAPI.showSuccess('Reply inserted!', composerElement);
    }

    insertReplyFallback(composerElement, text) {
        try {
            // Try a series of fallbacks: insertTextAtCursor then full set
            if (!AIAssistantDOM.insertTextAtCursor(composerElement, text)) {
                // last resort: set plain text
                AIAssistantDOM.setEditableText(composerElement, text);
            }
        } catch (e) {
            console.error('Fallback insert failed', e);
        }
    }

    async sendReply(composerElement, text) {
        // Insert first to ensure message content is set
        this.insertReply(composerElement, text);

        // Try to locate the closest send button from composer context
        const container = this.findMessageContainer(composerElement);
        const sendSelector = AIAssistantDOM.selectors?.messageSubmitButton || '.msg-form__send-button, .compose-form__send-button';

        let sendButton = null;
        if (container) {
            sendButton = container.querySelector(sendSelector);
        }
        if (!sendButton) {
            // Fallback: search upward a bit and in document scope
            sendButton = composerElement.closest('.msg-form, .compose-form')?.querySelector(sendSelector) ||
                         document.querySelector(sendSelector);
        }

        if (sendButton) {
            // Some UIs require mousedown/mouseup
            sendButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            sendButton.click();
            sendButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            AIAssistantAPI.showSuccess('Reply sent!', container || composerElement);
        } else {
            // If we cannot find a send button, at least notify the user
            AIAssistantAPI.showError(new Error('Send button not found. Inserted into box instead.'), container || composerElement);
        }
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = button.innerHTML;
            // small inline checkmark SVG
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 1500);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    }

    async rewriteReply(replyItem, text, tone) {
        const rewriteBtn = replyItem.querySelector('.ai-inbox-rewrite-btn');
        const originalHTML = rewriteBtn.innerHTML;
        
    rewriteBtn.innerHTML = '<span class="ai-post-spinner"></span>';
        rewriteBtn.disabled = true;

        try {
            const rewritten = await AIAssistantAPI.rewriteText(text, tone, '');
            if (rewritten?.rewritten) {
                const textEl = replyItem.querySelector('.ai-inbox-reply-text');
                textEl.textContent = rewritten.rewritten;
                replyItem.querySelector('.ai-inbox-use-btn').setAttribute('data-text', this.escapeHtml(rewritten.rewritten));
                replyItem.querySelector('.ai-inbox-copy-btn').setAttribute('data-text', this.escapeHtml(rewritten.rewritten));
            }
        } catch (error) {
            console.error('Rewrite error:', error);
        } finally {
            rewriteBtn.innerHTML = originalHTML;
            rewriteBtn.disabled = false;
        }
    }

    showEmptyState(panel) {
        const contentEl = panel.querySelector('.ai-inbox-content');
        contentEl.innerHTML = `
            <div class="ai-inbox-empty">
                <i class="fas fa-inbox"></i>
                <p>No conversation found. Start chatting to get AI suggestions!</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    findMessageContainer(composerElement) {
        return composerElement.closest('.msg-form, .msg-overlay-bubble-header, .msg-s-message-list-container, .compose-form, .msg-form__contenteditable-wrapper') || 
               composerElement.parentElement;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    cleanup() {
        document.querySelectorAll('.ai-inbox-assistant-box, .ai-inbox-assist-btn').forEach(el => el.remove());
        this.attachedComposers = new WeakMap();
        this.activeBoxes = new WeakSet();
    }
}

window.AIInboxAssistant = AIInboxAssistant;
