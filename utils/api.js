// --------------------
// API Utilities for LinkedIn AI Assistant
// --------------------
class APIService {
    constructor() {
        this.requestTimeout = 1200000; // 20 minutes
    }

    async sendMessage(action, data = {}) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout);

            chrome.runtime.sendMessage({ action, ...data }, (response) => {
                clearTimeout(timeout);

                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response?.error || 'Unknown error occurred'));
                }
            });
        });
    }

    async generateContent(topic, tone, contentType = 'post') {
        try {
            const response = await this.sendMessage('generateContent', { topic, tone, contentType });
            return response.content;
        } catch (error) {
            console.error('Error generating content:', error);
            throw this.handleError(error);
        }
    }

    async rewriteText(text, tone, instructions = '') {
        try {
            const response = await this.sendMessage('rewriteText', { text, tone, instructions });
            return response.rewrittenText;
        } catch (error) {
            console.error('Error rewriting text:', error);
            throw this.handleError(error);
        }
    }

    async generateCommentSuggestions(postContent, tone, authorName = '') {
        try {
            const response = await this.sendMessage('generateCommentSuggestions', { postContent, tone, authorName });
            return response.suggestions;
        } catch (error) {
            console.error('Error generating comment suggestions:', error);
            throw this.handleError(error);
        }
    }

    async generateInboxReply(conversationHistory, tone, messageType = 'general') {
        try {
            const response = await this.sendMessage('generateInboxReply', { conversationHistory, tone, messageType });
            return response.replies;
        } catch (error) {
            console.error('Error generating inbox reply:', error);
            throw this.handleError(error);
        }
    }

    async generateHashtags(content, industry = '') {
        try {
            const response = await this.sendMessage('generateHashtags', { content, industry });
            return response.hashtags;
        } catch (error) {
            console.error('Error generating hashtags:', error);
            throw this.handleError(error);
        }
    }

    async summarizeText(text, maxLength = 50) {
        try {
            const response = await this.sendMessage('summarizeText', { text, maxLength });
            return response.summary;
        } catch (error) {
            console.error('Error summarizing text:', error);
            throw this.handleError(error);
        }
    }

    async translateText(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            const response = await this.sendMessage('translateText', { text, targetLanguage, sourceLanguage });
            return response.translation;
        } catch (error) {
            console.error('Error translating text:', error);
            throw this.handleError(error);
        }
    }

    async updateStats(statType) {
        try {
            await this.sendMessage('updateStats', { statType });
        } catch (error) {
            console.error('Error updating stats:', error);
            // Don't throw for stats updates
        }
    }

    handleError(error) {
        const message = error.message || '';

        if (message.includes('API key')) {
            return new Error('Please configure your OpenAI API key in the extension settings.');
        }

        if (message.includes('quota') || message.includes('limit')) {
            return new Error('API usage limit reached. Please try again later.');
        }

        if (message.includes('timeout')) {
            return new Error('Request timed out. Check your internet connection.');
        }

        if (message.includes('rate limit')) {
            return new Error('Too many requests. Please wait and try again.');
        }

        return new Error('An error occurred while processing your request. Please try again.');
    }

    // --------------------
    // Notification Utilities
    // --------------------

    showError(error, container) {
        const el = document.createElement('div');
        el.className = 'ai-assistant-error';
        el.style.cssText = `
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 0.75rem;
            border-radius: 0.375rem;
            margin: 0.5rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        el.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
            </svg>
            <span>${error.message}</span>
            <button style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;font-size:1.25rem;" onclick="this.parentElement.remove()">×</button>
        `;
        if (container) container.insertBefore(el, container.firstChild);
        setTimeout(() => el.remove(), 5000);
        return el;
    }

    showSuccess(message, container) {
        const el = document.createElement('div');
        el.className = 'ai-assistant-success';
        el.style.cssText = `
            background: #d1fae5;
            border: 1px solid #a7f3d0;
            color: #059669;
            padding: 0.75rem;
            border-radius: 0.375rem;
            margin: 0.5rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        el.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${message}</span>
        `;
        if (container) container.insertBefore(el, container.firstChild);
        setTimeout(() => el.remove(), 3000);
        return el;
    }

    showLoading(message = 'Generating...', container) {
        const el = document.createElement('div');
        el.className = 'ai-assistant-loading';
        el.style.cssText = `
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #374151;
            padding: 0.75rem;
            border-radius: 0.375rem;
            margin: 0.5rem 0;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        el.innerHTML = `
            <div style="width:16px;height:16px;border:2px solid #d1d5db;border-top:2px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <span>${message}</span>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        if (container) container.insertBefore(el, container.firstChild);
        return el;
    }
}

// Create a global instance
window.AIAssistantAPI = new APIService();
