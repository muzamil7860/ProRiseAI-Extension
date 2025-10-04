// LinkedIn AI Assistant Content Script
// Main coordinator for all AI features on LinkedIn

class LinkedInAIAssistant {
    constructor() {
        this.settings = {};
        this.components = {};
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            // Wait for page to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Load settings
            await this.loadSettings();

            // Initialize components
            this.initializeComponents();

            // Setup message listeners
            this.setupMessageListeners();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Start monitoring for new elements
            this.startMonitoring();

            this.isInitialized = true;
            console.log('LinkedIn AI Assistant initialized successfully');

        } catch (error) {
            console.error('Error initializing LinkedIn AI Assistant:', error);
        }
    }

    async loadSettings() {
        this.settings = await AIAssistantStorage.getSettings();
    }

    initializeComponents() {
        // Initialize all AI components
        if (this.settings.postCreatorEnabled) {
            this.components.postCreator = new AIPostCreator(this.settings);
        }

        if (this.settings.commentSuggestionsEnabled || this.settings.commentRewriterEnabled) {
            this.components.commentEnhancer = new AICommentEnhancer(this.settings);
        }

        if (this.settings.inboxRepliesEnabled) {
            this.components.inboxAssistant = new AIInboxAssistant(this.settings);
        }

        if (this.settings.rewriteAnywhereEnabled) {
            this.components.rewriteAnywhere = new AIRewriteAnywhere(this.settings);
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'settingsUpdated':
                    this.handleSettingsUpdate(message.settings);
                    break;

                case 'getSuggestions':
                    this.handleGetSuggestions();
                    break;

                case 'rewriteCurrentText':
                    this.handleRewriteCurrentText();
                    break;

                default:
                    console.log('Unknown message action:', message.action);
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S - Get suggestions
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.handleGetSuggestions();
            }

            // Ctrl+Shift+R - Rewrite text
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.handleRewriteCurrentText();
            }
        });
    }

    startMonitoring() {
        // Monitor for new post composers
        AIAssistantDOM.observeChanges(AIAssistantDOM.selectors.postComposer, (element) => {
            if (this.components.postCreator) {
                this.components.postCreator.attachToComposer(element);
            }
        });

        // Monitor for new comment boxes
        AIAssistantDOM.observeChanges(AIAssistantDOM.selectors.commentBoxes, (element) => {
            if (this.components.commentEnhancer) {
                this.components.commentEnhancer.attachToCommentBox(element);
            }
        });

        // Monitor for new message composers
        AIAssistantDOM.observeChanges(AIAssistantDOM.selectors.messageComposer, (element) => {
            if (this.components.inboxAssistant) {
                this.components.inboxAssistant.attachToMessageComposer(element);
            }
        });

        // Monitor for all editable elements for rewrite anywhere
        AIAssistantDOM.observeChanges(AIAssistantDOM.selectors.editableElements, (element) => {
            if (this.components.rewriteAnywhere) {
                this.components.rewriteAnywhere.attachToElement(element);
            }
        });

        // Also initialize existing elements
        this.initializeExistingElements();
    }

    initializeExistingElements() {
        // Initialize existing post composers
        document.querySelectorAll(AIAssistantDOM.selectors.postComposer).forEach(element => {
            if (this.components.postCreator) {
                this.components.postCreator.attachToComposer(element);
            }
        });

        // Initialize existing comment boxes
        document.querySelectorAll(AIAssistantDOM.selectors.commentBoxes).forEach(element => {
            if (this.components.commentEnhancer) {
                this.components.commentEnhancer.attachToCommentBox(element);
            }
        });

        // Initialize existing message composers
        document.querySelectorAll(AIAssistantDOM.selectors.messageComposer).forEach(element => {
            if (this.components.inboxAssistant) {
                this.components.inboxAssistant.attachToMessageComposer(element);
            }
        });

        // Initialize existing editable elements for rewrite anywhere
        document.querySelectorAll(AIAssistantDOM.selectors.editableElements).forEach(element => {
            if (this.components.rewriteAnywhere && AIAssistantDOM.isEditable(element)) {
                this.components.rewriteAnywhere.attachToElement(element);
            }
        });
    }

    handleSettingsUpdate(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        // Update or reinitialize components based on new settings
        Object.keys(this.components).forEach(componentKey => {
            if (this.components[componentKey] && this.components[componentKey].updateSettings) {
                this.components[componentKey].updateSettings(this.settings);
            }
        });

        // Enable/disable components based on settings
        this.reinitializeComponents();
    }

    reinitializeComponents() {
        // Clean up existing components
        Object.values(this.components).forEach(component => {
            if (component && component.cleanup) {
                component.cleanup();
            }
        });

        // Reinitialize based on current settings
        this.components = {};
        this.initializeComponents();
        this.initializeExistingElements();
    }

    handleGetSuggestions() {
        const activeElement = document.activeElement;
        
        if (!activeElement || !AIAssistantDOM.isEditable(activeElement)) {
            this.showNotification('Please focus on a text input field first', 'info');
            return;
        }

        // Determine context and get appropriate suggestions
        if (this.isInPostComposer(activeElement)) {
            if (this.components.postCreator) {
                this.components.postCreator.showSuggestions(activeElement);
            }
        } else if (this.isInCommentBox(activeElement)) {
            if (this.components.commentEnhancer) {
                this.components.commentEnhancer.showSuggestions(activeElement);
            }
        } else if (this.isInMessageComposer(activeElement)) {
            if (this.components.inboxAssistant) {
                this.components.inboxAssistant.showSuggestions(activeElement);
            }
        } else {
            // General suggestions for any editable element
            if (this.components.rewriteAnywhere) {
                this.components.rewriteAnywhere.showSuggestions(activeElement);
            }
        }
    }

    handleRewriteCurrentText() {
        const activeElement = document.activeElement;
        
        if (!activeElement || !AIAssistantDOM.isEditable(activeElement)) {
            this.showNotification('Please focus on a text input field first', 'info');
            return;
        }

        const currentText = AIAssistantDOM.getEditableText(activeElement);
        
        if (!currentText.trim()) {
            this.showNotification('Please enter some text to rewrite', 'info');
            return;
        }

        // Use rewrite anywhere component for text rewriting
        if (this.components.rewriteAnywhere) {
            this.components.rewriteAnywhere.rewriteText(activeElement, currentText);
        }
    }

    isInPostComposer(element) {
        return element.closest(AIAssistantDOM.selectors.postComposer.split(', ')[0]) !== null;
    }

    isInCommentBox(element) {
        return element.closest(AIAssistantDOM.selectors.commentBoxes.split(', ')[0]) !== null;
    }

    isInMessageComposer(element) {
        return element.closest(AIAssistantDOM.selectors.messageComposer.split(', ')[0]) !== null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ai-assistant-notification ai-assistant-notification-${type}`;
        
        const colors = {
            info: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },
            success: { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
            warning: { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' },
            error: { bg: '#ffebee', border: '#f44336', text: '#d32f2f' }
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type].bg};
            border: 1px solid ${colors[type].border};
            color: ${colors[type].text};
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                if (style.parentElement) {
                    style.remove();
                }
            }, 300);
        }, 3000);
    }

    // Cleanup method
    cleanup() {
        AIAssistantDOM.cleanup();
        
        Object.values(this.components).forEach(component => {
            if (component && component.cleanup) {
                component.cleanup();
            }
        });
        
        this.components = {};
        this.isInitialized = false;
    }
}

// Initialize when page loads
if (window.location.href.includes('linkedin.com')) {
    const assistant = new LinkedInAIAssistant();
    
    // Handle page navigation (LinkedIn is SPA)
    let currentUrl = window.location.href;
    
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            
            // Reinitialize on page change
            setTimeout(() => {
                if (assistant.isInitialized) {
                    assistant.cleanup();
                    assistant.init();
                }
            }, 1000);
        }
    }, 1000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        assistant.cleanup();
    });
}
