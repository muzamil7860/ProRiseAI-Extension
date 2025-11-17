// AI Rewrite Anywhere Component
// Universal text enhancement tool for any editable element

class AIRewriteAnywhere {
    constructor(settings) {
        this.settings = settings;
        this.attachedElements = new WeakSet();
        this.floatingButtons = new WeakMap();
        this.activeRewritePanels = new Map();
        this.panelCloseHandlers = new Map();
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
        const checkText = () => {
            // Check if feature is enabled
            if (!this.settings.rewriteAnywhereEnabled) {
                this.hideFloatingButton(element);
                return;
            }

            const text = AIAssistantDOM.getEditableText(element);
            const hasText = text.trim().length > 2;
            
            if (hasText && !this.floatingButtons.has(element)) {
                this.showFloatingButton(element);
            } else if (!hasText && this.floatingButtons.has(element)) {
                this.hideFloatingButton(element);
            }
        };

        // Instant detection - no timeout
        element.addEventListener('input', checkText);
        element.addEventListener('focus', checkText);
        element.addEventListener('keyup', checkText);
        element.addEventListener('paste', checkText);
        
        // Show on text selection
        element.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 2) {
                checkText();
            }
        });
        
        element.addEventListener('select', checkText);

        // Initial check
        checkText();
    }

    showFloatingButton(element) {
        if (this.floatingButtons.has(element)) {
            const existing = this.floatingButtons.get(element);
            if (existing && existing.parentElement) {
                this.positionFloatingButton(existing, element);
                return;
            }
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
        button.title = 'AI Rewrite';
        
        button.style.cssText = `
            position: fixed;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #EC4899, #BE185D);
            color: white;
            font-size: 14px;
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
        
        // Position button at bottom-right corner, slightly outside to avoid disrupting typing
        button.style.top = `${rect.bottom - 36}px`;
        button.style.left = `${rect.right - 36}px`;
        button.style.pointerEvents = 'auto';
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

        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition, { passive: true });
        
        const observer = new MutationObserver(updatePosition);
        observer.observe(document.body, { childList: true, subtree: true });
        
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
        this.hideRewritePanel(element);

        const panel = this.createRewritePanel(element);
        // mark as anchored so CSS applies
        panel.classList.add('ai-anchored-panel');
        document.body.appendChild(panel);

        // Position as anchored (right by default; flips to left if needed)
        this.positionAnchoredPanel(panel, element);
        this.activeRewritePanels.set(element, panel);
        
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
                    <label>Original:</label>
                    <div class="ai-text-preview">${this.truncateText(currentText, 80)}</div>
                </div>
                
                <div class="ai-rewrite-controls">
                    <div class="ai-rewrite-control-group">
                        <label for="ai-rewrite-tone">Style:</label>
                        <select id="ai-rewrite-tone" class="ai-rewrite-tone">
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="persuasive">Persuasive</option>
                            <option value="concise">Concise</option>
                            <option value="detailed">Detailed</option>
                            <option value="casual">Casual</option>
                            <option value="roman_urdu_to_english">Roman Urdu → English</option>
                        </select>
                    </div>
                    
                    <div class="ai-rewrite-control-group">
                        <label for="ai-rewrite-instructions">Custom:</label>
                        <input type="text" id="ai-rewrite-instructions" placeholder="optional" />
                    </div>
                    
                    <div class="ai-rewrite-actions">
                        <button id="ai-rewrite-generate" class="ai-btn ai-btn-primary">
                            <i class="fas fa-magic"></i>
                            Rewrite
                        </button>
                        <button id="ai-rewrite-variants" class="ai-btn ai-btn-secondary">
                            <i class="fas fa-list"></i>
                            5 Variants
                        </button>
                    </div>
                </div>
                
                <div id="ai-rewrite-results" class="ai-rewrite-results" style="display: none;">
                    <div class="ai-rewrite-results-header">
                        <label>Results:</label>
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
        
        // Close panel - ONLY on close button click
        panel.querySelector('.ai-rewrite-close').addEventListener('click', (e) => {
            e.stopPropagation();
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

        // Handle escape key ONLY
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideRewritePanel(element);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        this.panelCloseHandlers.set(element, escapeHandler);
    }

    async generateRewrite(panel, element, originalText, multipleVariants = false) {
        const tone = panel.querySelector('#ai-rewrite-tone').value;
        const instructions = panel.querySelector('#ai-rewrite-instructions').value.trim();
        
        const generateBtn = panel.querySelector('#ai-rewrite-generate');
        const variantsBtn = panel.querySelector('#ai-rewrite-variants');
        
        const originalGenerateText = generateBtn.innerHTML;
        const originalVariantsText = variantsBtn.innerHTML;
        
    generateBtn.innerHTML = '<span class="ai-post-spinner"></span> Rewriting...';
    variantsBtn.innerHTML = '<span class="ai-post-spinner"></span> Generating...';
        generateBtn.disabled = true;
        variantsBtn.disabled = true;

        try {
            // show branded writing indicator inside the panel while generating
            try { AIAssistantDOM.showWritingIndicator(panel.querySelector('.ai-rewrite-content') || panel, { inline: true }); } catch (e) {}

            if (multipleVariants) {
                await this.generateMultipleVariants(panel, element, originalText, tone, instructions);
            } else {
                const rewrittenContent = await AIAssistantAPI.rewriteText(originalText, tone, instructions);
                
                if (rewrittenContent && rewrittenContent.rewritten) {
                    this.displaySingleRewrite(panel, element, rewrittenContent);
                }
            }
            // mark complete to play completion animation
            panel.classList.add('ai-complete');
            
            // Track rewrite usage
            await AIAssistantAPI.updateStats('rewritesGenerated');

        } catch (error) {
            console.error('Error rewriting text:', error);
            AIAssistantAPI.showError(error, panel.querySelector('.ai-rewrite-content'));
        } finally {
            // hide writing indicator
            try { AIAssistantDOM.hideWritingIndicator(panel.querySelector('.ai-rewrite-content') || panel); } catch (e) {}
            generateBtn.innerHTML = originalGenerateText;
            variantsBtn.innerHTML = originalVariantsText;
            generateBtn.disabled = false;
            variantsBtn.disabled = false;
        }
    }

    async generateMultipleVariants(panel, element, originalText, tone, instructions) {
        const numVariants = 5;
        const variantPromises = [];
        
        for (let i = 0; i < numVariants; i++) {
            const customInstructions = instructions + (i === 0 ? '' : ` v${i + 1}`);
            variantPromises.push(
                AIAssistantAPI.rewriteText(originalText, tone, customInstructions)
                    .then(rewrittenContent => {
                        if (rewrittenContent && rewrittenContent.rewritten) {
                            return {
                                text: rewrittenContent.rewritten,
                                variant: i + 1
                            };
                        }
                        return null;
                    })
                    .catch(error => {
                        console.error(`Error generating variant ${i + 1}:`, error);
                        return null;
                    })
            );
        }

        const results = await Promise.all(variantPromises);
        const validVariants = results.filter(v => v !== null);

        if (validVariants.length > 0) {
            this.displayMultipleVariants(panel, element, validVariants);
        }
    }

    displaySingleRewrite(panel, element, rewrittenContent) {
        const variantsList = panel.querySelector('#ai-rewrite-variants-list');
        variantsList.innerHTML = '';

        const variant = this.createVariantItem({
            text: rewrittenContent.rewritten,
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
                    Variant ${variant.variant}
                    ${isFirst ? '<span class="ai-variant-recommended">★</span>' : ''}
                </div>
                <div class="ai-variant-actions">
                    <button class="ai-variant-use" title="Use this version">
                        <i class="fas fa-check"></i> Use
                    </button>
                    <button class="ai-variant-copy" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <div class="ai-variant-text">${variant.text}</div>
        `;

        this.setupVariantItemEvents(item, variant.text, element);
        return item;
    }

    setupVariantItemEvents(item, variantText, element) {
        item.querySelector('.ai-variant-use').addEventListener('click', () => {
            this.useVariant(element, variantText);
        });

        item.querySelector('.ai-variant-copy').addEventListener('click', () => {
            this.copyVariant(variantText);
        });
    }

    useVariant(element, variantText) {
        AIAssistantDOM.setEditableText(element, variantText);
        element.focus();
        
        this.hideRewritePanel(element);
        AIAssistantAPI.showSuccess('Text rewritten!', element.parentElement);
    }

    async copyVariant(variantText) {
        try {
            await navigator.clipboard.writeText(variantText);
            const message = document.createElement('div');
            message.textContent = 'Copied!';
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
        // Deprecated for anchored layout. Anchored panels use positionAnchoredPanel
        this.positionAnchoredPanel(panel, element);
    }

    positionAnchoredPanel(panel, element) {
        const panelWidth = 420;
        const margin = 12;
        const viewportW = window.innerWidth;
        const rect = element.getBoundingClientRect();

        // prefer right side anchor
        let anchor = 'right';
        // if element is too close to right edge or viewport too narrow, flip to left
        if (rect.right + panelWidth + margin > viewportW && rect.left > panelWidth + margin) {
            anchor = 'left';
        }

        // Apply anchored classes
        panel.classList.add('ai-post-panel', 'modern', 'ai-anchored');
        panel.classList.remove('ai-complete');

        if (anchor === 'right') {
            panel.style.right = `${margin}px`;
            panel.style.left = 'auto';
            panel.style.top = `${10}px`;
            panel.style.bottom = `${10}px`;
            panel.style.width = `${panelWidth}px`;
            panel.dataset.anchor = 'right';
        } else {
            panel.style.left = `${margin}px`;
            panel.style.right = 'auto';
            panel.style.top = `${10}px`;
            panel.style.bottom = `${10}px`;
            panel.style.width = `${panelWidth}px`;
            panel.dataset.anchor = 'left';
            panel.classList.add('ai-anchored-left');
        }

        panel.style.position = 'fixed';
        panel.style.zIndex = '10001';
        panel.style.overflow = 'hidden';

        // ensure inner content scrolls (single outer scrollbar experience)
        const content = panel.querySelector('.ai-rewrite-content');
        if (content) {
            content.style.overflowY = 'auto';
            content.style.maxHeight = 'calc(100vh - 120px)';
        }

        // make sure panel is focusable
        panel.tabIndex = -1;
    }

    hideRewritePanel(element) {
        const panel = this.activeRewritePanels.get(element);
        if (panel) {
            panel.remove();
            this.activeRewritePanels.delete(element);
        }
        
        const escapeHandler = this.panelCloseHandlers.get(element);
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
            this.panelCloseHandlers.delete(element);
        }
    }

    rewriteText(element) {
        this.showRewritePanel(element);
    }

    showSuggestions(element) {
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
        document.querySelectorAll('.ai-rewrite-floating-btn').forEach(button => {
            if (button._cleanup) {
                button._cleanup();
            }
            button.remove();
        });
        this.floatingButtons = new WeakMap();

        this.activeRewritePanels.forEach(panel => {
            if (panel.parentElement) {
                panel.remove();
            }
        });
        this.activeRewritePanels.clear();

        this.panelCloseHandlers.forEach((handler, element) => {
            document.removeEventListener('keydown', handler);
        });
        this.panelCloseHandlers.clear();

        document.querySelectorAll('.ai-rewrite-panel').forEach(panel => panel.remove());
    }
}

if (typeof window !== 'undefined') {
    window.AIRewriteAnywhere = AIRewriteAnywhere;
}
