// DOM utilities for LinkedIn AI Assistant
// Handles DOM manipulation and element detection

class DOMService {
    constructor() {
        this.observers = new Map();
        this.selectors = {
            // Post creation
            postComposer: '[data-test-id="share-box-placeholder"], [data-test-id="share-box-text-editor"], .share-creation-state__text-editor, .ql-editor[data-placeholder*="Start a post"]',
            postSubmitButton: '[data-test-id="share-actions-submit-button"], .share-actions__primary-action',
            
            // Comments
            commentBoxes: '.comments-comment-box__text-editor, .comments-comment-texteditor .ql-editor, [data-placeholder*="Add a comment"]',
            commentSubmitButton: '.comments-comment-box__submit-button, .comments-comment-texteditor__submit',
            commentThreads: '.comments-comment-item, .comment',
            
            // Messaging/Inbox
            messageComposer: '.msg-form__contenteditable, .compose-form__message-texteditor .ql-editor, [data-placeholder*="Write a message"]',
            messageSubmitButton: '.msg-form__send-button, .compose-form__send-button',
            conversationList: '.msg-conversation-listitem, .conversation-item',
            messageThread: '.msg-s-message-list-content, .message-thread',
            
            // General text areas
            editableElements: '[contenteditable="true"], textarea, input[type="text"]',
            
            // Post content
            postContent: '.feed-shared-text, .feed-shared-update-v2__description, article .break-words',
            postAuthor: '.feed-shared-actor__name, .update-components-actor__name',
            
            // Navigation
            feedContainer: '.core-rail, .scaffold-layout__main',
            messagingContainer: '.msg-overlay-bubble-header, .messaging-tab',
        };
    }

    // Wait for element to appear in DOM
    waitForElement(selector, timeout = 5000, parent = document) {
        return new Promise((resolve, reject) => {
            const element = parent.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                const element = parent.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(parent, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Wait for multiple elements
    async waitForElements(selectors, timeout = 5000, parent = document) {
        const promises = selectors.map(selector => 
            this.waitForElement(selector, timeout, parent).catch(() => null)
        );
        
        const results = await Promise.all(promises);
        return results.filter(element => element !== null);
    }

    // Find the closest editable element
    findEditableElement(startElement) {
        let current = startElement;
        
        while (current && current !== document.body) {
            if (this.isEditable(current)) {
                return current;
            }
            current = current.parentElement;
        }
        
        return null;
    }

    // Check if element is editable
    isEditable(element) {
        if (!element) return false;
        
        return element.contentEditable === 'true' ||
               element.tagName === 'TEXTAREA' ||
               (element.tagName === 'INPUT' && element.type === 'text');
    }

    // Get text content from editable element
    getEditableText(element) {
        if (!element) return '';
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            return element.value;
        }
        
        if (element.contentEditable === 'true') {
            return element.textContent || element.innerText || '';
        }
        
        return '';
    }

    // Set text content in editable element
    setEditableText(element, text) {
        if (!element) return false;
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        
        if (element.contentEditable === 'true') {
            element.textContent = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        
        return false;
    }

    // Insert text at cursor position
    insertTextAtCursor(element, text) {
        if (!element) return false;
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            const start = element.selectionStart;
            const end = element.selectionEnd;
            const currentValue = element.value;
            
            element.value = currentValue.slice(0, start) + text + currentValue.slice(end);
            element.selectionStart = element.selectionEnd = start + text.length;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        
        if (element.contentEditable === 'true') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
        }
        
        return false;
    }

    // Create floating button
    createFloatingButton(options = {}) {
        const button = document.createElement('button');
        button.className = 'ai-assistant-floating-btn';
        button.innerHTML = options.icon || '✨';
        button.title = options.title || 'AI Assistant';
        
        button.style.cssText = `
            position: absolute;
            top: ${options.top || '8px'};
            right: ${options.right || '8px'};
            width: 32px;
            height: 32px;
            border-radius: 16px;
            border: none;
            background: linear-gradient(135deg, #0077B5, #00A0DC);
            color: white;
            font-size: 14px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        });
        
        return button;
    }

    // Create suggestion dropdown
    createSuggestionDropdown(suggestions, onSelect) {
        const dropdown = document.createElement('div');
        dropdown.className = 'ai-assistant-suggestions';
        
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 4px;
        `;
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.style.cssText = `
                padding: 12px 16px;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 14px;
                line-height: 1.4;
            `;
            
            if (index === suggestions.length - 1) {
                item.style.borderBottom = 'none';
            }
            
            item.textContent = typeof suggestion === 'string' ? suggestion : suggestion.text;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            item.addEventListener('click', () => {
                onSelect(suggestion);
                dropdown.remove();
            });
            
            dropdown.appendChild(item);
        });
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
        
        return dropdown;
    }

    // Create modal dialog
    createModal(title, content, options = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'ai-assistant-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'ai-assistant-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: ${options.maxWidth || '500px'};
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            position: relative;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e0e0e0;
        `;
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        header.appendChild(titleElement);
        header.appendChild(closeButton);
        
        const contentElement = document.createElement('div');
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else {
            contentElement.appendChild(content);
        }
        
        modal.appendChild(header);
        modal.appendChild(contentElement);
        overlay.appendChild(modal);
        
        // Close modal functionality
        const closeModal = () => {
            overlay.remove();
            if (options.onClose) options.onClose();
        };
        
        closeButton.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        document.body.appendChild(overlay);
        return { overlay, modal, close: closeModal };
    }

    // Position element relative to target
    positionRelativeTo(element, target, position = 'bottom-right') {
        const targetRect = target.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'bottom-right':
                top = targetRect.bottom + 4;
                left = targetRect.right - elementRect.width;
                break;
            case 'bottom-left':
                top = targetRect.bottom + 4;
                left = targetRect.left;
                break;
            case 'top-right':
                top = targetRect.top - elementRect.height - 4;
                left = targetRect.right - elementRect.width;
                break;
            case 'top-left':
                top = targetRect.top - elementRect.height - 4;
                left = targetRect.left;
                break;
            case 'right':
                top = targetRect.top;
                left = targetRect.right + 4;
                break;
            case 'left':
                top = targetRect.top;
                left = targetRect.left - elementRect.width - 4;
                break;
            default:
                top = targetRect.bottom + 4;
                left = targetRect.left;
        }
        
        // Ensure element stays within viewport
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (left + elementRect.width > viewport.width) {
            left = viewport.width - elementRect.width - 16;
        }
        if (left < 16) {
            left = 16;
        }
        if (top + elementRect.height > viewport.height) {
            top = viewport.height - elementRect.height - 16;
        }
        if (top < 16) {
            top = 16;
        }
        
        element.style.position = 'fixed';
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
    }

    // Observe DOM changes
    observeChanges(selector, callback, options = {}) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches && node.matches(selector)) {
                                callback(node, 'added');
                            } else {
                                const matches = node.querySelectorAll && node.querySelectorAll(selector);
                                if (matches) {
                                    matches.forEach(match => callback(match, 'added'));
                                }
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(options.parent || document.body, {
            childList: true,
            subtree: true,
            ...options
        });
        
        const observerId = Date.now().toString();
        this.observers.set(observerId, observer);
        
        return observerId;
    }

    // Stop observing changes
    stopObserving(observerId) {
        const observer = this.observers.get(observerId);
        if (observer) {
            observer.disconnect();
            this.observers.delete(observerId);
            return true;
        }
        return false;
    }

    // Clean up all observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Create global instance
window.AIAssistantDOM = new DOMService();
