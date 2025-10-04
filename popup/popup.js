// LinkedIn AI Assistant Popup JavaScript
// Handles popup interface functionality, settings management, and extension state

class PopupManager {
    constructor() {
        this.settings = {};
        this.stats = {
            postsGenerated: 0,
            commentsAssisted: 0,
            messagesReplied: 0,
            monthlyUsage: 0,
            monthlyLimit: 500
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadStats();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'globalTone',
                'postCreatorEnabled',
                'commentSuggestionsEnabled',
                'commentRewriterEnabled',
                'inboxRepliesEnabled',
                'rewriteAnywhereEnabled',
                'hashtagGeneratorEnabled',
                'engagementBoostEnabled',
                'autoSummarizerEnabled',
                'translationEnabled'
            ]);

            this.settings = {
                globalTone: result.globalTone || 'professional',
                postCreatorEnabled: result.postCreatorEnabled !== false,
                commentSuggestionsEnabled: result.commentSuggestionsEnabled !== false,
                commentRewriterEnabled: result.commentRewriterEnabled || false,
                inboxRepliesEnabled: result.inboxRepliesEnabled !== false,
                rewriteAnywhereEnabled: result.rewriteAnywhereEnabled !== false,
                hashtagGeneratorEnabled: result.hashtagGeneratorEnabled || false,
                engagementBoostEnabled: result.engagementBoostEnabled !== false,
                autoSummarizerEnabled: result.autoSummarizerEnabled || false,
                translationEnabled: result.translationEnabled || false
            };
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get([
                'postsGenerated',
                'commentsAssisted',
                'messagesReplied',
                'monthlyUsage'
            ]);

            this.stats = {
                postsGenerated: result.postsGenerated || 0,
                commentsAssisted: result.commentsAssisted || 0,
                messagesReplied: result.messagesReplied || 0,
                monthlyUsage: result.monthlyUsage || 0,
                monthlyLimit: 500
            };
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    setupEventListeners() {
        // Global tone selector
        const globalToneSelect = document.getElementById('globalTone');
        if (globalToneSelect) {
            globalToneSelect.addEventListener('change', (e) => {
                this.settings.globalTone = e.target.value;
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

        // Other buttons
        const helpButton = document.querySelector('[data-testid="button-help"]');
        if (helpButton) {
            helpButton.addEventListener('click', () => this.showHelp());
        }

        const feedbackButton = document.querySelector('[data-testid="button-feedback"]');
        if (feedbackButton) {
            feedbackButton.addEventListener('click', () => this.showFeedback());
        }

        const privacyButton = document.querySelector('[data-testid="button-privacy"]');
        if (privacyButton) {
            privacyButton.addEventListener('click', () => this.showPrivacy());
        }

        const upgradeButton = document.querySelector('[data-testid="button-upgrade"]');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => this.showUpgrade());
        }

        const settingsButton = document.querySelector('[data-testid="button-settings"]');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => this.showSettings());
        }
    }

    updateUI() {
        // Update tone selector
        const globalToneSelect = document.getElementById('globalTone');
        if (globalToneSelect) {
            globalToneSelect.value = this.settings.globalTone;
        }

        // Update toggles
        Object.keys(this.settings).forEach(key => {
            if (key !== 'globalTone') {
                const toggle = document.getElementById(key);
                if (toggle) {
                    toggle.checked = this.settings[key];
                }
            }
        });

        // Update statistics
        this.updateStats();
    }

    updateStats() {
        const postsElement = document.querySelector('[data-testid="text-posts-generated"]');
        if (postsElement) {
            postsElement.textContent = this.stats.postsGenerated;
        }

        const commentsElement = document.querySelector('[data-testid="text-comments-assisted"]');
        if (commentsElement) {
            commentsElement.textContent = this.stats.commentsAssisted;
        }

        const messagesElement = document.querySelector('[data-testid="text-messages-replied"]');
        if (messagesElement) {
            messagesElement.textContent = this.stats.messagesReplied;
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
            console.log('Settings saved:', this.settings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async notifyContentScript() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('linkedin.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsUpdated',
                    settings: this.settings
                });
            }
        } catch (error) {
            console.error('Error notifying content script:', error);
        }
    }

    showSaveConfirmation(button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i><span>Saved!</span>';
        button.classList.add('btn-accent');
        button.classList.remove('btn-primary');

        setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('btn-accent');
            button.classList.add('btn-primary');
        }, 2000);
    }

    showHelp() {
        const helpContent = `
            <h3>LinkedIn AI Assistant Help</h3>
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul>
                <li>Ctrl+Shift+S - Get AI suggestions</li>
                <li>Ctrl+Shift+R - Rewrite current text</li>
            </ul>
            <p><strong>Features:</strong></p>
            <ul>
                <li><strong>AI Post Creator:</strong> Generates engaging LinkedIn posts with hooks and hashtags</li>
                <li><strong>Comment Suggestions:</strong> Provides 3-5 relevant comment ideas for any post</li>
                <li><strong>Comment Rewriter:</strong> Enhances your existing comments with better tone and clarity</li>
                <li><strong>Inbox Smart Replies:</strong> Suggests professional responses for LinkedIn messages</li>
                <li><strong>Rewrite Anywhere:</strong> Universal text enhancement tool for any editable field</li>
            </ul>
        `;
        this.showModal('Help', helpContent);
    }

    showFeedback() {
        chrome.tabs.create({
            url: 'https://forms.gle/linkedin-ai-assistant-feedback'
        });
    }

    showPrivacy() {
        chrome.tabs.create({
            url: 'https://linkedin-ai-assistant.com/privacy'
        });
    }

    showUpgrade() {
        chrome.tabs.create({
            url: 'https://linkedin-ai-assistant.com/upgrade'
        });
    }

    showSettings() {
        chrome.runtime.openOptionsPage();
    }

    showModal(title, content) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600;">${title}</h2>
                <button style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;" id="closeModal">&times;</button>
            </div>
            <div style="color: #333; line-height: 1.6;">${content}</div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal functionality
        const closeModal = () => {
            document.body.removeChild(overlay);
        };

        document.getElementById('closeModal').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Close on ESC key
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    // Listen for stats updates from content script
    async listenForUpdates() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updateStats') {
                this.stats = { ...this.stats, ...message.stats };
                this.updateStats();
                this.saveStats();
            }
        });
    }

    async saveStats() {
        try {
            await chrome.storage.local.set({
                postsGenerated: this.stats.postsGenerated,
                commentsAssisted: this.stats.commentsAssisted,
                messagesReplied: this.stats.messagesReplied,
                monthlyUsage: this.stats.monthlyUsage
            });
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const popupManager = new PopupManager();
    popupManager.listenForUpdates();
});

// Handle feature card hover effects
document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});
