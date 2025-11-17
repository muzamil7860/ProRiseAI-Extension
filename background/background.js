// LinkedIn AI Assistant Background Service Worker
// Handles API calls, message routing, and extension lifecycle

// Debug logging (set to false in production)
const DEBUG = false;
const log = (...args) => DEBUG && log(...args);
const logError = (...args) => DEBUG && logError(...args);
const logWarn = (...args) => DEBUG && logWarn(...args);

class BackgroundService {
    constructor() {
        this.floatingButtons = [];
        this.crawlerTabId = null;
        this.crawlerTimer = null;
        this.init();
    }

    init() {
        this.setupMessageListeners();
        this.setupCommandListeners();
        this.setupInstallListener();
        this.setupAlarms();
        this.ensureCrawler();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'injectScript':
                    (async () => {
                        try {
                            const tabId = sender?.tab?.id || message.tabId;
                            if (!tabId) return sendResponse({ success: false, error: 'No tab id' });
                            await chrome.scripting.executeScript({
                                target: { tabId },
                                files: [message.file]
                            });
                            sendResponse({ success: true });
                        } catch (err) {
                            logError('injectScript failed', err);
                            sendResponse({ success: false, error: err?.message || String(err) });
                        }
                    })();
                    return true;
                case 'testWhatsApp':
                    (async () => {
                        try {
                            await this.sendWhatsApp(message.phone, 'Test from LinkedIn AI Assistant');
                            sendResponse({ success: true });
                        } catch (error) {
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;
                case 'keywordAlert':
                    (async () => {
                        try {
                            await this.showKeywordNotification(message.matched, message.preview);
                            sendResponse({ success: true });
                        } catch (error) {
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;
                case 'generateContent':
                    (async () => {
                        try {
                            const prompt = this.buildContentPrompt(message.topic, message.tone, message.contentType);
                            const response = await this.callOpenAIContent(prompt, 'generateContent');
                            await this.updateUsageStats('postsGenerated');
                            sendResponse({ success: true, content: response });
                        } catch (error) {
                            logError('Error generating content:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'rewriteText':
                    (async () => {
                        try {
                            const prompt = this.buildRewritePrompt(message.text, message.tone, message.instructions);
                            const response = await this.callOpenAI(prompt, 'rewriteText');
                            await this.updateUsageStats('rewritesGenerated');
                            sendResponse({ success: true, rewrittenText: response });
                        } catch (error) {
                            logError('Error rewriting text:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateCommentSuggestions':
                    (async () => {
                        try {
                            const prompt = this.buildCommentSuggestionsPrompt(message.postContent, message.tone, message.authorName, message.commentLength);
                            const response = await this.callOpenAI(prompt, 'generateComments');
                            await this.updateUsageStats('commentsAssisted');
                            sendResponse({ success: true, suggestions: response });
                        } catch (error) {
                            logError('Error generating comment suggestions:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateReplySuggestions':
                    (async () => {
                        try {
                            const prompt = this.buildReplySuggestionsPrompt(message.postContent, message.parentComment, message.commentAuthor, message.tone, message.replyLength);
                            const response = await this.callOpenAI(prompt, 'generateReplies');
                            await this.updateUsageStats('repliesAssisted');
                            sendResponse({ success: true, suggestions: response });
                        } catch (error) {
                            logError('Error generating reply suggestions:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateInboxReply':
                    (async () => {
                        try {
                            const prompt = this.buildInboxReplyPrompt(message.conversationHistory, message.tone, message.messageType);
                            const response = await this.callOpenAI(prompt, 'generateReply');
                            await this.updateUsageStats('messagesReplied');
                            sendResponse({ success: true, replies: response });
                        } catch (error) {
                            logError('Error generating inbox reply:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateInboxReplyMinimal':
                    (async () => {
                        try {
                            const prompt = this.buildInboxReplyMinimalPrompt(message.messages, message.tone, message.context);
                            const response = await this.callOpenAI(prompt, 'inboxReply');
                            sendResponse({ success: true, reply: response?.reply || response });
                        } catch (error) {
                            logError('Error generating minimal inbox reply:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generatePostMinimal':
                    (async () => {
                        try {
                            const prompt = this.buildPostMinimalPrompt(message.minimalPrompt);
                            const response = await this.callOpenAI(prompt, 'linkedinPost');
                            await this.updateUsageStats('postsGenerated');
                            
                            // Ensure we extract the post content properly
                            let postContent = '';
                            if (typeof response === 'string') {
                                postContent = response;
                            } else if (response && response.post) {
                                postContent = response.post;
                            } else if (response && typeof response === 'object') {
                                // Fallback: try to find text content in the response
                                postContent = response.content || response.text || response.fullPost || JSON.stringify(response);
                            } else {
                                postContent = 'Failed to generate post content';
                            }
                            
                            sendResponse({ success: true, post: postContent });
                        } catch (error) {
                            logError('Error generating minimal post:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateWithPrompt':
                    (async () => {
                        try {
                            const response = await this.callOpenAIContent(message.prompt, 'freePrompt');
                            sendResponse({ success: true, content: response });
                        } catch (error) {
                            logError('Error generating with prompt:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateHashtags':
                    (async () => {
                        try {
                            const prompt = this.buildHashtagPrompt(message.content, message.industry);
                            const response = await this.callOpenAI(prompt, 'generateHashtags');
                            sendResponse({ success: true, hashtags: response });
                        } catch (error) {
                            logError('Error generating hashtags:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'summarizeText':
                    (async () => {
                        try {
                            const prompt = this.buildSummarizePrompt(message.text, message.maxLength);
                            const response = await this.callOpenAI(prompt, 'summarizeText');
                            sendResponse({ success: true, summary: response });
                        } catch (error) {
                            logError('Error summarizing text:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'translateText':
                    (async () => {
                        try {
                            const prompt = this.buildTranslatePrompt(message.text, message.targetLanguage, message.sourceLanguage);
                            const response = await this.callOpenAI(prompt, 'translateText');
                            sendResponse({ success: true, translation: response });
                        } catch (error) {
                            logError('Error translating text:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'updateStats':
                    (async () => {
                        try {
                            await this.updateUsageStats(message.statType);
                            sendResponse({ success: true });
                        } catch (error) {
                            logError('Error updating stats:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                default:
                    log('Unknown action:', message.action);
            }
        });
    }

    setupAlarms() {
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'ai-crawl') {
                this.runCrawlerTick();
            }
        });
    }

    setupCommandListeners() {
        chrome.commands.onCommand.addListener((command) => {
            switch (command) {
                case 'get-suggestions':
                    this.handleGetSuggestions();
                    break;
                case 'rewrite-text':
                    this.handleRewriteTextCommand();
                    break;
            }
        });
    }

    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });
    }

    async handleFirstInstall() {
        const defaultSettings = {
            globalTone: 'professional',
            postCreatorEnabled: true,
            commentSuggestionsEnabled: true,
            commentRewriterEnabled: false,
            inboxRepliesEnabled: true,
            rewriteAnywhereEnabled: true,
            hashtagGeneratorEnabled: false,
            engagementBoostEnabled: true,
            autoSummarizerEnabled: false,
            translationEnabled: false
        };

        await chrome.storage.sync.set(defaultSettings);

        const initialStats = {
            postsGenerated: 0,
            commentsAssisted: 0,
            repliesAssisted: 0,
            messagesReplied: 0,
            rewritesGenerated: 0,
            monthlyUsage: 0,
            installDate: Date.now(),
            statsHistory: {
                daily: {},
                weekly: {},
                monthly: {}
            }
        };

        await chrome.storage.local.set(initialStats);

        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }

    async handleUpdate(previousVersion) {
        log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    }

    async ensureCrawler() {
        try {
            const settings = await chrome.storage.sync.get(['backgroundScanEnabled', 'crawlIntervalSec']);
            if (!settings.backgroundScanEnabled) {
                chrome.alarms.clear('ai-crawl');
                this.crawlerTabId = null;
                return;
            }

            const interval = Math.max(30, Number(settings.crawlIntervalSec) || 60); // min 30s
            chrome.alarms.create('ai-crawl', { periodInMinutes: interval / 60 });
        } catch (e) {}
    }

    async runCrawlerTick() {
        try {
            // Create or reuse a pinned, muted, inactive tab on LinkedIn feed
            if (!this.crawlerTabId) {
                const tab = await chrome.tabs.create({ url: 'https://www.linkedin.com/feed/', active: false, pinned: true });
                this.crawlerTabId = tab.id;
            }

            // Execute scanning script in the crawler tab
            await chrome.scripting.executeScript({
                target: { tabId: this.crawlerTabId },
                func: () => {
                    try {
                        // Auto-scroll a bit to load new posts
                        window.scrollBy({ top: 1200, behavior: 'smooth' });
                        setTimeout(() => window.scrollBy({ top: -800, behavior: 'smooth' }), 1200);

                        const keywords = (window.__aiKeywords || []);
                        const posts = document.querySelectorAll('.feed-shared-text, .feed-shared-update-v2__description, article .break-words');
                        const matches = [];
                        posts.forEach(p => {
                            if (p.dataset.aiAlerted === '1') return;
                            const full = (p.innerText || p.textContent || '');
                            const t = full.toLowerCase();
                            const hasKw = keywords.some(k => t.includes(k));
                            const hiring = t.includes('hiring') || t.includes('hire') || t.includes('project') || t.includes('looking for');
                            if (hasKw && hiring) {
                                p.dataset.aiAlerted = '1';
                                let url = '';
                                const article = p.closest('article') || p.closest('[data-urn]');
                                const a = article && (article.querySelector('a[href*="/feed/update/"]') || article.querySelector('a[href*="/posts/"]'));
                                if (a && a.href) { url = a.href.split('?')[0]; }
                                matches.push({ preview: full.slice(0, 260), url });
                            }
                        });
                        return matches;
                    } catch (e) { return []; }
                }
            }).then(async (results) => {
                const matches = (results && results[0] && results[0].result) || [];
                if (matches.length) {
                    const settings = await chrome.storage.sync.get(['whatsappAlertsEnabled','whatsappPhone']);
                    for (const m of matches) {
                        await this.showKeywordNotification('feed match', m.preview, m.url);
                        if (settings.whatsappAlertsEnabled && settings.whatsappPhone) {
                            const msg = `LinkedIn Hiring Match\n\n${m.preview}\n\n${m.url || ''}`.trim();
                            await this.sendWhatsApp(settings.whatsappPhone, msg);
                        }
                    }
                }
            });

            // Sync keywords for next tick
            const s = await chrome.storage.sync.get(['keywordList']);
            const kws = (s.keywordList || []).map(k => String(k).toLowerCase());
            await chrome.scripting.executeScript({
                target: { tabId: this.crawlerTabId },
                args: [kws],
                func: (kwsArg) => { window.__aiKeywords = kwsArg; }
            });
        } catch (e) {
            // If tab closed, reset and recreate on next tick
            this.crawlerTabId = null;
        }
    }

    async getApiKey() {
        const result = await chrome.storage.sync.get('openaiApiKey');
        return result.openaiApiKey;
    }

    async callOpenAI(prompt) {
        const OPENAI_API_KEY = await this.getApiKey();
        
        if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
            throw new Error('OpenAI API key not configured. Please add your API key in the extension settings.');
        }

        const model = "gpt-4o-mini"; // low token, cheap, supports JSON
        const payload = {
            model,
            messages: [
                { role: "system", content: "You are a professional LinkedIn content assistant. Provide responses in JSON format as requested." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 500
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        try {
            return JSON.parse(content);
        } catch (parseError) {
            logError("Failed to parse OpenAI response:", content);
            throw new Error("Invalid JSON response from OpenAI");
        }
    }

    // Looser variant for content generation: if JSON parse fails, return raw content string so UI can recover.
    async callOpenAIContent(prompt) {
        const OPENAI_API_KEY = await this.getApiKey();
        
        if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
            throw new Error('OpenAI API key not configured. Please add your API key in the extension settings.');
        }
        
        const model = "gpt-4o-mini";
        const payload = {
            model,
            messages: [
                { role: "system", content: "You are a professional LinkedIn content assistant. Provide responses in JSON format as requested." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 500
        };
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        try {
            return JSON.parse(content);
        } catch (e) {
            logWarn('Returning raw content for generateContent due to JSON parse error');
            return content;
        }
    }

    async showKeywordNotification(matched, preview, url) {
        // Requires notifications permission in manifest
        const title = `Keyword match: ${matched}`;
        const message = preview || 'Matching post detected on your feed';
        try {
            chrome.notifications.create('', {
                type: 'basic',
                iconUrl: 'icons/icon-128.png',
                title,
                message,
                buttons: [
                    { title: 'Copy Link' },
                    { title: 'Open Post' }
                ],
                contextMessage: url || ''
            });
        } catch (e) {
            // Fallback: try attention sound via HTMLAudioElement in SW is not supported; rely on client tab
        }

        // Try to ping active LinkedIn tab to play a short beep
        try {
            const [tab] = await chrome.tabs.query({ active: true });
            if (tab) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        try {
                            const ctx = new (window.AudioContext || window.webkitAudioContext)();
                            const o = ctx.createOscillator();
                            const g = ctx.createGain();
                            o.type = 'sine';
                            o.frequency.value = 880; // A5
                            o.connect(g);
                            g.connect(ctx.destination);
                            g.gain.setValueAtTime(0.0001, ctx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
                            o.start();
                            setTimeout(() => {
                                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
                                o.stop(ctx.currentTime + 0.06);
                            }, 120);
                        } catch (e) {}
                    }
                });
            }
        } catch (e) {}
    }

    async sendWhatsApp(phone, text) {
        const encoded = encodeURIComponent(text);
        const url = `https://wa.me/${phone}?text=${encoded}`;
        // Open a small inactive tab for WhatsApp Web deep link
        try {
            await chrome.tabs.create({ url, active: false });
        } catch (e) {
            throw new Error('Failed to open WhatsApp.');
        }
    }

    // --- Prompts ---
    buildContentPrompt(topic, tone, contentType) {
        const toneDescriptions = {
            professional: "formal, business-appropriate, and industry-focused",
            friendly: "warm, approachable, and conversational",
            persuasive: "compelling, action-oriented, and convincing",
            storytelling: "narrative-driven, engaging, and personal",
            humorous: "light-hearted, witty, and entertaining"
        };

        return `Create LinkedIn ${contentType} content about "${topic}" in a ${toneDescriptions[tone]} tone.

Please provide a JSON response with the following structure:
{
    "hook": "An attention-grabbing opening line",
    "shortDescription": "A brief 1-2 sentence summary",
    "fullPost": "Complete LinkedIn post content with proper formatting",
    "hashtags": ["relevant", "linkedin", "hashtags"],
    "callToAction": "Engaging call-to-action"
}

Make the content professional, engaging, and suitable for LinkedIn audience. Include line breaks and emojis where appropriate.`;
    }

    buildRewritePrompt(text, tone, instructions) {
        const toneDescriptions = {
            professional: "professional and polished",
            friendly: "warm and approachable", 
            persuasive: "compelling and action-oriented",
            concise: "brief and to the point",
            detailed: "comprehensive and thorough",
            casual: "relaxed and conversational",
            roman_urdu_to_english: "translate Roman Urdu to proper English"
        };
        
        // Special handling for Roman Urdu translation
        if (tone === 'roman_urdu_to_english') {
            return `Translate this Roman Urdu text to proper English:

Text: "${text}"

Please provide natural, fluent English translation that maintains the original meaning and context.

Provide a JSON response with:
{
    "rewritten": "English translation here",
    "tone": "english"
}`;
        }
        
        return `Rewrite the following text to be ${toneDescriptions[tone]}:

Original text: "${text}"

${instructions ? `Additional instructions: ${instructions}` : ''}

Provide a JSON response with:
{
    "rewritten": "The rewritten text here",
    "tone": "${tone}"
}

Keep the core message intact while adjusting the tone and style as requested.`;
    }

    buildCommentSuggestionsPrompt(postContent, tone, authorName, commentLength = 'medium') {
        const lengthGuidelines = {
            short: '1-2 sentences (10-20 words)',
            medium: '2-3 sentences (20-40 words)', 
            long: '3-4 sentences (40-60 words)'
        };
        
        const toneDescriptions = {
            supportive: 'encouraging and positive',
            professional: 'formal and business-appropriate',
            friendly: 'warm and personable',
            inquisitive: 'curious and question-asking',
            insightful: 'thoughtful and value-adding'
        };
        
        return `You are a LinkedIn user crafting authentic, engaging comments. Analyze the post carefully and generate 5 REALISTIC comment suggestions that sound human and contextually appropriate.

Post content: "${postContent}"
${authorName ? `Post author: ${authorName}` : ''}

CRITICAL REQUIREMENTS:
1. Read and understand the post's main topic, sentiment, and key points
2. Match the post's context - if it's about achievements, congratulate; if it's asking for advice, offer insights; if it's sharing news, react appropriately
3. Sound like a real person, not a bot - use natural language, occasional contractions, and authentic reactions
4. Avoid generic phrases like "Great post!" or "Thanks for sharing" - be SPECIFIC to the post content
5. Reference actual details from the post to show you read it
6. Length: ${lengthGuidelines[commentLength]}
7. Tone: ${toneDescriptions[tone] || 'professional and engaging'}

EXAMPLES OF REALISTIC VS GENERIC:
❌ Generic: "Great insights! Thanks for sharing this valuable content."
✅ Realistic: "The point about remote work flexibility really resonates - we've seen a 40% increase in productivity since implementing hybrid schedules."

❌ Generic: "Congratulations on your achievement!"
✅ Realistic: "Wow, 5 years at Microsoft! That's incredible. I'd love to hear about your most memorable project during this journey."

❌ Generic: "Very informative post."
✅ Realistic: "The data on AI adoption rates is eye-opening. Do you think the 67% increase will continue, or are we reaching a plateau?"

Provide a JSON response with:
{
    "suggestions": [
        {
            "text": "Specific, contextual comment that references the post content",
            "type": "supportive|question|insight|personal|congratulatory|agreement|story"
        }
    ]
}

Generate 5 DIVERSE comments with different approaches - mix questions, personal experiences, insights, and reactions. Make each feel authentic and human.`;
    }

    buildReplySuggestionsPrompt(postContent, parentComment, commentAuthor, tone, replyLength = 'short') {
        const lengthGuidelines = {
            short: '1-2 sentences (10-25 words)',
            medium: '2-3 sentences (25-40 words)'
        };
        
        return `Generate 5 different reply suggestions for this comment thread:

Original post: "${postContent}"
Comment to reply to: "${parentComment}"
${commentAuthor ? `Comment author: ${commentAuthor}` : ''}
Reply length: ${lengthGuidelines[replyLength]}

Provide a JSON response with:
{
    "suggestions": [
        {
            "text": "Reply text here",
            "type": "supportive|question|insight|personal|congratulatory"
        }
    ]
}

Make replies contextual, engaging, and appropriate for LinkedIn professional discussions.`;
    }

    buildInboxReplyPrompt(conversationHistory, tone, messageType) {
        const toneDescriptions = {
            professional: "professional and courteous",
            friendly: "warm and personable",
            persuasive: "compelling and clear",
            storytelling: "engaging and personal",
            humorous: "appropriate and light"
        };
        // If tone not recognized or 'all' requested, ask for varied tones
        let toneDesc = toneDescriptions[tone];
        if (!toneDesc || tone === 'all') {
            toneDesc = 'varied (provide a mix of professional, friendly, and brief options)';
        }

                // Few-shot, strict JSON output with examples to reduce echoing and improve relevance
                return `You are a LinkedIn assistant. For the conversation below, produce exactly 5 distinct reply options the user ("You") could send next.

Requirements:
- Reply in the requested tone: ${toneDesc}.
- Provide exactly 5 different replies, each with a different style (for example: brief, friendly, detailed, inquisitive, concise).
- Do NOT repeat or verbatim echo previous messages.
- If the last message contains a question, answer it directly in at least one reply.
- Output must be valid JSON ONLY. Do not include any explanations, notes or additional text.

ConversationHistory:
${JSON.stringify(conversationHistory)}

EXAMPLE (valid JSON output):
{
    "replies": [
        { "text": "Thanks for the update — I can help. When would you like to discuss?", "type": "brief", "sentiment": "neutral" },
        { "text": "Appreciate you reaching out. I’m available this week for a quick call to go over the details.", "type": "detailed", "sentiment": "positive" },
        { "text": "Could you share a few more details about the scope? Happy to jump on a short call.", "type": "question", "sentiment": "interested" },
        { "text": "Sounds great — if you can send a quick summary of goals, I’ll prepare a suggested agenda.", "type": "concise", "sentiment": "helpful" },
        { "text": "Thanks! I’m excited to learn more — would you prefer a 15 or 30 minute call?", "type": "friendly", "sentiment": "positive" }
    ]
}

Now OUTPUT ONLY the JSON object with the key \"replies\" matching the example schema for this conversation. No additional text.`;
    }

    buildInboxReplyMinimalPrompt(messages, tone, context) {
        const toneDescriptions = {
            professional: 'professional and courteous',
            friendly: 'warm and personable', 
            brief: 'concise and direct',
            detailed: 'comprehensive and thorough'
        };
        
        const conversationSummary = messages.map(msg =>
            `${msg.isOwn ? 'You' : 'Them'}: "${msg.text}"
        `).join('\n');
        
        const urgencyNote = context.urgency === 'high' ? 
            'This requires an urgent response.' : '';
        
        return `You are replying as "You" in this LinkedIn conversation. Read the conversation carefully and write a single reply message that YOU would send next.

Conversation:
${conversationSummary}

Notes:
- Do NOT repeat or verbatim echo the previous messages.
- Keep the reply natural, human, and appropriate for LinkedIn.
- If the last message contains a question, answer it directly; otherwise, keep it concise and professional.
${urgencyNote}
Tone: ${toneDescriptions[tone]}
Context: ${context.subject || 'General networking'}

Provide a JSON response with:
{
    "reply": "Your reply text here"
}

Make the reply appropriate for LinkedIn professional networking.`;
    }

    buildPostMinimalPrompt(minimalInput) {
        // Parse input format: "topic|details|tone|length|includeEmoji|engagementLevel"
        const parts = minimalInput.split('|');
        const topic = parts[0] || '';
        const details = parts[1] || '';
        const tone = parts[2] || 'professional';
        const length = parts[3] || 'medium';
        const includeEmoji = parts[4] === 'true';
        const engagementLevel = parts[5] || 'medium';
        
        const toneDescriptions = {
            professional: 'professional and authoritative',
            friendly: 'warm and approachable',
            persuasive: 'compelling and action-oriented',
            storytelling: 'engaging and narrative-driven',
            humorous: 'light and entertaining',
            motivational: 'inspiring and energetic',
            educational: 'informative and clear',
            thought_provoking: 'insightful and discussion-worthy'
        };
        
        const lengthGuidelines = {
            short: '50-100 words',
            medium: '100-200 words', 
            long: '200-300 words'
        };
        
        const engagementStrategies = {
            low: 'subtle engagement',
            medium: 'moderate engagement with questions or calls to action',
            high: 'strong engagement hooks and clear calls to action'
        };
        
        return `Create a LinkedIn post about: ${topic}
${details ? `Additional context: ${details}` : ''}

Requirements:
- Tone: ${toneDescriptions[tone]}
- Length: ${lengthGuidelines[length]}
- Engagement level: ${engagementStrategies[engagementLevel]}
- Include emojis: ${includeEmoji}
- Format for LinkedIn professional audience
- Include relevant hashtags
- Add engagement hooks if specified

Provide a JSON response with:
{
    "content": "The main post content here",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
    "engagement_hooks": ["Hook 1", "Hook 2"]
}`;
    }

    buildHashtagPrompt(content, industry) {
        return `Generate relevant LinkedIn hashtags for this content:

Content: "${content}"
${industry ? `Industry: ${industry}` : ''}

Provide a JSON response with:
{
    "hashtags": [
        {
            "tag": "hashtag without #",
            "category": "industry|skill|trending|general",
            "popularity": "high|medium|low"
        }
    ]
}

Include 8-12 hashtags mixing popular and niche tags for optimal reach.`;
    }

    buildSummarizePrompt(text, maxLength) {
        return `Summarize this LinkedIn post/article to ${maxLength || 'approximately 50'} words:

Text: "${text}"

Provide a JSON response with:
{
    "summary": "Concise summary here",
    "keyPoints": ["main", "points", "from", "text"],
    "wordCount": 45
}

Maintain the core message and professional tone.`;
    }

    buildTranslatePrompt(text, targetLanguage, sourceLanguage) {
        return `Translate this text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}:

Text: "${text}"

Provide a JSON response with:
{
    "translation": "Translated text here",
    "sourceLanguage": "detected source language",
    "targetLanguage": "${targetLanguage}",
    "confidence": 0.95
}

Maintain professional tone and LinkedIn context.`;
    }

    async updateUsageStats(statType) {
        try {
            const result = await chrome.storage.local.get([statType, 'monthlyUsage', 'statsHistory']);
            const updates = {
                [statType]: (result[statType] || 0) + 1,
                monthlyUsage: (result.monthlyUsage || 0) + 1
            };
            
            // Update daily stats
            const today = new Date().toDateString();
            const statsHistory = result.statsHistory || { daily: {}, weekly: {}, monthly: {} };
            if (!statsHistory.daily[today]) {
                statsHistory.daily[today] = { posts: 0, comments: 0, replies: 0, messages: 0, rewrites: 0 };
            }
            
            // Map stat types to history fields
            const statMap = {
                postsGenerated: 'posts',
                commentsAssisted: 'comments',
                repliesAssisted: 'replies',
                messagesReplied: 'messages',
                rewritesGenerated: 'rewrites'
            };
            
            if (statMap[statType]) {
                statsHistory.daily[today][statMap[statType]]++;
            }
            
            updates.statsHistory = statsHistory;
            await chrome.storage.local.set(updates);

            try {
                chrome.runtime.sendMessage({ action: 'statsUpdated', stats: updates });
            } catch (error) {}
        } catch (error) {
            logError('Error updating stats:', error);
        }
    }

    async handleGetSuggestions() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('linkedin.com')) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['contentScript.js']
                });
                chrome.tabs.sendMessage(tab.id, { action: 'getSuggestions' });
            }
        } catch (error) {
            logError('Error handling get suggestions command:', error);
        }
    }

    async handleRewriteTextCommand() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('linkedin.com')) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['contentScript.js']
                });
                chrome.tabs.sendMessage(tab.id, { action: 'rewriteCurrentText' });
            }
        } catch (error) {
            logError('Error handling rewrite text command:', error);
        }
    }
}

// Initialize background service
new BackgroundService();
