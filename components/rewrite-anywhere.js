// AI Rewrite Anywhere Component
// Universal text enhancement tool for any editable element

class AIRewriteAnywhere {
    constructor(settings) {
        this.settings = settings;
        this.attachedElements = new WeakSet();
        this.floatingButtons = new WeakMap();
        this.activeRewritePanels = new Map();
    }

    async attachToElement(element) {
        if (this.attachedElements.has(element) || !AIAssistantDOM.isEditable(element)) {
            return;
        }

        this.attachedElements.add(element);
        
        // Add floating rewrite button when element has text
        this.monitorElementText(element);
    }

    monitorElementText(element) {
        let textCheckTimeout;

        const checkText = () => {
            clearTimeout(textCheckTimeout);
            textCheckTimeout = setTimeout(() => {
                const text = AIAssistantDOM.getEditableText(element);
                const hasText = text.trim().length > 5; // Minimum 5 characters
                
                if (hasText && !this.floatingButtons.has(element)) {
                    this.showFloatingButton(element);
                } else if (!hasText && this.floatingButtons.has(element)) {
                    this.hideFloatingButton(element);
                }
            }, 300);
        };

        element.addEventListener('input', checkText);
        element.addEventListener('focus', checkText);
        element.addEventListener('blur', () => {
            setTimeout(() => {
                // Keep button visible for a short time after losing focus
                const activePanel = this.activeRewritePanels.get(element);
                if (!activePanel || activePanel.style.display === 'none') {
                    setTimeout(() => this.hideFloatingButton(element), 2000);
                }
            }, 100);
        });

        // Initial check
        checkText();
    }

    showFloatingButton(element) {
        if (this.floatingButtons.has(element)) {
            return;
        }

        const button = this.createFloatingButton(element);
        this.positionFloatingButton(button, element);
        
        document.body.appendChild(button);
        this.floatingButtons.set(element, button);

        // Update position when element moves
        this.observeElementPosition(element, button);
    }

    createFloatingButton(element) {
        const button = document.createElement('button');
        button.className = 'ai-rewrite-floating-btn';
        button.innerHTML = '✨';
        button.title = 'AI Rewrite (Ctrl+Shift+R)';
        
        button.style.cssText = `
            position: fixed;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #EC4899, #BE185D);
            color: white;
            font-size: 12px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transform: scale(0.8);
            animation: ai-float-in 0.3s ease forwards;
        `;

        // Add animation keyframes
        if (!document.querySelector('#ai-float-animations')) {
            const style = document.createElement('style');
            style.id = 'ai-float-animations';
            style.textContent = `
                @keyframes ai-float-in {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes ai-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.15)';
            button.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.6)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showRewritePanel(element);
        });

        return button;
    }

    positionFloatingButton(button, element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Position button at bottom-right corner of element
        button.style.top = `${rect.bottom + scrollTop - 14}px`;
        button.style.left = `${rect.right + scrollLeft - 14}px`;
    }

    observeElementPosition(element, button) {
        let positionUpdateFrame;
        
        const updatePosition = () => {
            cancelAnimationFrame(positionUpdateFrame);
            positionUpdateFrame = requestAnimationFrame(() => {
                if (button.parentElement) {
                    this.positionFloatingButton(button, element);
                }
            });
        };

        // Update position on scroll and resize
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition, { passive: true });
        
        // Use MutationObserver for DOM changes that might affect position
        const observer = new MutationObserver(updatePosition);
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Store cleanup functions
        button._cleanup = () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
            observer.disconnect();
        };
    }

    hideFloatingButton(element) {
        const button = this.floatingButtons.get(element);
        if (button) {
            button.style.animation = 'ai-float-in 0.3s ease reverse';
            setTimeout(() => {
                if (button.parentElement) {
                    button.remove();
                }
                if (button._cleanup) {
                    button._cleanup();
                }
            }, 300);
            
            this.floatingButtons.delete(element);
        }
    }

    showRewritePanel(element) {
        // Close any existing panel
        this.hideRewritePanel(element);

        const panel = this.createRewritePanel(element);
        document.body.appendChild(panel);
        
        this.positionRewritePanel(panel, element);
        this.activeRewritePanels.set(element, panel);
        
        // Focus on the panel
        const toneSelect = panel.querySelector('.ai-rewrite-tone');
        if (toneSelect) {
            toneSelect.focus();
        }
    }

    createRewritePanel(element) {
        const currentText = AIAssistantDOM.getEditableText(element);
        
        const panel = document.createElement('div');
        panel.className = 'ai-rewrite-panel';
        
        panel.innerHTML = `
            <div class="ai-rewrite-header">
                <div class="ai-rewrite-title">
                    <i class="fas fa-wand-magic-sparkles"></i>
                    <span>Rewrite Text</span>
                </div>
                <button class="ai-rewrite-close" title="Close">×</button>
            </div>
            
            <div class="ai-rewrite-content">
                <div class="ai-rewrite-original">
                    <label>Original Text:</label>
                    <div class="ai-text-preview">${this.truncateText(currentText, 100)}</div>
                </div>
                
                <div class="ai-rewrite-controls">
                    <div class="ai-rewrite-control-group">
                        <label for="ai-rewrite-tone">Tone:</label>
                        <select id="ai-rewrite-tone" class="ai-rewrite-tone">
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="persuasive">Persuasive</option>
                            <option value="storytelling">Storytelling</option>
                            <option value="humorous">Humorous</option>
                            <option value="concise">More Concise</option>
                            <option value="detailed">More Detailed</option>
                            <option value="casual">Casual</option>
                        </select>
                    </div>
                    
                    <div class="ai-rewrite-control-group">
                        <label for="ai-rewrite-instructions">Custom Instructions (Optional):</label>
                        <input type="text" id="ai-rewrite-instructions" placeholder="e.g., make it sound more confident" />
                    </div>
                    
                    <div class="ai-rewrite-actions">
                        <button id="ai-rewrite-generate" class="ai-btn ai-btn-primary">
                            <i class="fas fa-magic"></i>
                            Rewrite
                        </button>
                        <button id="ai-rewrite-variants" class="ai-btn ai-btn-secondary">
                            <i class="fas fa-list"></i>
                            Multiple Variants
                        </button>
                    </div>
                </div>
                
                <div id="ai-rewrite-results" class="ai-rewrite-results" style="display: none;">
                    <div class="ai-rewrite-results-header">
                        <label>Rewritten Text:</label>
                        <div class="ai-rewrite-results-actions">
                            <button id="ai-rewrite-regenerate" class="ai-btn ai-btn-small">Regenerate</button>
                        </div>
                    </div>
                    <div id="ai-rewrite-variants-list" class="ai-rewrite-variants"></div>
                </div>
            </div>
        `;

        this.setupRewritePanelEvents(panel, element);
        return panel;
    }

    setupRewritePanelEvents(panel, element) {
        const currentText = AIAssistantDOM.getEditableText(element);
        
        // Close panel
        panel.querySelector('.ai-rewrite-close').addEventListener('click', () => {
            this.hideRewritePanel(element);
        });

        // Set default tone
        const toneSelect = panel.querySelector('#ai-rewrite-tone');
        toneSelect.value = this.settings.globalTone || 'professional';

        // Generate single rewrite
        panel.querySelector('#ai-rewrite-generate').addEventListener('click', () => {
            this.generateRewrite(panel, element, currentText, false);
        });

        // Generate multiple variants
        panel.querySelector('#ai-rewrite-variants').addEventListener('click', () => {
            this.generateRewrite(panel, element, currentText, true);
        });

        // Regenerate
        panel.querySelector('#ai-rewrite-regenerate').addEventListener('click', () => {
            this.generateRewrite(panel, element, currentText, true);
        });

        // Close panel when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePanelOutside(e) {
                if (!panel.contains(e.target) && !element.contains(e.target)) {
                    this.hideRewritePanel(element);
                    document.removeEventListener('click', closePanelOutside);
                }
            }.bind(this));
        }, 100);

        // Handle escape key
        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                this.hideRewritePanel(element);
                document.removeEventListener('keydown', handleEscape);
            }
        }.bind(this));
    }

    async generateRewrite(panel, element, originalText, multipleVariants = false) {
        const tone = panel.querySelector('#ai-rewrite-tone').value;
        const instructions = panel.querySelector('#ai-rewrite-instructions').value.trim();
        
        const generateBtn = panel.querySelector('#ai-rewrite-generate');
        const variantsBtn = panel.querySelector('#ai-rewrite-variants');
        
        const originalGenerateText = generateBtn.innerHTML;
        const originalVariantsText = variantsBtn.innerHTML;
        
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rewriting...';
        variantsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        variantsBtn.disabled = true;

        try {
            if (multipleVariants) {
                await this.generateMultipleVariants(panel, element, originalText, tone, instructions);
            } else {
                const rewrittenContent = await AIAssistantAPI.rewriteText(originalText, tone, instructions);
                
                if (rewrittenContent && rewrittenContent.rewritten) {
                    this.displaySingleRewrite(panel, element, rewrittenContent);
                }
            }

        } catch (error) {
            console.error('Error rewriting text:', error);
            AIAssistantAPI.showError(error, panel.querySelector('.ai-rewrite-content'));
        } finally {
            generateBtn.innerHTML = originalGenerateText;
            variantsBtn.innerHTML = originalVariantsText;
            generateBtn.disabled = false;
            variantsBtn.disabled = false;
        }
    }

    async generateMultipleVariants(panel, element, originalText, tone, instructions) {
        const variants = [];
        const numVariants = 3;

        // Generate multiple variants
        for (let i = 0; i < numVariants; i++) {
            try {
                const customInstructions = instructions + (i === 0 ? '' : ` (Variant ${i + 1})`);
                const rewrittenContent = await AIAssistantAPI.rewriteText(originalText, tone, customInstructions);
                
                if (rewrittenContent && rewrittenContent.rewritten) {
                    variants.push({
                        text: rewrittenContent.rewritten,
                        improvements: rewrittenContent.improvements || [],
                        variant: i + 1
                    });
                }
            } catch (error) {
                console.error(`Error generating variant ${i + 1}:`, error);
            }
        }

        if (variants.length > 0) {
            this.displayMultipleVariants(panel, element, variants);
        }
    }

    displaySingleRewrite(panel, element, rewrittenContent) {
        const variantsList = panel.querySelector('#ai-rewrite-variants-list');
        variantsList.innerHTML = '';

        const variant = this.createVariantItem({
            text: rewrittenContent.rewritten,
            improvements: rewrittenContent.improvements || [],
            variant: 1
        }, element, true);

        variantsList.appendChild(variant);
        panel.querySelector('#ai-rewrite-results').style.display = 'block';
    }

    displayMultipleVariants(panel, element, variants) {
        const variantsList = panel.querySelector('#ai-rewrite-variants-list');
        variantsList.innerHTML = '';

        variants.forEach((variant, index) => {
            const variantItem = this.createVariantItem(variant, element, index === 0);
            variantsList.appendChild(variantItem);
        });

        panel.querySelector('#ai-rewrite-results').style.display = 'block';
    }

    createVariantItem(variant, element, isFirst = false) {
        const item = document.createElement('div');
        item.className = `ai-rewrite-variant ${isFirst ? 'ai-rewrite-variant-first' : ''}`;
        
        item.innerHTML = `
            <div class="ai-variant-header">
                <div class="ai-variant-label">
                    ${variant.variant ? `Variant ${variant.variant}` : 'Rewritten Text'}
                    ${isFirst ? '<span class="ai-variant-recommended">Recommended</span>' : ''}
                </div>
                <div class="ai-variant-actions">
                    <button class="ai-variant-use" title="Use this version">
                        <i class="fas fa-check"></i>
                        Use
                    </button>
                    <button class="ai-variant-edit" title="Edit before using">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="ai-variant-copy" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <div class="ai-variant-text">${variant.text}</div>
            
            ${variant.improvements && variant.improvements.length > 0 ? `
                <div class="ai-variant-improvements">
                    <strong>Improvements:</strong>
                    <ul>
                        ${variant.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        this.setupVariantItemEvents(item, variant.text, element);
        return item;
    }

    setupVariantItemEvents(item, variantText, element) {
        // Use variant
        item.querySelector('.ai-variant-use').addEventListener('click', () => {
            this.useVariant(element, variantText);
        });

        // Edit variant
        item.querySelector('.ai-variant-edit').addEventListener('click', () => {
            this.editVariant(element, variantText);
        });

        // Copy variant
        item.querySelector('.ai-variant-copy').addEventListener('click', () => {
            this.copyVariant(variantText);
        });
    }

    useVariant(element, variantText) {
        AIAssistantDOM.setEditableText(element, variantText);
        element.focus();
        
        this.hideRewritePanel(element);
        AIAssistantAPI.showSuccess('Text rewritten successfully!', element.parentElement);
    }

    editVariant(element, variantText) {
        AIAssistantDOM.setEditableText(element, variantText);
        element.focus();
        
        // Position cursor at end
        if (element.setSelectionRange) {
            element.setSelectionRange(variantText.length, variantText.length);
        }
        
        this.hideRewritePanel(element);
        AIAssistantAPI.showSuccess('Text ready for editing!', element.parentElement);
    }

    async copyVariant(variantText) {
        try {
            await navigator.clipboard.writeText(variantText);
            // Show temporary success message
            const message = document.createElement('div');
            message.textContent = 'Copied to clipboard!';
            message.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #22c55e;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 10001;
                animation: ai-float-in 0.3s ease;
            `;
            
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
            
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    }

    positionRewritePanel(panel, element) {
        const rect = element.getBoundingClientRect();
        const panelWidth = 450;
        const panelHeight = 400;
        
        let left = rect.right + 15;
        let top = rect.top;

        // Adjust if panel would go off-screen
        if (left + panelWidth > window.innerWidth) {
            left = rect.left - panelWidth - 15;
        }
        if (left < 15) {
            left = Math.max(15, (window.innerWidth - panelWidth) / 2);
        }
        
        if (top + panelHeight > window.innerHeight) {
            top = window.innerHeight - panelHeight - 15;
        }
        if (top < 15) {
            top = 15;
        }

        panel.style.position = 'fixed';
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.zIndex = '10000';
    }

    hideRewritePanel(element) {
        const panel = this.activeRewritePanels.get(element);
        if (panel) {
            panel.remove();
            this.activeRewritePanels.delete(element);
        }
    }

    rewriteText(element) {
        // Called by main content script for keyboard shortcut
        this.showRewritePanel(element);
    }

    showSuggestions(element) {
        // Called by main content script for keyboard shortcut
        this.showRewritePanel(element);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    cleanup() {
        // Remove all floating buttons
        for (const [element, button] of this.floatingButtons) {
            if (button.parentElement) {
                button.remove();
            }
            if (button._cleanup) {
                button._cleanup();
            }
        }
        this.floatingButtons = new WeakMap();

        // Remove all active panels
        this.activeRewritePanels.forEach(panel => {
            if (panel.parentElement) {
                panel.remove();
            }
        });
        this.activeRewritePanels.clear();

        this.attachedElements = new WeakSet();
    }
}

// Export for use by content script
window.AIRewriteAnywhere = AIRewriteAnywhere;
