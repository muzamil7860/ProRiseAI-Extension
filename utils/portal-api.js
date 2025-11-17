// ProRise Portal API Integration
// Replaces direct OpenAI calls with portal-based API

const DEBUG = false;
const log = (...args) => DEBUG && console.log(...args);
const logError = (...args) => DEBUG && console.error(...args);

class PortalAPIService {
    constructor() {
        this.portalUrl = 'http://localhost:3000'; // Change to production URL
        this.apiKey = null;
        this.userData = null;
        this.usageLimits = null;
    }

    /**
     * Set the portal base URL
     */
    setPortalUrl(url) {
        this.portalUrl = url;
    }

    /**
     * Set user API key from extension settings
     */
    async setApiKey(apiKey) {
        this.apiKey = apiKey;
        await this.validateAndSync();
    }

    /**
     * Validate API key and sync user data with portal
     */
    async validateAndSync() {
        if (!this.apiKey) {
            throw new Error('Portal API key not configured');
        }

        try {
            const response = await fetch(`${this.portalUrl}/api/extension/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey: this.apiKey }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API key validation failed');
            }

            const data = await response.json();
            this.userData = data.user;
            this.usageLimits = {
                limits: data.plan.limits,
                usage: data.usage,
                remaining: data.remaining,
            };

            log('Portal sync successful:', data);
            return data;
        } catch (error) {
            logError('Portal validation error:', error);
            throw error;
        }
    }

    /**
     * Check if user has remaining usage for specific action
     */
    canPerformAction(actionType) {
        if (!this.usageLimits) {
            return { allowed: false, reason: 'Not synced with portal' };
        }

        const { remaining } = this.usageLimits;

        if (remaining.total <= 0) {
            return { 
                allowed: false, 
                reason: 'Monthly usage limit reached',
                limit: this.usageLimits.limits.totalUsageLimit,
            };
        }

        const actionMap = {
            'POST_CREATED': 'posts',
            'COMMENT_ENHANCED': 'comments',
            'REPLY_SUGGESTED': 'replies',
            'TEXT_REWRITTEN': 'rewrites',
        };

        const limitType = actionMap[actionType];
        if (limitType && remaining[limitType] <= 0) {
            return {
                allowed: false,
                reason: `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} limit reached`,
                limit: this.usageLimits.limits[`${limitType}Limit`],
            };
        }

        return { allowed: true };
    }

    /**
     * Track usage with portal
     */
    async trackUsage(action, details = {}) {
        if (!this.apiKey) {
            throw new Error('Portal API key not configured');
        }

        try {
            const response = await fetch(`${this.portalUrl}/api/extension/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    action,
                    details,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Usage tracking failed');
            }

            const data = await response.json();
            
            // Update local cache
            this.usageLimits.usage = data.usage;
            this.usageLimits.remaining = data.remaining;

            log('Usage tracked:', data);
            return data;
        } catch (error) {
            logError('Usage tracking error:', error);
            throw error;
        }
    }

    /**
     * Generate content through portal (optional - can still use OpenAI directly)
     */
    async generateContent(prompt, action, details = {}) {
        // Check if user can perform action
        const canPerform = this.canPerformAction(action);
        if (!canPerform.allowed) {
            throw new Error(canPerform.reason);
        }

        try {
            // Track usage
            await this.trackUsage(action, { prompt, ...details });

            // Return success - actual generation happens via OpenAI in background.js
            return { success: true };
        } catch (error) {
            logError('Generate content error:', error);
            throw error;
        }
    }

    /**
     * Get current usage status
     */
    getUsageStatus() {
        return this.usageLimits;
    }

    /**
     * Get user data
     */
    getUserData() {
        return this.userData;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.PortalAPI = new PortalAPIService();
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortalAPIService;
}
