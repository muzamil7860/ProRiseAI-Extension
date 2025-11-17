// AI Bot Panel - Right-anchored full-height control center
class AIBotPanel {
    constructor(settings) {
        this.settings = settings || {};
        this.panel = null;
        this.icon = null;
        this.isOpen = false;
    }

    attachToPage() {
        try {
            if (document.querySelector('.ai-bot-icon')) return;
            const createIcon = () => {
                const container = document.createElement('div');
                container.className = 'ai-bot-icon-holder';
                const btn = document.createElement('button');
                btn.className = 'ai-bot-icon';
                btn.type = 'button';
                btn.title = 'Open AI Bot';
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm1.07-7.75l-.9.92C13.45 11.9 13 12.5 13 14h-2v-.5c0-1 .45-1.8 1.17-2.5l1.24-1.26A1.99 1.99 0 0012 6a2 2 0 00-2 2H8a4 4 0 014-4c1.1 0 2 .9 2 2 0 .7-.35 1.2-.93 1.75z"/></svg>';
                btn.addEventListener('click', (e) => { e.preventDefault(); this.togglePanel(); });
                container.appendChild(btn);
                return container;
            };
            const selectors = ['header .global-nav__content', 'header', '.global-nav__content', '.scaffold-finite-scroll__content'];
            let placed = false;
            for (const sel of selectors) {
                const host = document.querySelector(sel);
                if (host) { host.appendChild(createIcon()); placed = true; break; }
            }
            if (!placed) {
                const floating = createIcon();
                floating.style.position = 'fixed';
                floating.style.bottom = '16px';
                floating.style.right = '16px';
                floating.style.zIndex = '10010';
                document.body.appendChild(floating);
            }
        } catch (e) { /* noop */ }
    }

    togglePanel() {
        if (this.isOpen) this.closePanel(); else this.openPanel();
    }

    openPanel() {
        if (this.panel) return;
        const panel = document.createElement('div');
        panel.className = 'ai-bot-panel ai-post-panel right-aligned modern ai-anchored';
        panel.innerHTML = `
            <div class="ai-post-header">
                <button class="ai-back-to-templates" style="display:none">Back</button>
                <div class="ai-title-main ai-template-name">Templates · Chat</div>
                <div style="display:flex;gap:8px;align-items:center">
                    <button class="ai-bot-profile">Profile</button>
                    <button class="ai-bot-saved">Saved</button>
                    <button class="ai-bot-close">✕</button>
                </div>
            </div>
            <div class="ai-bot-body" style="display:flex;flex-direction:column;height:calc(100% - 56px)">
                <div class="ai-templates-grid" style="padding:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;overflow:auto;flex:1">
                    <div class="ai-template-card" data-template="coverLetter">
                        <div class="ai-template-title">Cover Letter</div>
                        <div class="ai-template-desc">Step-by-step chat to craft a tailored cover letter from JD and notes.</div>
                    </div>
                    <div class="ai-template-card" data-template="emailForJD">
                        <div class="ai-template-title">Email for JD</div>
                        <div class="ai-template-desc">Paste a job description and I’ll draft outreach email via chat.</div>
                    </div>
                    <div class="ai-template-card" data-template="askPostContent">
                        <div class="ai-template-title">Ask for Post Content</div>
                        <div class="ai-template-desc">Generate a concise request to the author for missing post details.</div>
                    </div>
                    <div class="ai-template-card" data-template="askCommentReply">
                        <div class="ai-template-title">Reply / Ask Comment</div>
                        <div class="ai-template-desc">Create replies for comments or ask follow-up questions in a chat flow.</div>
                    </div>
                    <div class="ai-template-card" data-template="aiRewriterChat">
                        <div class="ai-template-title">AI Rewriter</div>
                        <div class="ai-template-desc">Interactive rewriter that asks clarifying questions then rewrites.</div>
                    </div>
                    <div class="ai-template-card" data-template="customPrompt">
                        <div class="ai-template-title">Custom Prompt</div>
                        <div class="ai-template-desc">Start a freeform conversation with the assistant.</div>
                    </div>
                </div>

                <div class="ai-chat-panel" style="display:none;flex-direction:column;height:100%">
                    <div class="ai-chat-messages" style="padding:12px;flex:1;overflow:auto;background:#fbfdff"></div>
                    <div role="ai-input-row" class="ai-input-row" style="padding:10px;border-top:1px solid #eee;display:flex;gap:8px;align-items:center">
                        <input class="ai-chat-input" placeholder="Type your message..." style="flex:1;padding:10px;border-radius:10px;border:1px solid #ddd" />
                        <button class="ai-chat-send ai-btn-primary" style="padding:10px 12px">Send</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(panel);
        this.panel = panel;
        this.isOpen = true;

        // Position
        Object.assign(panel.style, { position: 'fixed', top: '8px', right: '8px', bottom: '8px', width: '420px', zIndex: '10002', borderRadius: '10px', overflow: 'hidden' });

        // Events
        panel.querySelector('.ai-bot-close').addEventListener('click', () => this.closePanel());
    panel.querySelector('.ai-bot-profile').addEventListener('click', () => this._openProfilePanel());
    panel.querySelector('.ai-bot-saved').addEventListener('click', () => this._openSavedPanel());
        panel.querySelectorAll('.ai-template-card').forEach(el => el.addEventListener('click', (e) => this._openTemplateChat(e)));
        panel.querySelector('.ai-back-to-templates').addEventListener('click', () => this.showTemplates());

        const messagesEl = panel.querySelector('.ai-chat-messages');
        const inputEl = panel.querySelector('.ai-chat-input');
        const sendBtn = panel.querySelector('.ai-chat-send');
        messagesEl.style.paddingBottom = '84px';
        sendBtn.addEventListener('click', async () => {
            const txt = inputEl.value.trim();
            if (!txt) return;
            this._lastUserMessage = txt;
            sendBtn.disabled = true;
            try {
                this._appendChatMessage('user', txt);
                inputEl.value = '';
                setTimeout(() => { try { inputEl.focus(); } catch {} }, 20);
                if (this._currentFlow?.onUserMessage) await this._currentFlow.onUserMessage(txt, this);
            } finally {
                sendBtn.disabled = false;
                try { inputEl.focus(); } catch {}
            }
        });
        inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });
        this._escapeHandler = (e) => { if (e.key === 'Escape') this.closePanel(); };
        document.addEventListener('keydown', this._escapeHandler);
    }

    _openTemplateChat(e) {
        const card = e.currentTarget;
        const template = card.dataset.template;
        // Show chat panel
        const panel = this.panel;
        panel.querySelector('.ai-templates-grid').style.display = 'none';
        const chatPanel = panel.querySelector('.ai-chat-panel');
        chatPanel.style.display = 'flex';
        chatPanel.querySelector('.ai-chat-messages').innerHTML = '';

        // Initialize flow object per template
        const flows = {
            coverLetter: this._flowCoverLetter.bind(this),
            emailForJD: this._flowEmailForJD.bind(this),
            askPostContent: this._flowAskPostContent.bind(this),
            askCommentReply: this._flowAskCommentReply.bind(this),
            aiRewriterChat: this._flowRewriter.bind(this),
            customPrompt: this._flowCustomPrompt.bind(this)
        };

        const flowFactory = flows[template] || flows.customPrompt;
        this._currentFlow = flowFactory();
        // Show back button and template name
        panel.querySelector('.ai-back-to-templates').style.display = '';
        panel.querySelector('.ai-template-name').textContent = card.querySelector('.ai-template-title')?.textContent || template;

        // Start flow by sending initial bot prompt if present (keep input active so user can continue)
        if (this._currentFlow && this._currentFlow.start) {
            // hide any leftover result actions and ensure input is visible
            this._hideResultActions();
            this._appendChatMessage('bot', this._currentFlow.start);
            if (this._currentFlow.onStart) this._currentFlow.onStart(this);
        }
    }

    // Helper to show templates grid and reset chat state
    showTemplates() {
        if (!this.panel) return;
        const templatesGrid = this.panel.querySelector('.ai-templates-grid');
        const chatPanel = this.panel.querySelector('.ai-chat-panel');
        templatesGrid.style.display = '';
        chatPanel.style.display = 'none';
        // remove any open overlays like saved panel or inline editors
        this.panel.querySelectorAll('.ai-saved-panel, .ai-inline-tag-editor').forEach(el => el.remove());
        const backBtn = this.panel.querySelector('.ai-back-to-templates');
        if (backBtn) backBtn.style.display = 'none';
        const nameEl = this.panel.querySelector('.ai-template-name');
        if (nameEl) nameEl.textContent = 'Templates · Chat';
        this._currentFlow = null;
        const search = this.panel.querySelector('.ai-bot-search');
        if (search) { search.focus(); search.select && search.select(); }
    }

    _appendChatMessage(who, text, options = {}) {
        // options: { canSave?: boolean, buttons?: [{ label, className, onClick }], html?: string, disableDefaultCopy?: boolean }
        const messagesEl = this.panel.querySelector('.ai-chat-messages');
        const wrapper = document.createElement('div');
        wrapper.className = `ai-chat-msg ai-chat-${who}`;
        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        if (options && options.html) {
            bubble.innerHTML = options.html;
        } else {
            bubble.innerHTML = `<pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(text)}</pre>`;
        }

        // Action area (copy/save or custom buttons)
        const actions = document.createElement('div');
        actions.className = 'ai-chat-actions';

        // Copy is always available on bot messages
        if (who === 'bot' && !options.disableDefaultCopy) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'ai-copy-btn ai-btn-small';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                try {
                    await navigator.clipboard.writeText(text);
                    AIAssistantAPI.showSuccess && AIAssistantAPI.showSuccess('Copied to clipboard');
                    this._showToast('Copied to clipboard');
                } catch (err) {
                    this._showToast('Copy failed — please copy manually');
                }
            });
            actions.appendChild(copyBtn);

            // Save button only when allowed (i.e., produced result)
            if (options.canSave) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'ai-save-btn ai-btn-small ai-btn-primary';
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    // allow passing tag from options or prompt
                    this._saveItem(text, options.defaultTag).then(() => {
                        this._showToast('Saved');
                    }).catch(() => this._showToast('Save failed'));
                });
                actions.appendChild(saveBtn);
            }
        }

        // Custom inline buttons
        if (Array.isArray(options.buttons)) {
            options.buttons.forEach(b => {
                const btn = document.createElement('button');
                btn.className = b.className || 'ai-btn-small';
                btn.textContent = b.label;
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    try { b.onClick && b.onClick(); } catch (e) { console.error(e); }
                });
                actions.appendChild(btn);
            });
        }

        if (actions.childElementCount) bubble.appendChild(actions);

        wrapper.appendChild(bubble);
        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        try {
            const inputEl = this.panel && this.panel.querySelector('.ai-chat-input');
            if (inputEl) inputEl.focus();
        } catch (e) {}
        return wrapper;
    }

    // Show bottom actions (Save / Regenerate / New) replacing input area
    _showResultActions(resultText, options = {}) {
        if (!this.panel) return;
        // store last result and options for regenerate/save behavior
        this._lastResultText = resultText;
        this._lastResultOptions = options || {};

        const chatPanel = this.panel.querySelector('.ai-chat-panel');
        const inputRow = chatPanel.querySelector('div[role="ai-input-row"]') || chatPanel.querySelector('.ai-chat-input')?.parentElement;
        // hide the normal input row
        if (inputRow) inputRow.style.display = 'none';

        // remove existing actions if present
        const existing = chatPanel.querySelector('.ai-result-actions-bottom');
        if (existing) existing.remove();

        const actions = document.createElement('div');
        actions.className = 'ai-result-actions-bottom';
        actions.style.cssText = 'display:flex;gap:8px;padding:10px;border-top:1px solid #eee;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#fff,#fbfdff)';
        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.gap = '8px';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'ai-btn ai-save-final';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', async () => {
            try {
                // categorize by template if available
                const tag = (this.panel.querySelector('.ai-template-name')?.textContent || '').trim();
                await this._saveItem(this._lastResultText, tag);
                this._showToast('Saved');
            } catch (e) { this._showToast('Save failed'); }
        });

        const regenBtn = document.createElement('button');
        regenBtn.className = 'ai-btn ai-regen';
        regenBtn.textContent = 'Regenerate';
        regenBtn.addEventListener('click', async () => {
            // if the flow provides a regenerate method, call it; otherwise re-send last user message
            if (this._currentFlow && this._currentFlow.onRegenerate) {
                // show a small bot message and call regenerate
                this._appendChatMessage('bot', 'Regenerating...');
                await this._currentFlow.onRegenerate(this);
            } else if (this._lastUserMessage) {
                this._appendChatMessage('user', this._lastUserMessage);
                if (this._currentFlow && this._currentFlow.onUserMessage) await this._currentFlow.onUserMessage(this._lastUserMessage, this);
            } else {
                this._appendChatMessage('bot', 'Nothing to regenerate.');
            }
            // after regenerate, remove result actions (they'll be shown again on final result)
            this._hideResultActions();
        });

        const newBtn = document.createElement('button');
        newBtn.className = 'ai-btn ai-new';
        newBtn.textContent = 'New';
        newBtn.addEventListener('click', () => {
            // reset flow and show input again
            if (this._currentFlow && this._currentFlow.reset) this._currentFlow.reset();
            this._hideResultActions();
            // clear messages and re-start the flow
            chatPanel.querySelector('.ai-chat-messages').innerHTML = '';
            if (this._currentFlow && this._currentFlow.start) {
                this._appendChatMessage('bot', this._currentFlow.start);
                if (this._currentFlow.onStart) this._currentFlow.onStart(this);
            }
        });

        left.appendChild(saveBtn);
        left.appendChild(regenBtn);
        left.appendChild(newBtn);

        const right = document.createElement('div');
        right.style.fontSize = '12px';
        right.style.color = '#64748b';
        right.textContent = options.hint || '';

        actions.appendChild(left);
        actions.appendChild(right);

        chatPanel.appendChild(actions);
        // ensure scroll shows actions
        const messages = chatPanel.querySelector('.ai-chat-messages');
        messages.scrollTop = messages.scrollHeight;
    }

    _hideResultActions() {
        if (!this.panel) return;
        const chatPanel = this.panel.querySelector('.ai-chat-panel');
        const actions = chatPanel.querySelector('.ai-result-actions-bottom');
        if (actions) actions.remove();
        const inputRow = chatPanel.querySelector('div[role="ai-input-row"]') || chatPanel.querySelector('.ai-chat-input')?.parentElement;
        if (inputRow) inputRow.style.display = 'flex';
        try { const inputEl = this.panel.querySelector('.ai-chat-input'); if (inputEl) inputEl.focus(); } catch (e) {}
    }

    _showToast(message, timeout = 1800) {
        try {
            const existing = document.querySelector('.ai-bot-toast');
            if (existing) existing.remove();
            const t = document.createElement('div');
            t.className = 'ai-bot-toast';
            t.textContent = message;
            t.style.cssText = 'position:fixed;right:20px;bottom:20px;background:#0f172a;color:white;padding:8px 12px;border-radius:8px;z-index:10050;box-shadow:0 8px 24px rgba(2,6,23,0.4);font-weight:600';
            document.body.appendChild(t);
            setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 220); }, timeout);
        } catch (e) {}
    }

    // Robust JSON parsing for model outputs that may include code fences, smart quotes, stray text, or unescaped newlines
    _tryParseJSON(raw) {
        if (!raw) return null;
        if (typeof raw !== 'string') {
            try {
                if (raw && typeof raw === 'object' && (raw.subjects || raw.body_standard || raw.body_short)) return raw;
            } catch (e) {}
            return null;
        }
        let s = String(raw).trim();
        // If fenced code blocks present, extract JSON inside
        const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch) s = fenceMatch[1].trim();
        // Replace smart quotes with normal quotes
        s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        // Keep only the outermost JSON braces
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;
        s = s.slice(start, end + 1);
        // Remove trailing commas
        s = s.replace(/,(\s*[}\]])/g, '$1');
        // Escape raw newlines inside strings (between unescaped quotes)
        const escapeNewlinesInQuotes = (str) => {
            let out = '';
            let inStr = false;
            let prev = '';
            for (let i = 0; i < str.length; i++) {
                const ch = str[i];
                if (ch === '"' && prev !== '\\') { inStr = !inStr; out += ch; prev = ch; continue; }
                if (inStr && ch === '\n') { out += '\\n'; prev = ch; continue; }
                out += ch; prev = ch;
            }
            return out;
        };
        s = escapeNewlinesInQuotes(s);
        try {
            return JSON.parse(s);
        } catch (e) {
            try { return JSON.parse(s.replace(/\t/g, '    ')); } catch (e2) { return null; }
        }
    }

    _applyPlaceholders(text, role, company, profile) {
        if (!text) return text;
        let t = String(text);
        const name = (profile && profile.name) || '';
        t = t.replace(/\[Job Title\]/gi, role || 'the role');
        t = t.replace(/\[Company Name\]/gi, company || 'your company');
        t = t.replace(/\[Your Name\]/gi, name || '');
        return t;
    }

    async _saveItem(text, tag) {
        try {
            const key = 'aiSavedItems';
            const stored = await new Promise(res => chrome.storage.local.get([key], res));
            const items = (stored && stored[key]) || [];
            // Ask for a tag if not provided; prefill with current template name if present
            if (!tag) {
                // create an inline tag editor near the panel header so the user can enter a tag without blocking
                try {
                    const header = (this.panel && this.panel.querySelector('.ai-post-header')) || this.panel.querySelector('.ai-post-header') || this.panel.querySelector('.ai-title-main');
                    const pre = (this.panel && this.panel.querySelector('.ai-template-name')?.textContent) || '';
                    const editor = document.createElement('div');
                    editor.className = 'ai-inline-tag-editor';
                    editor.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e6eef7;position:relative;z-index:10006';
                    editor.innerHTML = `<input class="ai-inline-tag-input" placeholder="Add tag (e.g., Email, Cover Letter)" value="${this._escapeHtml(pre)}" style="padding:8px;border-radius:8px;border:1px solid #e6eef7" /><button class="ai-inline-tag-save" style="padding:8px 10px;background:linear-gradient(135deg,#0077B5,#00A0DC);color:#fff;border:none;border-radius:8px;cursor:pointer">Save</button><button class="ai-inline-tag-cancel" style="padding:8px 10px;background:#f3f4f6;border:none;border-radius:8px;cursor:pointer">Cancel</button>`;
                    // append to panel (avoid header overflow clipping)
                    this.panel.appendChild(editor);

                    const input = editor.querySelector('.ai-inline-tag-input');
                    const saveBtn = editor.querySelector('.ai-inline-tag-save');
                    const cancelBtn = editor.querySelector('.ai-inline-tag-cancel');
                    input.focus(); input.select && input.select();

                    const cleanupEditor = () => { try { editor.remove(); } catch (e) {} };
                    let resolve;
                    const finalize = (val) => { tag = (val || '').trim(); cleanupEditor(); try { resolve(); } catch (e) {} };

                    saveBtn.addEventListener('click', () => finalize(input.value));
                    cancelBtn.addEventListener('click', () => { tag = ''; cleanupEditor(); try { resolve(); } catch (e) {} });
                    // handle Enter key
                    // handle Enter / Escape keys
                    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finalize(input.value); } if (e.key === 'Escape') { cleanupEditor(); try { resolve(); } catch (e) {} } });

                    // Wait until user enters tag (we resolve below)
                    await new Promise(res => { resolve = res; });
                } catch (e) { tag = ''; }
            }
            const id = 's_' + Date.now();
            items.unshift({ id, text, tag: tag || '', createdAt: Date.now() });
            // limit to 50 items
            const trimmed = items.slice(0, 50);
            await new Promise(res => chrome.storage.local.set({ [key]: trimmed }, res));
            return true;
        } catch (e) {
            console.error('Save failed', e);
            throw e;
        }
    }

    async _openSavedPanel() {
        // Create overlay with saved list or reuse existing
        if (!this.panel) return;
        const savedPanel = document.createElement('div');
        savedPanel.className = 'ai-saved-panel';
    // place saved panel under the header and above the chat input; keep it scrollable and not covering controls
    savedPanel.style.cssText = 'position:absolute;top:56px;left:12px;right:12px;bottom:92px;background:white;border-radius:10px;padding:12px;z-index:10004;display:flex;flex-direction:column;overflow:hidden';
        savedPanel.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><strong>Saved Items</strong><button class="ai-saved-close" style="background:#f3f4f6;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button></div><div class="ai-saved-list" style="overflow:auto;flex:1;padding-right:8px"></div>`;
        this.panel.appendChild(savedPanel);
        savedPanel.querySelector('.ai-saved-close').addEventListener('click', () => savedPanel.remove());
        await this._renderSavedList(savedPanel.querySelector('.ai-saved-list'));
    }

    async _renderSavedList(container) {
        try {
            const key = 'aiSavedItems';
            const stored = await new Promise(res => chrome.storage.local.get([key], res));
            const items = (stored && stored[key]) || [];
            container.innerHTML = '';
            if (!items.length) {
                container.innerHTML = '<div style="color:#64748b;padding:18px;text-align:center">No saved items yet. Use Save on a generated reply to keep it here.</div>';
                return;
            }
            const groups = items.reduce((acc, it) => {
                const tag = (it.tag || '').trim();
                if (!acc[tag]) acc[tag] = [];
                acc[tag].push(it);
                return acc;
            }, {});
            const tags = Object.keys(groups).sort((a,b) => { if (!a) return 1; if (!b) return -1; return a.localeCompare(b, undefined, { sensitivity: 'base' }); });
            for (const tag of tags) {
                const header = document.createElement('div');
                header.className = 'ai-saved-group-title';
                header.textContent = tag || 'Untagged';
                container.appendChild(header);
                for (const it of groups[tag]) {
                    const row = document.createElement('div');
                    row.className = 'ai-saved-item';
                    row.style.cssText = 'padding:10px;border:1px solid #eef3fb;border-radius:8px;margin-bottom:8px;display:flex;flex-direction:column;gap:8px';
                    const time = new Date(it.createdAt).toLocaleString();
                    row.innerHTML = `<div style="white-space:pre-wrap;overflow:hidden;max-height:160px">${this._escapeHtml(it.text)}</div><div style="display:flex;gap:8px"><button class="ai-saved-copy">Copy</button><button class="ai-saved-delete">Delete</button><div style="margin-left:auto;font-size:11px;color:#64748b">${time}</div></div>`;
                    container.appendChild(row);
                    row.querySelector('.ai-saved-copy').addEventListener('click', async () => {
                        try { await navigator.clipboard.writeText(it.text); this._showToast('Copied'); } catch(e){ this._showToast('Copy failed'); }
                    });
                    row.querySelector('.ai-saved-delete').addEventListener('click', async () => {
                        await this._deleteSavedItem(it.id);
                        await this._renderSavedList(container);
                    });
                }
            }
        } catch (e) {
            console.error('Render saved list failed', e);
            container.innerHTML = '<div style="color:#ef4444;padding:18px">Failed to load saved items</div>';
        }
    }

    async _deleteSavedItem(id) {
        const key = 'aiSavedItems';
        const stored = await new Promise(res => chrome.storage.local.get([key], res));
        const items = (stored && stored[key]) || [];
        const filtered = items.filter(i => i.id !== id);
        await new Promise(res => chrome.storage.local.set({ [key]: filtered }, res));
    }

    // Per-template short answer storage (e.g., remember JD or recipient for email flow)
    async _getSavedAnswer(templateKey, field) {
        try {
            const key = 'aiTemplateAnswers';
            const stored = await new Promise(res => chrome.storage.local.get([key], res));
            const data = (stored && stored[key]) || {};
            return data[templateKey] && data[templateKey][field] ? data[templateKey][field] : null;
        } catch (e) { return null; }
    }

    async _setSavedAnswer(templateKey, field, value) {
        try {
            const key = 'aiTemplateAnswers';
            const stored = await new Promise(res => chrome.storage.local.get([key], res));
            const data = (stored && stored[key]) || {};
            data[templateKey] = data[templateKey] || {};
            data[templateKey][field] = value;
            await new Promise(res => chrome.storage.local.set({ [key]: data }, res));
            return true;
        } catch (e) { return false; }
    }

    // Profile storage
    async _getProfile() {
        try {
            const key = 'aiUserProfile';
            const stored = await new Promise(res => chrome.storage.local.get([key], res));
            return (stored && stored[key]) || {};
        } catch (e) { return {}; }
    }
    async _setProfile(profile) {
        try {
            const key = 'aiUserProfile';
            await new Promise(res => chrome.storage.local.set({ [key]: profile || {} }, res));
            return true;
        } catch (e) { return false; }
    }

    async _openProfilePanel() {
        if (!this.panel) return;
        // Create overlay panel similar to Saved
        const existing = this.panel.querySelector('.ai-profile-panel');
        if (existing) { existing.remove(); }
        const prof = await this._getProfile();
        const panel = document.createElement('div');
        panel.className = 'ai-profile-panel';
        panel.style.cssText = 'position:absolute;top:56px;left:12px;right:12px;bottom:92px;background:white;border-radius:10px;padding:12px;z-index:10004;display:flex;flex-direction:column;overflow:hidden';
        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <strong>Profile & Settings</strong>
                <div style="display:flex;gap:8px">
                    <button class="ai-profile-save" style="background:#0077B5;color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Save</button>
                    <button class="ai-profile-close" style="background:#f3f4f6;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button>
                </div>
            </div>
            <div class="ai-profile-scroll" style="overflow:auto;flex:1;padding-right:8px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                        <label style="font-size:12px;color:#64748b">Full Name</label>
                        <input class="pf-name" value="${this._escapeHtml(prof.name||'')}" placeholder="Your name" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px"/>
                    </div>
                    <div>
                        <label style="font-size:12px;color:#64748b">Title</label>
                        <input class="pf-title" value="${this._escapeHtml(prof.title||'')}" placeholder="Senior Software Engineer" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px"/>
                    </div>
                    <div>
                        <label style="font-size:12px;color:#64748b">Location</label>
                        <input class="pf-location" value="${this._escapeHtml(prof.location||'')}" placeholder="City, Country" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px"/>
                    </div>
                    <div>
                        <label style="font-size:12px;color:#64748b">Availability</label>
                        <input class="pf-availability" value="${this._escapeHtml(prof.availability||'')}" placeholder="Immediate / 2 weeks" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px"/>
                    </div>
                    <div style="grid-column:1/3">
                        <label style="font-size:12px;color:#64748b">Skills (comma-separated)</label>
                        <textarea class="pf-skills" placeholder="PHP, WordPress, Laravel, React, MySQL" style="width:100%;height:60px;padding:8px;border:1px solid #e6eef7;border-radius:8px">${this._escapeHtml(prof.skills||'')}</textarea>
                    </div>
                    <div style="grid-column:1/3">
                        <label style="font-size:12px;color:#64748b">Experience Summary</label>
                        <textarea class="pf-experience" placeholder="4+ years full-stack..." style="width:100%;height:70px;padding:8px;border:1px solid #e6eef7;border-radius:8px">${this._escapeHtml(prof.experience||'')}</textarea>
                    </div>
                    <div style="grid-column:1/3">
                        <label style="font-size:12px;color:#64748b">Projects (2-4 bullet lines)</label>
                        <textarea class="pf-projects" placeholder="• NARA Donation System — recurring payments...\n• Woo Price Automation — dynamic price control..." style="width:100%;height:80px;padding:8px;border:1px solid #e6eef7;border-radius:8px">${this._escapeHtml(prof.projects||'')}</textarea>
                    </div>
                    <div style="grid-column:1/3">
                        <label style="font-size:12px;color:#64748b">Keywords to emphasize</label>
                        <input class="pf-keywords" value="${this._escapeHtml(prof.keywords||'')}" placeholder="Remote, WordPress, Custom Plugins, REST APIs" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px"/>
                    </div>
                    <div style="grid-column:1/3">
                        <label style="font-size:12px;color:#64748b">Signature Block</label>
                        <textarea class="pf-signature" placeholder="Thanks,\nBest Regards,\nYour Name\nContact: ..." style="width:100%;height:90px;padding:8px;border:1px solid #e6eef7;border-radius:8px">${this._escapeHtml(prof.signature||'')}</textarea>
                    </div>
                    <div>
                        <label style="font-size:12px;color:#64748b">Default Tone</label>
                        <select class="pf-tone" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px">
                            <option value="professional" ${prof.tone==='professional'?'selected':''}>Professional</option>
                            <option value="friendly" ${prof.tone==='friendly'?'selected':''}>Friendly</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px;color:#64748b">Default Length</label>
                        <select class="pf-length" style="width:100%;padding:8px;border:1px solid #e6eef7;border-radius:8px">
                            <option value="standard" ${prof.length==='standard'?'selected':''}>Standard</option>
                            <option value="short" ${prof.length==='short'?'selected':''}>Short</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        this.panel.appendChild(panel);
        panel.querySelector('.ai-profile-close').addEventListener('click', () => panel.remove());
        panel.querySelector('.ai-profile-save').addEventListener('click', async () => {
            const getVal = (sel) => panel.querySelector(sel)?.value || '';
            const profile = {
                name: getVal('.pf-name'),
                title: getVal('.pf-title'),
                location: getVal('.pf-location'),
                availability: getVal('.pf-availability'),
                skills: getVal('.pf-skills'),
                experience: getVal('.pf-experience'),
                projects: getVal('.pf-projects'),
                keywords: getVal('.pf-keywords'),
                signature: getVal('.pf-signature'),
                tone: getVal('.pf-tone') || 'professional',
                length: getVal('.pf-length') || 'standard'
            };
            await this._setProfile(profile);
            this._showToast('Profile saved');
        });
    }

    // Flow implementations: return an object with start text and handlers
    _flowCoverLetter() {
        const state = { step: 0, data: {} };
        return {
            start: 'Sure — I can help write a cover letter. First, paste the job description (or a link) for the role you want to apply to.',
            async onUserMessage(msg, ctx) {
                if (state.step === 0) {
                    state.data.jd = msg;
                    state.step = 1;
                    ctx._appendChatMessage('bot', 'Great. Any personal notes or achievements you want highlighted? (or type "skip")');
                    return;
                }
                if (state.step === 1) {
                    state.data.notes = msg;
                    state.step = 2;
                    ctx._appendChatMessage('bot', 'What tone would you like? e.g., professional, friendly, persuasive');
                    return;
                }
                if (state.step === 2) {
                    state.data.tone = msg || 'professional';
                    ctx._appendChatMessage('bot', 'Generating your cover letter...');
                    // Call API
                    try {
                        const prompt = `Create a cover letter for the following job description:\n${state.data.jd}\nNotes: ${state.data.notes || ''}\nTone: ${state.data.tone}`;
                        const res = await AIAssistantAPI.generateContent(prompt, state.data.tone || 'professional', 'cover_letter');
                        const content = (res && (res.fullPost || res.coverLetter || res.content || JSON.stringify(res))) || 'Failed to generate';
                        ctx._appendChatMessage('bot', content);
                        // show Save / Regenerate / New actions for this final result
                        try { ctx._showResultActions(content, { hint: 'Cover letter generated' }); } catch (e) {}
                    } catch (err) {
                        ctx._appendChatMessage('bot', 'Sorry, an error occurred while generating.');
                    }
                    return;
                }
            },
            async onRegenerate(ctx) {
                if (!state.data.jd) { ctx._appendChatMessage('bot', 'Please provide the job description first.'); return; }
                const tone = state.data.tone || 'professional';
                try {
                    const prompt = `Create a cover letter for the following job description:\n${state.data.jd}\nNotes: ${state.data.notes || ''}\nTone: ${tone}`;
                    const res = await AIAssistantAPI.generateContent(prompt, tone, 'cover_letter');
                    const content = (res && (res.fullPost || res.coverLetter || res.content || JSON.stringify(res))) || 'Failed to generate';
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Cover letter regenerated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error regenerating cover letter');
                }
            },
            reset() { state.step = 0; state.data = {}; }
        };
    }

    _flowEmailForJD() {
        const state = { step: 0, data: {}, variants: null };
        const save = async (field, value) => {
            if (value && typeof value === 'string') await this._setSavedAnswer('emailForJD', field, value);
        };
        const get = async (field) => (await this._getSavedAnswer('emailForJD', field));
        const parseRoleCompany = (input) => {
            if (!input) return { role: '', company: '' };
            const parts = String(input).split(/ at | @ |, /i);
            return { role: (parts[0] || '').trim(), company: (parts[1] || '').trim() };
        };
        const askRoleCompany = (ctx) => {
            ctx._appendChatMessage('bot', 'What is the role and company? (e.g., Frontend Engineer at Acme) Or type "auto" to detect from the JD.');
        };
        const askRecipient = async (ctx) => {
            const savedRecipient = await get('recipient');
            if (savedRecipient) {
                ctx._appendChatMessage('bot', `Use saved recipient: ${savedRecipient}?`, {
                    buttons: [
                        { label: 'Use saved', className: 'ai-btn-small', onClick: async () => { state.data.recipient = savedRecipient; state.step = 3; askAchievements(ctx); } },
                        { label: 'Enter new', className: 'ai-btn-small', onClick: () => { ctx._appendChatMessage('bot', 'Please provide recipient name/role.'); } }
                    ]
                });
            } else {
                ctx._appendChatMessage('bot', 'Who is the recipient? (name/role, e.g., "Alex — Hiring Manager")');
            }
        };
        const askAchievements = (ctx) => {
            ctx._appendChatMessage('bot', 'Share 2-3 relevant strengths/achievements (or type "skip").');
        };
        const askExperienceStack = (ctx) => {
            ctx._appendChatMessage('bot', 'Briefly describe your experience and core stack (e.g., 4+ years; PHP, WordPress, Laravel, React, MySQL).');
        };
        const askProjects = (ctx) => {
            ctx._appendChatMessage('bot', 'List 2-3 notable projects or products with outcomes (comma-separated).');
        };
        const askLocationAvailability = (ctx) => {
            ctx._appendChatMessage('bot', 'Optional: Your location and availability (e.g., LHR, PK; Immediate / 2 weeks notice). Type "skip" to continue.');
        };
        const askTone = async (ctx) => {
            const savedTone = await get('tone');
            if (savedTone) {
                ctx._appendChatMessage('bot', `Use tone: ${savedTone}?`, {
                    buttons: [
                        { label: 'Use saved', className: 'ai-btn-small', onClick: async () => { state.data.tone = savedTone; await save('tone', savedTone); state.step = 5; askLength(ctx); } },
                        { label: 'Choose tone', className: 'ai-btn-small', onClick: () => { ctx._appendChatMessage('bot', 'Choose a tone: Professional or Friendly'); } }
                    ]
                });
            } else {
                ctx._appendChatMessage('bot', 'Choose a tone: Professional or Friendly');
            }
        };
        const askLength = (ctx) => {
            ctx._appendChatMessage('bot', 'Preferred length?', {
                buttons: [
                    { label: 'Short', className: 'ai-btn-small', onClick: async () => { state.data.length = 'short'; await save('length', 'short'); state.step = 6; askCTA(ctx); } },
                    { label: 'Standard', className: 'ai-btn-small', onClick: async () => { state.data.length = 'standard'; await save('length', 'standard'); state.step = 6; askCTA(ctx); } }
                ]
            });
        };
        const askCTA = async (ctx) => {
            ctx._appendChatMessage('bot', 'Pick a call-to-action:', {
                buttons: [
                    { label: '15-min chat', className: 'ai-btn-small', onClick: async () => { state.data.cta = '15-min chat'; await save('cta', '15-min chat'); state.step = 7; askSignature(ctx); } },
                    { label: 'Apply now', className: 'ai-btn-small', onClick: async () => { state.data.cta = 'Application submitted'; await save('cta', 'Application submitted'); state.step = 7; askSignature(ctx); } },
                    { label: 'Referral request', className: 'ai-btn-small', onClick: async () => { state.data.cta = 'Referral request'; await save('cta', 'Referral request'); state.step = 7; askSignature(ctx); } }
                ]
            });
        };
        const askSignature = async (ctx) => {
            const sig = await get('signature');
            if (sig) {
                ctx._appendChatMessage('bot', `Use saved signature: ${sig}?`, {
                    buttons: [
                        { label: 'Use saved', className: 'ai-btn-small', onClick: async () => { state.data.signature = sig; await save('signature', sig); await generateAndShow(ctx); } },
                        { label: 'Enter new', className: 'ai-btn-small', onClick: () => { ctx._appendChatMessage('bot', 'Please enter your name/signature.'); } }
                    ]
                });
            } else {
                ctx._appendChatMessage('bot', 'How should we sign off? (name/signature)');
            }
        };
        const extractRoleCompany = async () => {
            try {
                const ep = `Extract the role title and company name from the JD below and output strict JSON as {"role":"...","company":"..."}. JD: ${state.data.jd}`;
                const er = await AIAssistantAPI.generateContent(ep, 'neutral', 'extract');
                const raw = er && (er.content || er.fullPost || er) || '';
                let obj = null; try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {}
                if (obj) {
                    state.data.role = (obj.role || '').trim();
                    state.data.company = (obj.company || '').trim();
                    await save('role', state.data.role);
                    await save('company', state.data.company);
                }
            } catch {}
        };
        const quickGenerate = async (ctx) => {
            // Use saved defaults when available, and auto-detect role/company if missing
            const profile = await this._getProfile();
            state.data.tone = state.data.tone || profile.tone || (await get('tone')) || 'professional';
            state.data.length = state.data.length || profile.length || (await get('length')) || 'standard';
            state.data.cta = state.data.cta || (await get('cta')) || '15-min chat';
            // Compose signature from profile if not set in template answers
            if (!state.data.signature) {
                const lines = [];
                if (profile.signature) lines.push(profile.signature);
                else {
                    if (profile.name) lines.push(profile.name);
                    if (profile.title) lines.push(profile.title);
                    if (profile.location) lines.push(profile.location);
                }
                state.data.signature = lines.join('\n');
            }
            state.data.recipient = state.data.recipient || (await get('recipient')) || '';
            // Merge candidate details: prefer explicit template answers, fallback to profile
            state.data.achievements = state.data.achievements || (await get('achievements')) || profile.keywords || '';
            state.data.experienceStack = state.data.experienceStack || (await get('experienceStack')) || profile.experience || profile.skills || '';
            state.data.projects = state.data.projects || (await get('projects')) || profile.projects || '';
            const av = (await get('locationAvailability')) || profile.location || profile.availability || '';
            state.data.locationAvailability = state.data.locationAvailability || av;
            if (!state.data.role || !state.data.company) { await extractRoleCompany(); }
            state.data.salutation = state.data.recipient ? 'name' : 'manager';
            await generateAndShow(ctx);
        };
        const generateAndShow = async (ctx) => {
            // Branded writing animation while generating
            const animHtml = `
                <div class="ai-writing-modern" style="width:100%;padding:8px 0;">
                    <svg class="ai-writing-svg" viewBox="0 0 120 28" aria-hidden="true">
                        <defs>
                            <linearGradient id="ai-gradient" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stop-color="#00A0DC"/>
                                <stop offset="50%" stop-color="#0077B5"/>
                                <stop offset="100%" stop-color="#8B5CF6"/>
                            </linearGradient>
                        </defs>
                        <path class="ai-writing-glow" d="M5 18 C 25 2, 55 26, 75 12 S 105 22, 115 10"></path>
                        <path class="ai-writing-path" d="M5 18 C 25 2, 55 26, 75 12 S 105 22, 115 10"></path>
                        <circle class="ai-writing-dot" cx="5" cy="18" r="2.8"></circle>
                    </svg>
                    <div class="ai-writing-text-placeholder"></div>
                </div>`;
            const animMsg = ctx._appendChatMessage('bot', '', { html: animHtml, disableDefaultCopy: true });
            const tone = state.data.tone || 'professional';
            const length = state.data.length || 'standard';
            const cta = state.data.cta || '15-min chat';
            const signature = state.data.signature || '';
            const { role, company } = state.data;
            const profile = await this._getProfile();
            const prompt = `SYSTEM: You are a world-class job application email writer. Write like a senior professional: clear, concise, specific, credible. No fluff.
TASK: Produce a candidate-to-employer application email package for the role below.
RULES:
- Output JSON ONLY.
- Keys exactly: subjects (array of 5 strings), body_formal (string), body_standard (string), body_short (string), follow_up (string).
- Subjects: 5 options, each <= 60 characters, specific and professional.
 - Bodies MUST be concise, human, high-professional, tailored to the JD; avoid clichés and generic filler.
 - Write bodies in multiple short paragraphs (2–4), with clear line breaks between paragraphs. No markdown or lists.
 - Include one clear CTA aligned to CTA below.
- Length targets: body_standard ≈ 120–180 words; body_short ≤ 100 words; body_formal 150–220 words if needed.
- Do NOT include salutation or signature in bodies. Do NOT include placeholders like [Job Title] or [Company Name].

CONTEXT:
Tone: ${tone}
Preferred length: ${length}
CTA: ${cta}
Recipient: ${state.data.recipient || 'Hiring Manager'}
Role: ${role || 'unknown'}; Company: ${company || 'unknown'}
Candidate: ${profile.name || ''} · ${profile.title || ''}
Skills: ${profile.skills || ''}
Experience: ${state.data.experienceStack || profile.experience || ''}
Projects: ${state.data.projects || profile.projects || ''}
Keywords: ${profile.keywords || ''}
Location/Availability: ${state.data.locationAvailability || profile.location || profile.availability || ''}
Job description (between <JD> tags):
<JD>\n${state.data.jd}\n</JD>`;
            try {
                const res = await AIAssistantAPI.generateWithPrompt(prompt, tone);
                const raw = (res && (res.content || res.email || res.fullPost || res)) || '';
                let data = this._tryParseJSON(raw);
                if (!data || !Array.isArray(data.subjects)) {
                    try { animMsg.remove(); } catch {}
                    const fallback = typeof raw === 'string' ? raw : JSON.stringify(raw);
                    ctx._appendChatMessage('bot', fallback, { canSave: true, defaultTag: 'Email for JD' });
                    try { ctx._showResultActions(fallback, { hint: 'Email draft ready' }); } catch (e) {}
                    return;
                }
                state.variants = data;
                const profileCtx = await this._getProfile();
                const subjects = (data.subjects || []).map(s => this._applyPlaceholders(s, role, company, profileCtx));
                let bodyFormal = this._applyPlaceholders((data.body_formal || '').trim(), role, company, profileCtx);
                let bodyStd = this._applyPlaceholders((data.body_standard || '').trim(), role, company, profileCtx);
                let bodyShort = this._applyPlaceholders((data.body_short || '').trim(), role, company, profileCtx);
                let followUp = this._applyPlaceholders((data.follow_up || '').trim(), role, company, profileCtx);
                if (!followUp) {
                    followUp = `I wanted to follow up on my application for the ${role || 'role'} at ${company || 'your company'}. I remain very interested and would welcome the opportunity to discuss how my experience can support your goals. If helpful, I can share relevant work samples or schedule a brief call at your convenience. Thank you for your time and consideration.`;
                }

                const renderPackage = () => {
                    const salutationType = state.data.salutation || (state.data.recipient ? 'name' : 'manager');
                    let salutation = 'Dear Hiring Manager,';
                    if (salutationType === 'sir') salutation = 'Dear Sir/Madam,';
                    if (salutationType === 'manager') salutation = 'Dear Hiring Manager,';
                    if (salutationType === 'name' && state.data.recipient) {
                        const nameOnly = String(state.data.recipient).split(/[–—-]/)[0].trim();
                        // Avoid addressing self if recipient matches user's own profile name
                        const selfName = (profileCtx && profileCtx.name) ? String(profileCtx.name).toLowerCase() : '';
                        if (selfName && nameOnly.toLowerCase() === selfName) {
                            salutation = 'Dear Hiring Manager,';
                        } else {
                            salutation = `Dear ${nameOnly},`;
                        }
                    }
                    const sig = (state.data.signature || '').trim();
                    const withSig = (t) => sig ? `${salutation}\n\n${t}\n\n${sig}` : `${salutation}\n\n${t}`;

                    return `
                    <div class="ai-email-tabs">
                        <div class="ai-email-tab-header" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                            <button data-tab="subjects" class="ai-tab-btn">Subjects</button>
                            <button data-tab="formal" class="ai-tab-btn ai-active">Body (Formal)</button>
                            <button data-tab="standard" class="ai-tab-btn">Body (Standard)</button>
                            <button data-tab="short" class="ai-tab-btn">Body (Short)</button>
                            <button data-tab="follow" class="ai-tab-btn">Follow-up</button>
                            <button data-tab="preview" class="ai-tab-btn">Preview</button>
                        </div>
                        <div class="ai-email-tab-body">
                            <div data-pane="subjects" style="display:none">
                                ${subjects.map((s, i) => `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px"><div style="min-width:18px;color:#475569">${i+1}.</div><div style="flex:1">${this._escapeHtml(s)}</div><div><button class="ai-btn-small" data-copy-subject="${i}">Copy</button></div></div>`).join('')}
                            </div>
                            <div data-pane="formal">
                                <pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(withSig(bodyFormal))}</pre>
                                <div style="display:flex;gap:8px;margin-top:8px">
                                    <button class="ai-btn-small" data-copy="formal">Copy</button>
                                </div>
                            </div>
                            <div data-pane="standard" style="display:none">
                                <pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(withSig(bodyStd))}</pre>
                                <div style="display:flex;gap:8px;margin-top:8px">
                                    <button class="ai-btn-small" data-copy="standard">Copy</button>
                                </div>
                            </div>
                            <div data-pane="short" style="display:none">
                                <pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(withSig(bodyShort))}</pre>
                                <div style="display:flex;gap:8px;margin-top:8px">
                                    <button class="ai-btn-small" data-copy="short">Copy</button>
                                </div>
                            </div>
                            <div data-pane="follow" style="display:none">
                                <pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(followUp)}</pre>
                                <div style="display:flex;gap:8px;margin-top:8px">
                                    <button class="ai-btn-small" data-copy="follow">Copy Follow-up</button>
                                </div>
                            </div>
                            <div data-pane="preview" style="display:none">
                                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px">
                                    <div style="font-weight:600;margin-bottom:6px">Preview (Formal)</div>
                                    <div style="color:#475569;margin-bottom:12px">To: ${this._escapeHtml(state.data.recipient || '')} · Subject: ${this._escapeHtml(subjects[0] || '')}</div>
                                    <pre style="white-space:pre-wrap;margin:0">${this._escapeHtml(withSig(bodyFormal))}</pre>
                                </div>
                            </div>
                        </div>
                        <div class="ai-email-quickbar" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                            <span style="color:#64748b">Quick adjust:</span>
                            <button class="ai-btn-small" data-q-tone="professional">Tone: Professional</button>
                            <button class="ai-btn-small" data-q-tone="friendly">Tone: Friendly</button>
                            <button class="ai-btn-small" data-q-len="short">Length: Short</button>
                            <button class="ai-btn-small" data-q-len="standard">Length: Standard</button>
                            <button class="ai-btn-small" data-q-salutation="sir">Salutation: Sir/Madam</button>
                            <button class="ai-btn-small" data-q-salutation="manager">Salutation: Hiring Manager</button>
                            <button class="ai-btn-small" data-q-salutation="name">Salutation: By Name</button>
                            <button class="ai-btn-small" data-regenerate>Regenerate</button>
                        </div>
                    </div>
                `;
                };

                const html = renderPackage();
                try { animMsg.remove(); } catch {}
                const msgEl = ctx._appendChatMessage('bot', '', { html, canSave: true, defaultTag: 'Email for JD', disableDefaultCopy: true });

                // Centralized binder for tabs, copy, and quick-adjust that we can call after any re-render
                const bindPackageEvents = (root) => {
                    const bubble = root.querySelector('.ai-chat-bubble');
                    if (!bubble) return;
                    // Tabs
                    const btns = Array.from(bubble.querySelectorAll('.ai-tab-btn'));
                    const panes = Array.from(bubble.querySelectorAll('[data-pane]'));
                    const setTab = (name) => {
                        btns.forEach(b => b.classList.toggle('ai-active', b.getAttribute('data-tab') === name));
                        panes.forEach(p => p.style.display = (p.getAttribute('data-pane') === name) ? '' : 'none');
                    };
                    btns.forEach(b => b.addEventListener('click', () => setTab(b.getAttribute('data-tab'))));
                    // Copy handlers
                    const doCopy = async (t) => { try { await navigator.clipboard.writeText(t); this._showToast('Copied'); } catch { this._showToast('Copy failed'); } };
                    bubble.querySelectorAll('[data-copy-subject]')?.forEach(el => el.addEventListener('click', () => {
                        const idx = Number(el.getAttribute('data-copy-subject'));
                        if (!isNaN(idx) && subjects[idx]) doCopy(subjects[idx]);
                    }));
                    const currentWithSig = (t) => {
                        const salType = state.data.salutation || (state.data.recipient ? 'name' : 'manager');
                        let sal = 'Dear Hiring Manager,';
                        if (salType === 'sir') sal = 'Dear Sir/Madam,';
                        if (salType === 'name' && state.data.recipient) {
                            const nameOnly = String(state.data.recipient).split(/[–—-]/)[0].trim();
                            const selfName = (profileCtx && profileCtx.name) ? String(profileCtx.name).toLowerCase() : '';
                            sal = (selfName && nameOnly.toLowerCase() === selfName) ? 'Dear Hiring Manager,' : `Dear ${nameOnly},`;
                        }
                        const sigL = (state.data.signature || '').trim();
                        return sigL ? `${sal}\n\n${t}\n\n${sigL}` : `${sal}\n\n${t}`;
                    };
                    bubble.querySelector('[data-copy="formal"]')?.addEventListener('click', () => doCopy(currentWithSig(bodyFormal)));
                    bubble.querySelector('[data-copy="standard"]')?.addEventListener('click', () => doCopy(currentWithSig(bodyStd)));
                    bubble.querySelector('[data-copy="short"]')?.addEventListener('click', () => doCopy(currentWithSig(bodyShort)));
                    bubble.querySelector('[data-copy="follow"]')?.addEventListener('click', () => doCopy(followUp));
                    // Quick adjust: tone/length trigger full regenerate; salutation does local rerender
                    bubble.querySelectorAll('[data-q-tone]')?.forEach(el => el.addEventListener('click', async () => {
                        const t = el.getAttribute('data-q-tone');
                        state.data.tone = t; await save('tone', t); await generateAndShow(ctx);
                    }));
                    bubble.querySelectorAll('[data-q-len]')?.forEach(el => el.addEventListener('click', async () => {
                        const l = el.getAttribute('data-q-len');
                        state.data.length = l; await save('length', l); await generateAndShow(ctx);
                    }));
                    bubble.querySelectorAll('[data-q-salutation]')?.forEach(el => el.addEventListener('click', () => {
                        state.data.salutation = el.getAttribute('data-q-salutation');
                        // Re-render locally
                        const newHtml = renderPackage();
                        bubble.innerHTML = newHtml;
                        bindPackageEvents(root);
                    }));
                    bubble.querySelector('[data-regenerate]')?.addEventListener('click', async () => { await generateAndShow(ctx); });
                };
                bindPackageEvents(msgEl);

                try { ctx._showResultActions(`${subjects.join('\n')}\n\n${bodyFormal}`, { hint: 'Professional application package ready' }); } catch (e) {}
            } catch (e) {
                try { animMsg.remove(); } catch {}
                ctx._appendChatMessage('bot', 'Sorry, an error occurred while generating.');
            }
        };
        return {
            start: 'Paste the job description (or link). I’ll use your profile to write a professional email automatically.',
            async onUserMessage(msg, ctx) {
                if (state.step === 0) {
                    state.data.jd = msg;
                    await save('jd', msg);
                    state.step = 1;
                    await quickGenerate(ctx);
                    return;
                }
                if (state.step === 1) {
                    if ((msg || '').trim().toLowerCase() === 'auto') {
                        await extractRoleCompany();
                    } else {
                        const { role, company } = parseRoleCompany(msg);
                        state.data.role = role;
                        state.data.company = company;
                        await save('role', role);
                        await save('company', company);
                    }
                    state.step = 2;
                    await askRecipient(ctx);
                    return;
                }
                if (state.step === 2) {
                    state.data.recipient = msg;
                    await save('recipient', msg);
                    state.step = 3;
                    askAchievements(ctx);
                    return;
                }
                if (state.step === 3) {
                    if (msg && msg.toLowerCase() !== 'skip') {
                        state.data.achievements = msg;
                        await save('achievements', msg);
                    }
                    state.step = 4;
                    askExperienceStack(ctx);
                    return;
                }
                if (state.step === 4) {
                    state.data.experienceStack = msg;
                    await save('experienceStack', msg);
                    state.step = 5;
                    askProjects(ctx);
                    return;
                }
                if (state.step === 5) {
                    state.data.projects = msg;
                    await save('projects', msg);
                    state.step = 6;
                    askLocationAvailability(ctx);
                    return;
                }
                if (state.step === 6) {
                    if (msg && msg.toLowerCase() !== 'skip') {
                        state.data.locationAvailability = msg;
                        await save('locationAvailability', msg);
                    }
                    state.step = 7;
                    await askTone(ctx);
                    return;
                }
                if (state.step === 7) {
                    const t = (msg || '').toLowerCase();
                    state.data.tone = t.includes('friendly') ? 'friendly' : 'professional';
                    await save('tone', state.data.tone);
                    state.step = 8;
                    askLength(ctx);
                    return;
                }
                if (state.step === 8) {
                    const l = (msg || '').toLowerCase();
                    state.data.length = l.includes('short') ? 'short' : 'standard';
                    await save('length', state.data.length);
                    state.step = 9;
                    await askCTA(ctx);
                    return;
                }
                if (state.step === 9) {
                    state.data.cta = msg || '15-min chat';
                    await save('cta', state.data.cta);
                    state.step = 10;
                    await askSignature(ctx);
                    return;
                }
                if (state.step === 10) {
                    state.data.signature = msg;
                    await save('signature', msg);
                    // Default salutation selection based on recipient presence
                    state.data.salutation = state.data.recipient ? 'name' : 'manager';
                    await generateAndShow(ctx);
                    return;
                }
            },
            async onRegenerate(ctx) {
                if (!state.data.jd) { ctx._appendChatMessage('bot', 'Please provide the job description first.'); return; }
                await generateAndShow(ctx);
            },
            reset() { state.step = 0; state.data = {}; state.variants = null; }
        };
    }

    _flowAskPostContent() {
        const state = { lastContext: '' };
        return {
            start: 'Who is the author or what is the post topic? Provide a short context and I will create a message to request more details.',
            async onUserMessage(msg, ctx) {
                ctx._appendChatMessage('bot', 'Generating request...');
                try {
                    state.lastContext = msg;
                    const prompt = `Write a concise message asking an author for more details about their post. Context: ${msg}`;
                    const res = await AIAssistantAPI.generateContent(prompt, 'friendly', 'message');
                    const content = (res && (res.fullPost || res.content || JSON.stringify(res))) || String(res);
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Message generated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error generating request');
                }
            },
            async onRegenerate(ctx) {
                if (!state.lastContext) { ctx._appendChatMessage('bot', 'Please provide context first.'); return; }
                try {
                    const prompt = `Write a concise message asking an author for more details about their post. Context: ${state.lastContext}`;
                    const res = await AIAssistantAPI.generateContent(prompt, 'friendly', 'message');
                    const content = (res && (res.fullPost || res.content || JSON.stringify(res))) || String(res);
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Message regenerated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error regenerating message');
                }
            },
            reset() { state.lastContext = ''; }
        };
    }

    _flowAskCommentReply() {
        const state = { lastThread: '' };
        return {
            start: 'Paste the comment thread or the comment you want to reply to, and I will propose replies.',
            async onUserMessage(msg, ctx) {
                ctx._appendChatMessage('bot', 'Generating replies...');
                try {
                    state.lastThread = msg;
                    const reply = await AIAssistantAPI.generateInboxReply([{ text: msg, isOwn: false }], 'friendly', 'general');
                    const content = Array.isArray(reply) ? reply.map(r => r.text || JSON.stringify(r)).join('\n\n') : (reply.replies || JSON.stringify(reply));
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Replies generated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error generating replies');
                }
            },
            async onRegenerate(ctx) {
                if (!state.lastThread) { ctx._appendChatMessage('bot', 'Please paste the comment/thread first.'); return; }
                try {
                    const reply = await AIAssistantAPI.generateInboxReply([{ text: state.lastThread, isOwn: false }], 'friendly', 'general');
                    const content = Array.isArray(reply) ? reply.map(r => r.text || JSON.stringify(r)).join('\n\n') : (reply.replies || JSON.stringify(reply));
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Replies regenerated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error regenerating replies');
                }
            },
            reset() { state.lastThread = ''; }
        };
    }

    _flowRewriter() {
        const state = { lastText: '' };
        return {
            start: 'Paste the text you want rewritten and tell me the desired tone or instructions.',
            async onUserMessage(msg, ctx) {
                ctx._appendChatMessage('bot', 'Rewriting...');
                try {
                    state.lastText = msg;
                    const res = await AIAssistantAPI.rewriteText(msg, 'professional', '');
                    const content = res?.rewritten || res || 'Failed to rewrite';
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Rewritten text ready' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error rewriting text');
                }
            },
            async onRegenerate(ctx) {
                if (!state.lastText) { ctx._appendChatMessage('bot', 'Please paste text to rewrite first.'); return; }
                try {
                    const res = await AIAssistantAPI.rewriteText(state.lastText, 'professional', '');
                    const content = res?.rewritten || res || 'Failed to rewrite';
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Rewritten again' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error regenerating rewrite');
                }
            },
            reset() { state.lastText = ''; }
        };
    }

    _flowCustomPrompt() {
        const state = { lastPrompt: '' };
        return {
            start: 'Start a conversation with the assistant. Ask me anything or give a prompt.',
            async onUserMessage(msg, ctx) {
                ctx._appendChatMessage('bot', 'Thinking...');
                try {
                    state.lastPrompt = msg;
                    const res = await AIAssistantAPI.generateContent(msg, 'friendly', 'message');
                    const content = (res && (res.fullPost || res.content || JSON.stringify(res))) || String(res);
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Response ready' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error processing your prompt');
                }
            },
            async onRegenerate(ctx) {
                if (!state.lastPrompt) { ctx._appendChatMessage('bot', 'Please enter a prompt first.'); return; }
                try {
                    const res = await AIAssistantAPI.generateContent(state.lastPrompt, 'friendly', 'message');
                    const content = (res && (res.fullPost || res.content || JSON.stringify(res))) || String(res);
                    ctx._appendChatMessage('bot', content);
                    try { ctx._showResultActions(content, { hint: 'Response regenerated' }); } catch (e) {}
                } catch (e) {
                    ctx._appendChatMessage('bot', 'Error regenerating response');
                }
            },
            reset() { state.lastPrompt = ''; }
        };
    }

    closePanel() {
        if (!this.panel) return;
        this.panel.remove();
        this.panel = null;
        this.isOpen = false;
        document.removeEventListener('keydown', this._escapeHandler);
    }

    _handleShortcut(e) {
        const el = e.currentTarget;
        const action = el.dataset.action;
        switch (action) {
            case 'coverLetter':
                this._openInputModal('Write a Cover Letter', 'Paste the job description and any personal notes', async (input) => {
                    const result = await AIAssistantAPI.generateContent(input, 'professional', 'cover_letter');
                    this._showResultModal('Cover Letter', result);
                });
                break;
            case 'emailForJD':
                this._openInputModal('Write Email for JD', 'Paste the job description or link', async (input) => {
                    const result = await AIAssistantAPI.generateContent(input, 'professional', 'email');
                    this._showResultModal('Email', result);
                });
                break;
            case 'askPostContent':
                this._openInputModal('Ask for Post Content', 'Enter the author name or post topic', async (input) => {
                    const prompt = `Write a concise message asking for more details about this post: ${input}`;
                    const response = await AIAssistantAPI.generateContent(prompt, 'friendly', 'message');
                    this._showResultModal('Ask for Post Content', response);
                });
                break;
            case 'askCommentReply':
                this._openInputModal('Write a Reply / Ask Comment', 'Paste the comment thread or context', async (input) => {
                    const reply = await AIAssistantAPI.generateInboxReply([{ text: input, isOwn: false }], 'friendly', 'general');
                    this._showResultModal('Reply Options', reply);
                });
                break;
            case 'aiRewriterChat':
                // Trigger rewrite anywhere's UI if available
                if (window.AIRewriteAnywhere) {
                    this.triggerComponent('rewriteAnywhere');
                } else {
                    this._openInputModal('AI Rewriter', 'Paste text to rewrite', async (input) => {
                        const rewritten = await AIAssistantAPI.rewriteText(input, 'professional', '');
                        this._showResultModal('Rewritten', rewritten?.rewritten || rewritten);
                    });
                }
                break;
        }
    }

    triggerComponent(name) {
        // Try to call methods on global components created in content script
        try {
            const globalComp = window.linkedInAssistant?.components?.[name] || window.AIComponents?.[name] || null;
            if (globalComp) {
                if (name === 'postCreator' && globalComp.showPostCreatorPanel) {
                    globalComp.showPostCreatorPanel(document.activeElement);
                } else if (name === 'rewriteAnywhere' && globalComp.rewriteText) {
                    globalComp.rewriteText(document.activeElement);
                } else if (name === 'inboxAssistant' && globalComp.showSuggestions) {
                    globalComp.showSuggestions(document.activeElement);
                }
            } else {
                // Fallback: send a message to content script (content.js will handle)
                try { document.dispatchEvent(new CustomEvent('ai-bot-trigger', { detail: { name } })); } catch (e) {}
            }
        } catch (e) { console.error(e); }
    }

    _openInputModal(title, placeholder, onSubmit) {
        const overlay = document.createElement('div');
        overlay.className = 'ai-bot-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:10003';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;padding:16px;border-radius:8px;max-width:760px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.2)';
        modal.innerHTML = `<h3 style="margin:0 0 8px 0">${title}</h3><textarea placeholder="${placeholder}" style="width:100%;height:160px;padding:8px;border:1px solid #ddd;border-radius:6px"></textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="ai-modal-cancel" style="padding:8px 12px">Cancel</button><button class="ai-modal-submit" style="padding:8px 12px;background:#0077B5;color:white;border:none">Generate</button></div>`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('.ai-modal-cancel').addEventListener('click', () => overlay.remove());
        modal.querySelector('.ai-modal-submit').addEventListener('click', async () => {
            const input = modal.querySelector('textarea').value.trim();
            try {
                modal.querySelector('.ai-modal-submit').disabled = true;
                await onSubmit(input);
            } catch (e) {
                console.error(e);
            } finally {
                overlay.remove();
            }
        });
    }

    _showResultModal(title, result) {
        const overlay = document.createElement('div');
        overlay.className = 'ai-bot-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:10003';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;padding:16px;border-radius:8px;max-width:760px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-height:80vh;overflow:auto';
        const content = typeof result === 'string' ? result : (result && (result.fullPost || result.replies || result.rewritten || JSON.stringify(result))) || ''; 
    modal.innerHTML = `<h3 style="margin:0 0 8px 0">${title}</h3><pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;">${this._escapeHtml(String(content))}</pre><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="ai-modal-copy" style="padding:8px 12px">Copy</button></div>`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('.ai-modal-copy').addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(content); AIAssistantAPI.showSuccess('Copied to clipboard'); } catch (e) { console.error(e); }
        });

        

        modal.addEventListener('click', (ev) => ev.stopPropagation());
        overlay.addEventListener('click', () => overlay.remove());
    }

    _escapeHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
}

// Expose globally for content script to initialize
window.AIBotPanel = AIBotPanel;
