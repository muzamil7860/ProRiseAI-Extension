// LinkedIn AI Assistant Popup JavaScript
// Handles popup interface functionality, settings management, and extension state

// Debug logging (set to false in production)
const DEBUG = false;
const log = (...args) => DEBUG && log(...args);
const logError = (...args) => DEBUG && logError(...args);

class PopupManager {
    constructor() {
        this.settings = {};
        this.stats = {
            postsGenerated: 0,
            commentsAssisted: 0,
            repliesAssisted: 0,
            messagesReplied: 0,
            rewritesGenerated: 0,
            monthlyUsage: 0,
            monthlyLimit: 500
        };
        this.currentPeriod = 'today';
        this.portalApiKey = null;
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadStats();
        
        // Check Portal API Key connection status
        const hasPortalKey = !!this.settings.portalApiKey;
        
        if (hasPortalKey) {
            // Validate the key in background
            this.validatePortalConnection();
        } else {
            // No key, show setup screen
            this.showSetupScreen();
        }
        
        // Always setup the main UI
        this.setupEventListeners();
        this.updateUI();
    }
    
    async validatePortalConnection() {
        try {
            const result = await this.validatePortalApiKey(this.settings.portalApiKey);
            if (!result.valid) {
                // Invalid key - show setup screen
                this.showSetupScreen();
            } else {
                // Valid connection - hide setup if showing
                this.hideSetupScreen();
            }
        } catch (error) {
            console.error('Portal connection check failed:', error);
            // On error, assume disconnected and show setup
            this.showSetupScreen();
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'portalApiKey',
                'openaiApiKey',
                'globalTone',
                'commentLength',
                'replyLength',
                'postCreatorEnabled',
                'commentSuggestionsEnabled',
                'commentRewriterEnabled',
                'inboxRepliesEnabled',
                'rewriteAnywhereEnabled',
                'hashtagGeneratorEnabled',
                'engagementBoostEnabled',
                'autoSummarizerEnabled',
                'translationEnabled',
                // keyword alerts
                'keywordAlertsEnabled', 'keywordList', 'alertSoundEnabled',
                // background crawler
                'backgroundScanEnabled', 'crawlIntervalSec',
                // WhatsApp
                'whatsappAlertsEnabled', 'whatsappPhone'
            ]);

            this.settings = {
                portalApiKey: result.portalApiKey || '',
                openaiApiKey: result.openaiApiKey || '',
                globalTone: result.globalTone || 'professional',
                commentLength: result.commentLength || 'medium',
                replyLength: result.replyLength || 'short',
                postCreatorEnabled: result.postCreatorEnabled !== false,
                commentSuggestionsEnabled: result.commentSuggestionsEnabled !== false,
                commentRewriterEnabled: result.commentRewriterEnabled || false,
                inboxRepliesEnabled: result.inboxRepliesEnabled !== false,
                rewriteAnywhereEnabled: result.rewriteAnywhereEnabled !== false,
                hashtagGeneratorEnabled: result.hashtagGeneratorEnabled || false,
                engagementBoostEnabled: result.engagementBoostEnabled !== false,
                autoSummarizerEnabled: result.autoSummarizerEnabled || false,
                translationEnabled: result.translationEnabled || false,
                // keyword alerts
                keywordAlertsEnabled: result.keywordAlertsEnabled !== false,
                keywordList: Array.isArray(result.keywordList) ? result.keywordList : ['developer','wordpress'],
                alertSoundEnabled: result.alertSoundEnabled !== false,
                // background crawler
                backgroundScanEnabled: result.backgroundScanEnabled !== false,
                crawlIntervalSec: Number(result.crawlIntervalSec || 60),
                // WhatsApp
                whatsappAlertsEnabled: !!result.whatsappAlertsEnabled,
                whatsappPhone: result.whatsappPhone || ''
            };
        } catch (error) {
            logError('Error loading settings:', error);
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get([
                'postsGenerated',
                'commentsAssisted',
                'repliesAssisted',
                'messagesReplied',
                'rewritesGenerated',
                'monthlyUsage',
                'statsHistory'
            ]);

            this.stats = {
                postsGenerated: result.postsGenerated || 0,
                commentsAssisted: result.commentsAssisted || 0,
                repliesAssisted: result.repliesAssisted || 0,
                messagesReplied: result.messagesReplied || 0,
                rewritesGenerated: result.rewritesGenerated || 0,
                monthlyUsage: result.monthlyUsage || 0,
                monthlyLimit: 500
            };
            
            this.statsHistory = result.statsHistory || this.initStatsHistory();
        } catch (error) {
            logError('Error loading stats:', error);
        }
    }

    initStatsHistory() {
        const today = new Date().toDateString();
        return {
            daily: { [today]: { posts: 0, comments: 0, replies: 0, messages: 0, rewrites: 0 } },
            weekly: {},
            monthly: {}
        };
    }

    showSetupScreen() {
        const setupScreen = document.getElementById('setupScreen');
        if (setupScreen) {
            setupScreen.style.display = 'flex';
            this.setupSetupScreenEventListeners();
        }
    }

    hideSetupScreen() {
        const setupScreen = document.getElementById('setupScreen');
        if (setupScreen) {
            setupScreen.style.display = 'none';
        }
    }

    setupSetupScreenEventListeners() {
        const setupToggleBtn = document.getElementById('setupToggleKey');
        const setupApiKeyInput = document.getElementById('setupPortalApiKey');
        const setupContinueBtn = document.getElementById('setupContinueBtn');
        const setupSkipBtn = document.getElementById('setupSkipBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        const errorMessageDiv = document.getElementById('setupErrorMessage');

        // Toggle API key visibility
        if (setupToggleBtn && setupApiKeyInput) {
            setupToggleBtn.addEventListener('click', () => {
                const isPassword = setupApiKeyInput.type === 'password';
                setupApiKeyInput.type = isPassword ? 'text' : 'password';
                setupToggleBtn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            });
        }

        // Clear error on input change
        if (setupApiKeyInput && errorMessageDiv) {
            setupApiKeyInput.addEventListener('input', () => {
                errorMessageDiv.style.display = 'none';
                errorMessageDiv.textContent = '';
            });
        }

        // Continue button - validate and save Portal API Key
        if (setupContinueBtn && setupApiKeyInput) {
            setupContinueBtn.addEventListener('click', async () => {
                const apiKey = setupApiKeyInput.value.trim();

                if (!apiKey) {
                    this.showSetupError(errorMessageDiv, 'Please enter your Portal API Key');
                    return;
                }

                // Show loading state
                setupContinueBtn.classList.add('loading');
                setupContinueBtn.disabled = true;
                const originalHTML = setupContinueBtn.innerHTML;
                setupContinueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Validating...</span>';

                try {
                    // Validate Portal API Key with backend
                    const validationResult = await this.validatePortalApiKey(apiKey);

                    if (validationResult.valid) {
                        // Save Portal API Key
                        this.settings.portalApiKey = apiKey;
                        await this.saveSettings();

                        // Show success message
                        this.showSetupSuccess(errorMessageDiv, 'Connected successfully! 🎉');

                        // Update UI to show success
                        setupContinueBtn.innerHTML = '<i class="fas fa-check"></i> <span>Connected!</span>';
                        setupContinueBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

                        // Transition to main UI immediately
                        setTimeout(() => {
                            this.hideSetupScreen();
                            this.setupEventListeners();
                            this.updateUI();
                        }, 500);
                    } else {
                        throw new Error(validationResult.message || 'Invalid API Key');
                    }
                } catch (error) {
                    console.error('API Key validation error:', error);
                    this.showSetupError(errorMessageDiv, error.message || 'Failed to validate API Key');
                    
                    // Reset button
                    setupContinueBtn.classList.remove('loading');
                    setupContinueBtn.disabled = false;
                    setupContinueBtn.innerHTML = originalHTML;
                    setupContinueBtn.style.background = '';
                }
            });
        }

        // Skip button
        if (setupSkipBtn) {
            setupSkipBtn.addEventListener('click', () => {
                this.hideSetupScreen();
                this.setupEventListeners();
                this.updateUI();
            });
        }

        // Dashboard link
        if (dashboardLink) {
            dashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: 'http://localhost:3001/settings' });
            });
        }
    }

    showSetupError(errorDiv, message) {
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
        errorDiv.classList.remove('success');
        errorDiv.style.display = 'flex';
    }

    showSetupSuccess(errorDiv, message) {
        errorDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        errorDiv.classList.add('success');
        errorDiv.style.display = 'flex';
    }

    async validatePortalApiKey(apiKey) {
        try {
            // Determine which endpoint to use based on environment
            // Try localhost first for development
            const endpoints = [
                'http://localhost:3001/api/extension/validate',
                'http://localhost:3001/api/extension/validate',
                'https://api.prorise.ai/api/extension/validate'
            ];

            let lastError = null;

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ apiKey })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        return {
                            valid: data.valid !== false,
                            user: data.user
                        };
                    } else if (response.status === 401 || response.status === 400 || response.status === 403) {
                        return {
                            valid: false,
                            message: data.message || 'Invalid or expired API Key'
                        };
                    }
                    // If response is not ok but also not auth error, try next endpoint
                } catch (error) {
                    lastError = error;
                    continue;
                }
            }

            // If all endpoints failed, return error
            if (lastError) {
                throw new Error('Unable to connect to portal. Please ensure the dashboard is running at http://localhost:3000');
            }

            return {
                valid: false,
                message: 'Could not reach portal server'
            };
        } catch (error) {
            console.error('Validation error:', error);
            return {
                valid: false,
                message: error.message || 'Unable to connect to portal. Please check your internet connection.'
            };
        }
    }

    getStatsForPeriod(period) {
        const now = new Date();
        const today = now.toDateString();
        
        if (period === 'today') {
            return this.statsHistory.daily[today] || { posts: 0, comments: 0, replies: 0, messages: 0, rewrites: 0 };
        } else if (period === 'week') {
            // Sum last 7 days
            let stats = { posts: 0, comments: 0, replies: 0, messages: 0, rewrites: 0 };
            for (let i = 0; i < 7; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayKey = date.toDateString();
                const dayStats = this.statsHistory.daily[dayKey];
                if (dayStats) {
                    stats.posts += dayStats.posts || 0;
                    stats.comments += dayStats.comments || 0;
                    stats.replies += dayStats.replies || 0;
                    stats.messages += dayStats.messages || 0;
                    stats.rewrites += dayStats.rewrites || 0;
                }
            }
            return stats;
        } else if (period === 'month') {
            // Sum last 30 days
            let stats = { posts: 0, comments: 0, replies: 0, messages: 0, rewrites: 0 };
            for (let i = 0; i < 30; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayKey = date.toDateString();
                const dayStats = this.statsHistory.daily[dayKey];
                if (dayStats) {
                    stats.posts += dayStats.posts || 0;
                    stats.comments += dayStats.comments || 0;
                    stats.replies += dayStats.replies || 0;
                    stats.messages += dayStats.messages || 0;
                    stats.rewrites += dayStats.rewrites || 0;
                }
            }
            return stats;
        }
    }

    setupEventListeners() {
        // API Key toggle visibility
        const toggleApiKeyBtn = document.getElementById('toggleApiKey');
        const apiKeyInput = document.getElementById('openaiApiKey');
        if (toggleApiKeyBtn && apiKeyInput) {
            toggleApiKeyBtn.addEventListener('click', () => {
                const isPassword = apiKeyInput.type === 'password';
                apiKeyInput.type = isPassword ? 'text' : 'password';
                toggleApiKeyBtn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            });
        }

        // API Key input
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                this.settings.openaiApiKey = e.target.value.trim();
                this.saveSettings();
            });
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Time period filter
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                this.switchTimePeriod(period);
            });
        });

        // Global tone selector
        const globalToneSelect = document.getElementById('globalTone');
        if (globalToneSelect) {
            globalToneSelect.addEventListener('change', (e) => {
                this.settings.globalTone = e.target.value;
                this.saveSettings();
            });
        }

        // Comment length selector
        const commentLengthSelect = document.getElementById('commentLength');
        if (commentLengthSelect) {
            commentLengthSelect.addEventListener('change', (e) => {
                this.settings.commentLength = e.target.value;
                this.saveSettings();
            });
        }

        // Reply length selector
        const replyLengthSelect = document.getElementById('replyLength');
        if (replyLengthSelect) {
            replyLengthSelect.addEventListener('change', (e) => {
                this.settings.replyLength = e.target.value;
                this.saveSettings();
            });
        }

        // Feature toggles
        const toggles = [
            'postCreatorEnabled',
            'commentSuggestionsEnabled',
            'commentRewriterEnabled',
            'inboxRepliesEnabled',
            'rewriteAnywhereEnabled',
            'hashtagGeneratorEnabled',
            'engagementBoostEnabled',
            'autoSummarizerEnabled',
            'translationEnabled'
        ];

        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.settings[toggleId] = e.target.checked;
                    this.saveSettings();
                    this.notifyContentScript();
                });
            }
        });

        // Save settings button
        const saveButton = document.querySelector('[data-testid="button-save-settings"]');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveSettings();
                this.showSaveConfirmation(saveButton);
            });
        }

        // Help button
        const helpButton = document.querySelector('[data-testid="button-help"]');
        if (helpButton) {
            helpButton.addEventListener('click', () => this.showHelp());
        }

        // Privacy button
        const privacyButton = document.querySelector('[data-testid="button-privacy"]');
        if (privacyButton) {
            privacyButton.addEventListener('click', () => this.showPrivacy());
        }

        // Upgrade button
        const upgradeButton = document.querySelector('[data-testid="button-upgrade"]');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => this.showUpgrade());
        }

        // Keyword Alerts UI handlers
        const kwEnabled = document.getElementById('kw-enabled');
        const kwSound = document.getElementById('kw-sound');
        const kwList = document.getElementById('kw-list');
        const bgEnabled = document.getElementById('bg-enabled');
        const bgInterval = document.getElementById('bg-interval');
        const kwSave = document.getElementById('kw-save');
        const waEnabled = document.getElementById('wa-enabled');
        const waPhone = document.getElementById('wa-phone');
        const waTest = document.getElementById('wa-test');

        if (kwSave) {
            kwSave.addEventListener('click', async () => {
                this.settings.keywordAlertsEnabled = !!kwEnabled.checked;
                this.settings.alertSoundEnabled = !!kwSound.checked;
                this.settings.keywordList = (kwList.value || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                this.settings.backgroundScanEnabled = !!bgEnabled.checked;
                this.settings.crawlIntervalSec = Math.max(30, Number(bgInterval.value || 60));
                this.settings.whatsappAlertsEnabled = !!waEnabled.checked;
                this.settings.whatsappPhone = (waPhone.value || '').replace(/\D/g, '');
                await this.saveSettings();
                this.notifyContentScript();
                // Ask background to re-evaluate crawler
                try { chrome.runtime.sendMessage({ action: 'settingsUpdated' }); } catch (e) {}
                this.showSaveConfirmation(kwSave);
            });
        }

        if (waTest) {
            waTest.addEventListener('click', async () => {
                const phone = (waPhone.value || '').replace(/\D/g, '');
                if (!phone) { alert('Enter WhatsApp phone with country code'); return; }
                try {
                    await chrome.runtime.sendMessage({ action: 'testWhatsApp', phone });
                } catch (e) {}
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
    }

    switchTimePeriod(period) {
        this.currentPeriod = period;
        
        // Update time buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        // Update stats display
        this.updateStats();
    }

    updateUI() {
        // Update tone selector
        const globalToneSelect = document.getElementById('globalTone');
        if (globalToneSelect) {
            globalToneSelect.value = this.settings.globalTone;
        }

        // Update comment length selector
        const commentLengthSelect = document.getElementById('commentLength');
        if (commentLengthSelect) {
            commentLengthSelect.value = this.settings.commentLength;
        }

        // Update reply length selector
        const replyLengthSelect = document.getElementById('replyLength');
        if (replyLengthSelect) {
            replyLengthSelect.value = this.settings.replyLength;
        }

        // Update toggles
        Object.keys(this.settings).forEach(key => {
            if (key !== 'globalTone' && key !== 'commentLength' && key !== 'replyLength') {
                const toggle = document.getElementById(key);
                if (toggle) {
                    toggle.checked = this.settings[key];
                }
            }
        });

        // Update statistics
        this.updateStats();

        // API Key input
        const apiKeyInput = document.getElementById('openaiApiKey');
        if (apiKeyInput) {
            apiKeyInput.value = this.settings.openaiApiKey || '';
        }

        // Keyword Alerts UI values
        const kwEnabled = document.getElementById('kw-enabled');
        const kwSound = document.getElementById('kw-sound');
        const kwList = document.getElementById('kw-list');
        const bgEnabled = document.getElementById('bg-enabled');
        const bgInterval = document.getElementById('bg-interval');
        if (kwEnabled) kwEnabled.checked = !!this.settings.keywordAlertsEnabled;
        if (kwSound) kwSound.checked = !!this.settings.alertSoundEnabled;
        if (kwList) kwList.value = (this.settings.keywordList || []).join(', ');
        if (bgEnabled) bgEnabled.checked = !!this.settings.backgroundScanEnabled;
        if (bgInterval) bgInterval.value = this.settings.crawlIntervalSec || 60;
        const waEnabled = document.getElementById('wa-enabled');
        const waPhone = document.getElementById('wa-phone');
        if (waEnabled) waEnabled.checked = !!this.settings.whatsappAlertsEnabled;
        if (waPhone) waPhone.value = this.settings.whatsappPhone || '';
    }

    updateStats() {
        const stats = this.getStatsForPeriod(this.currentPeriod);

        const postsElement = document.querySelector('[data-testid="text-posts-generated"]');
        if (postsElement) {
            postsElement.textContent = stats.posts || 0;
        }

        const commentsElement = document.querySelector('[data-testid="text-comments-assisted"]');
        if (commentsElement) {
            commentsElement.textContent = stats.comments || 0;
        }

        const repliesElement = document.querySelector('[data-testid="text-replies-assisted"]');
        if (repliesElement) {
            repliesElement.textContent = stats.replies || 0;
        }

        const messagesElement = document.querySelector('[data-testid="text-messages-replied"]');
        if (messagesElement) {
            messagesElement.textContent = stats.messages || 0;
        }

        const rewritesElement = document.querySelector('[data-testid="text-rewrites-generated"]');
        if (rewritesElement) {
            rewritesElement.textContent = stats.rewrites || 0;
        }

        const monthlyUsageElement = document.querySelector('[data-testid="text-monthly-usage"]');
        if (monthlyUsageElement) {
            monthlyUsageElement.textContent = `${this.stats.monthlyUsage} / ${this.stats.monthlyLimit}`;
        }

        const progressElement = document.querySelector('[data-testid="progress-usage"]');
        if (progressElement) {
            const percentage = (this.stats.monthlyUsage / this.stats.monthlyLimit) * 100;
            progressElement.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set(this.settings);
        } catch (error) {
            logError('Error saving settings:', error);
        }
    }

    notifyContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'settingsUpdated',
                    settings: this.settings
                }).catch(() => {
                    // Ignore errors if content script not loaded
                });
            }
        });
    }

    showSaveConfirmation(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> <span>Saved!</span>';
        button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    showHelp() {
        const helpContent = `
🤖 LinkedIn AI Assistant Help

FEATURES:
• Post Creator: Generate engaging posts
• Comment Suggestions: Get smart comment ideas
• Reply Suggestions: Quick replies to comments  
• Inbox Assistant: Smart message responses
• Rewrite Anywhere: Enhance any text

KEYBOARD SHORTCUTS:
• Ctrl+Shift+S: Get AI suggestions
• Ctrl+Shift+R: Rewrite current text

SETTINGS:
• Configure tone, length, and features
• Stats track your usage by day/week/month

Need more help? Contact support!
        `.trim();

        alert(helpContent);
    }

    showPrivacy() {
        const privacyInfo = `
🔒 Privacy Policy

Your privacy is important to us:

• All AI processing is done via OpenAI API
• No data is stored on our servers
• Usage stats are stored locally only
• API key is configured in extension
• No tracking or analytics

For full privacy policy, visit our website.
        `.trim();

        alert(privacyInfo);
    }

    showUpgrade() {
        const upgradeInfo = `
✨ Upgrade to Pro

Get unlimited access to:
• Unlimited AI generations
• Priority support
• Advanced features
• Custom tone presets
• Team collaboration

Coming soon! Stay tuned.
        `.trim();

        alert(upgradeInfo);
    }
}

// Initialize popup manager
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
