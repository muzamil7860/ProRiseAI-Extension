// LinkedIn AI Assistant Background Service Worker
// Handles API calls, message routing, and extension lifecycle

const OPENAI_API_KEY = "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"; // Replace with actual API key

class BackgroundService {
    constructor() {
        this.floatingButtons = [];
        this.init();
    }

    init() {
        this.setupMessageListeners();
        this.setupCommandListeners();
        this.setupInstallListener();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
            switch (message.action) {
                case 'generateContent':
                    (async () => {
                        try {
                            const prompt = this.buildContentPrompt(message.topic, message.tone, message.contentType);
                            const response = await this.callOpenAI(prompt, 'generateContent');
                            await this.updateUsageStats('postsGenerated');
                            sendResponse({ success: true, content: response });
                        } catch (error) {
                            console.error('Error generating content:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'rewriteText':
                    (async () => {
                        try {
                            const prompt = this.buildRewritePrompt(message.text, message.tone, message.instructions);
                            const response = await this.callOpenAI(prompt, 'rewriteText');
                            sendResponse({ success: true, rewrittenText: response });
                        } catch (error) {
                            console.error('Error rewriting text:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                case 'generateCommentSuggestions':
                    (async () => {
                        try {
                            const prompt = this.buildCommentSuggestionsPrompt(message.postContent, message.tone, message.authorName);
                            const response = await this.callOpenAI(prompt, 'generateComments');
                            await this.updateUsageStats('commentsAssisted');
                            sendResponse({ success: true, suggestions: response });
                        } catch (error) {
                            console.error('Error generating comment suggestions:', error);
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
                            console.error('Error generating inbox reply:', error);
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
                            console.error('Error generating hashtags:', error);
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
                            console.error('Error summarizing text:', error);
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
                            console.error('Error translating text:', error);
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
                            console.error('Error updating stats:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    })();
                    return true;

                default:
                    console.log('Unknown action:', message.action);
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
            messagesReplied: 0,
            monthlyUsage: 0,
            installDate: Date.now()
        };

        await chrome.storage.local.set(initialStats);

        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    }

    async handleUpdate(previousVersion) {
        console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    }

    async callOpenAI(prompt) {
        if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-your-openai-api-key-here") {
            throw new Error('OpenAI API key not configured. Please add your API key to the extension.');
        }

        const model = "gpt-4.1-mini"; // low token, cheap, supports JSON
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
            console.error("Failed to parse OpenAI response:", content);
            throw new Error("Invalid JSON response from OpenAI");
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
            professional: "more formal and business-appropriate",
            friendly: "warmer and more conversational",
            persuasive: "more compelling and action-oriented",
            storytelling: "more narrative and engaging",
            humorous: "lighter and more entertaining"
        };

        let prompt = `Rewrite the following text to be ${toneDescriptions[tone]}:

Original text: "${text}"`;

        if (instructions) {
            prompt += `\n\nAdditional instructions: ${instructions}`;
        }

        prompt += `\n\nProvide a JSON response with:
{
    "rewritten": "The improved version of the text",
    "improvements": ["list", "of", "key", "improvements", "made"],
    "tone": "${tone}"
}`;

        return prompt;
    }

    buildCommentSuggestionsPrompt(postContent, tone, authorName) {
        const toneDescriptions = {
            professional: "professional and insightful",
            friendly: "warm and supportive",
            persuasive: "thought-provoking and engaging",
            storytelling: "personal and relatable",
            humorous: "light and entertaining"
        };

        return `Generate 5 different comment suggestions for this LinkedIn post in a ${toneDescriptions[tone]} tone:

Post content: "${postContent}"
${authorName ? `Author: ${authorName}` : ''}

Provide a JSON response with:
{
    "suggestions": [
        {
            "text": "Comment text here",
            "type": "supportive|question|insight|personal_experience|congratulatory",
            "length": "short|medium|long"
        }
    ]
}

Make comments authentic, valuable, and likely to generate engagement. Vary the types and lengths.`;
    }

    buildInboxReplyPrompt(conversationHistory, tone, messageType) {
        const toneDescriptions = {
            professional: "professional and courteous",
            friendly: "warm and personable",
            persuasive: "compelling and clear",
            storytelling: "engaging and personal",
            humorous: "appropriate and light"
        };

        return `Generate 3 different reply options for this LinkedIn message in a ${toneDescriptions[tone]} tone:

Conversation history: ${JSON.stringify(conversationHistory)}
Message type: ${messageType}

Provide a JSON response with:
{
    "replies": [
        {
            "text": "Reply text here",
            "type": "brief|detailed|question",
            "sentiment": "positive|neutral|interested"
        }
    ]
}

Make replies appropriate for LinkedIn professional networking context.`;
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
            const result = await chrome.storage.local.get([statType, 'monthlyUsage']);
            const updates = {
                [statType]: (result[statType] || 0) + 1,
                monthlyUsage: (result.monthlyUsage || 0) + 1
            };
            await chrome.storage.local.set(updates);

            try {
                chrome.runtime.sendMessage({ action: 'statsUpdated', stats: updates });
            } catch (error) {}
        } catch (error) {
            console.error('Error updating stats:', error);
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
            console.error('Error handling get suggestions command:', error);
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
            console.error('Error handling rewrite text command:', error);
        }
    }
}

// Initialize background service
new BackgroundService();
