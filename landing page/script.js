// ==============================================
// LinkedIn AI Assistant - Landing Page Script
// ==============================================

(function() {
    'use strict';

    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        once: true,
        offset: 120,
        delay: 100
    });

    // ==========================================
    // Navigation Scroll Effect
    // ==========================================
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // ==========================================
    // Mobile Menu Toggle
    // ==========================================
    const hamburger = document.querySelector('.nav-hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (navActions) {
                navActions.classList.toggle('active');
            }
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                if (navActions) {
                    navActions.classList.remove('active');
                }
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && 
                !navMenu.contains(e.target) && 
                (!navActions || !navActions.contains(e.target))) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                if (navActions) {
                    navActions.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        });
    }

    // ==========================================
    // Smooth Scroll for Anchor Links
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // Animated Counter for Hero Stats
    // ==========================================
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString() + (element.dataset.suffix || '');
        }, 16);
    }

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const target = parseInt(entry.target.dataset.target);
                animateCounter(entry.target, target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(counter => {
        counterObserver.observe(counter);
    });

    // ==========================================
    // FAQ Accordion
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // ==========================================
    // Video Play Button
    // ==========================================
    const videoPlaceholder = document.querySelector('.video-placeholder');
    const playButton = document.querySelector('.play-button');

    if (playButton) {
        playButton.addEventListener('click', () => {
            // Replace with actual video embed or open modal
            alert('Video demo coming soon! Install the extension to see it in action.');
            // Example: Replace placeholder with YouTube iframe
            // const iframe = document.createElement('iframe');
            // iframe.src = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';
            // iframe.width = '100%';
            // iframe.height = '100%';
            // iframe.allowFullscreen = true;
            // videoPlaceholder.innerHTML = '';
            // videoPlaceholder.appendChild(iframe);
        });
    }

    // ==========================================
    // Particle Background Effect
    // ==========================================
    function createParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        
        const particlesContainer = document.getElementById('particles-background');
        if (particlesContainer) {
            particlesContainer.appendChild(canvas);
        } else {
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 80;
        let mouse = { x: null, y: null, radius: 150 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = Math.random() * 30 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                // Mouse interaction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = mouse.radius;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * this.density;
                const directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) {
                        const dx = this.x - this.baseX;
                        this.x -= dx / 10;
                    }
                    if (this.y !== this.baseY) {
                        const dy = this.y - this.baseY;
                        this.y -= dy / 10;
                    }
                }

                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = `rgba(125, 222, 79, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(125, 222, 79, ${this.opacity})`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        function init() {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((particle, i) => {
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        const opacity = 0.15 * (1 - distance / 120);
                        ctx.strokeStyle = `rgba(125, 222, 79, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.stroke();
                    }
                });
            });

            requestAnimationFrame(animate);
        }

        init();
        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mouse.radius = 150;
            init();
        });
    }

    // Initialize particles
    createParticles();

    // ==========================================
    // Typing Animation for Hero Title
    // ==========================================
    function createTypingEffect() {
        const textGradient = document.querySelector('.glitch-text');
        if (!textGradient) return;
        
        const originalText = textGradient.textContent;
        const words = ['AI Magic', 'Pro Rise AI', 'Intelligence', 'Automation', 'AI Magic'];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 150;
        
        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                textGradient.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 100;
            } else {
                textGradient.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 150;
            }
            
            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typingSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typingSpeed = 500;
            }
            
            setTimeout(type, typingSpeed);
        }
        
        // Start typing animation after 2 seconds
        setTimeout(() => {
            type();
        }, 2000);
    }
    
    createTypingEffect();

    // ==========================================
    // How It Works - Real-time Toggle Animations
    // ==========================================
    
    // Animate toggles when they come into view
    const animatedToggles = document.querySelectorAll('.animated-toggle');
    const toggleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                const settingRow = entry.target.closest('.setting-row');
                const index = Array.from(settingRow.parentElement.children).indexOf(settingRow);
                
                setTimeout(() => {
                    entry.target.classList.add('active');
                    const knob = entry.target.querySelector('.toggle-knob');
                    if (knob) {
                        knob.style.transform = 'translateX(20px)';
                    }
                }, 500 + (index * 500)); // Stagger each toggle
            }
        });
    }, { threshold: 0.5 });

    animatedToggles.forEach(toggle => {
        toggleObserver.observe(toggle);
    });

    // Extension toggle animation
    const extToggle = document.querySelector('.ext-toggle');
    if (extToggle) {
        const extObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    setTimeout(() => {
                        const toggleSwitch = entry.target.querySelector('.toggle-switch');
                        if (toggleSwitch) {
                            toggleSwitch.style.transform = 'translateX(24px)';
                        }
                    }, 1500);
                }
            });
        }, { threshold: 0.5 });
        
        extObserver.observe(extToggle);
    }

    // ==========================================
    // Content Creation - Typing Animation
    // ==========================================
    const typedText = document.querySelector('.typed-text');
    if (typedText) {
        const fullText = "Excited to share my thoughts on AI and the future of work";
        let charIndex = 0;
        typedText.textContent = '';
        
        const creationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('typed')) {
                    entry.target.classList.add('typed');
                    
                    function typeCharacter() {
                        if (charIndex < fullText.length) {
                            typedText.textContent += fullText.charAt(charIndex);
                            charIndex++;
                            setTimeout(typeCharacter, 50);
                        }
                    }
                    
                    setTimeout(typeCharacter, 500);
                }
            });
        }, { threshold: 0.5 });
        
        creationObserver.observe(typedText);
    }

    // Content lines animation
    const contentLines = document.querySelectorAll('.content-line');
    contentLines.forEach((line, index) => {
        const lineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    setTimeout(() => {
                        entry.target.style.width = line.classList.contains('full') ? '100%' : 
                                                   line.classList.contains('medium') ? '60%' : '80%';
                    }, 2500 + (index * 200));
                }
            });
        }, { threshold: 0.5 });
        
        lineObserver.observe(line);
    });

    // ==========================================
    // Comparison Section - Before/After Animations
    // ==========================================
    
    // Counter Animation for all metrics
    const allCounters = document.querySelectorAll('.count-number, .views-count, .value-after, .metric-count, .metric-number');
    allCounters.forEach(counter => {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    const target = parseInt(entry.target.dataset.target || entry.target.dataset.count);
                    if (!target && target !== 0) return;
                    
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        entry.target.textContent = Math.floor(current).toLocaleString();
                    }, 16);
                }
            });
        }, { threshold: 0.5 });
        
        counterObserver.observe(counter);
    });

    // Typing Animation for "After" demo
    const typedContent = document.querySelector('.typed-content');
    if (typedContent) {
        const text = "Just closed my biggest deal yet! 🎉 The strategies I've been implementing over the past month are finally paying off. Here's what made the difference...";
        let index = 0;
        
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && index === 0) {
                    const typeInterval = setInterval(() => {
                        if (index < text.length) {
                            typedContent.textContent = text.substring(0, index + 1);
                            index++;
                        } else {
                            clearInterval(typeInterval);
                        }
                    }, 30);
                }
            });
        }, { threshold: 0.5 });
        
        typeObserver.observe(typedContent);
    }

    // Professional Writing Rewrite Animation
    const typedRewrite = document.querySelector('.typed-rewrite');
    if (typedRewrite) {
        const professionalText = "I would appreciate the opportunity to discuss our strategic partnership proposal at your earliest convenience. Please let me know your availability for a brief call this week.";
        let rewriteIndex = 0;
        
        const rewriteObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && rewriteIndex === 0) {
                    const rewriteInterval = setInterval(() => {
                        if (rewriteIndex < professionalText.length) {
                            typedRewrite.textContent = professionalText.substring(0, rewriteIndex + 1);
                            rewriteIndex++;
                        } else {
                            clearInterval(rewriteInterval);
                            // Remove cursor after typing completes
                            setTimeout(() => {
                                typedRewrite.style.setProperty('--cursor-display', 'none');
                            }, 500);
                        }
                    }, 25);
                }
            });
        }, { threshold: 0.5 });
        
        rewriteObserver.observe(typedRewrite);
    }

    // ==========================================
    // Settings Toggle Animation (Step 2) - Removed old code
    // ==========================================

    // ==========================================
    // Floating Cards Animation Enhancement
    // ==========================================
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.animationPlayState = 'paused';
            card.style.transform = 'scale(1.05) translateY(-10px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.animationPlayState = 'running';
            card.style.transform = '';
        });
    });

    // ==========================================
    // Pricing Card Interaction
    // ==========================================
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            pricingCards.forEach(otherCard => {
                if (otherCard !== card && !otherCard.classList.contains('featured')) {
                    otherCard.style.opacity = '0.7';
                }
            });
        });

        card.addEventListener('mouseleave', () => {
            pricingCards.forEach(otherCard => {
                otherCard.style.opacity = '1';
            });
        });
    });

    // ==========================================
    // Feature Card Hover Effect
    // ==========================================
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ==========================================
    // Magnetic Button Effect
    // ==========================================
    const magneticButtons = document.querySelectorAll('.btn-primary');
    
    magneticButtons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translate(0, 0)';
        });
    });

    // ==========================================
    // Parallax Effect on Hero
    // ==========================================
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });
    
    function animateParallax() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        const floatingCards = document.querySelectorAll('.floating-card');
        floatingCards.forEach((card, index) => {
            const speed = (index + 1) * 10;
            card.style.transform += ` translate(${currentX * speed}px, ${currentY * speed}px)`;
        });
        
        requestAnimationFrame(animateParallax);
    }
    
    animateParallax();

    // ==========================================
    // Scroll Progress Indicator
    // ==========================================
    function createScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.style.position = 'fixed';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.width = '0%';
        progressBar.style.height = '3px';
        progressBar.style.background = 'linear-gradient(90deg, #7dde4f, #5ab836)';
        progressBar.style.zIndex = '9999';
        progressBar.style.transition = 'width 0.1s ease';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.pageYOffset / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    createScrollProgress();

    // ==========================================
    // Easter Egg: Konami Code
    // ==========================================
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                // Easter egg activated!
                document.body.style.animation = 'rainbow 2s linear infinite';
                setTimeout(() => {
                    document.body.style.animation = '';
                    konamiIndex = 0;
                }, 5000);
            }
        } else {
            konamiIndex = 0;
        }
    });

    // Add rainbow animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // Performance Optimization: Lazy Load Images
    // ==========================================
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // ==========================================
    // Console Easter Egg
    // ==========================================
    console.log(
        '%cPro Rise AI 🚀',
        'color: #7dde4f; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(125, 222, 79, 0.3);'
    );
    console.log(
        '%cLooking for a job? Let us help you craft the perfect LinkedIn content!',
        'color: #000; font-size: 16px; font-weight: 600;'
    );
    console.log(
        '%cInstall now: https://chrome.google.com/webstore',
        'color: #7dde4f; font-size: 14px; font-weight: bold;'
    );

    // ==========================================
    // Analytics Event Tracking (Placeholder)
    // ==========================================
    function trackEvent(eventName, eventData = {}) {
        // Replace with your analytics provider
        console.log('Event:', eventName, eventData);
        
        // Example: Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', eventName, eventData);
        // }
    }

    // Track CTA clicks
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('cta_click', {
                button_text: btn.textContent.trim(),
                location: btn.closest('section')?.className || 'unknown'
            });
        });
    });

    // Track feature card clicks
    featureCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const featureName = card.querySelector('.feature-title')?.textContent || `Feature ${index + 1}`;
            trackEvent('feature_explore', { feature_name: featureName });
        });
    });

    // ==========================================
    // Accessibility Enhancements
    // ==========================================
    
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -100px;
        left: 0;
        background: #7dde4f;
        color: #000;
        padding: 0.75rem 1.5rem;
        text-decoration: none;
        font-weight: bold;
        z-index: 10000;
        transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-100px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main id if not exists
    const heroSection = document.querySelector('.hero');
    if (heroSection && !document.getElementById('main')) {
        heroSection.id = 'main';
    }

    // Keyboard navigation for cards
    const focusableCards = document.querySelectorAll('.feature-card, .pricing-card');
    focusableCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                card.click();
            }
        });
    });

    // ==========================================
    // Demo Form Submission - Send to WhatsApp
    // ==========================================
    const demoForm = document.getElementById('demoForm');
    
    if (demoForm) {
        demoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(demoForm);
            const data = Object.fromEntries(formData);
            
            // WhatsApp phone number (replace with your actual number)
            // Format: country code + number (no + sign, spaces, or dashes)
            const phoneNumber = '+923324587267'; // Replace with your WhatsApp number
            
            // Create WhatsApp message
            let message = `🚀 *New Demo Request from ProRise AI*%0A%0A`;
            message += `👤 *Name:* ${data.name || 'Not provided'}%0A`;
            message += `📧 *Email:* ${data.email || 'Not provided'}%0A`;
            message += `📱 *Phone:* ${data.phone || 'Not provided'}%0A`;
            message += `🏢 *Company:* ${data.company || 'Not provided'}%0A`;
            message += `💼 *Role:* ${data.role || 'Not provided'}%0A`;
            message += `📝 *Goals:* ${data.message || 'Not provided'}%0A`;
            message += `%0A⏰ *Submitted:* ${new Date().toLocaleString()}`;
            
            // Show loading state
            const submitBtn = demoForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Opening WhatsApp...</span>';
            
            // Delay to show loading state
            setTimeout(() => {
                // Open WhatsApp with pre-filled message
                const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
                window.open(whatsappURL, '_blank');
                
                // Show success state
                submitBtn.innerHTML = '<span>✓ Redirected to WhatsApp!</span>';
                submitBtn.style.background = 'var(--primary)';
                
                // Reset form after 3 seconds
                setTimeout(() => {
                    demoForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                }, 3000);
            }, 800);
            
            console.log('WhatsApp message prepared:', data);
        });
    }

    // ==========================================
    // Sequential Scene Animation System
    // ==========================================
    function initSequentialScenes() {
        const scenes = document.querySelectorAll('.demo-scene');
        const heroVisual = document.querySelector('.hero-visual');
        
        if (scenes.length === 0) return;
        
        const sceneDuration = 6000; // 6 seconds per scene
        let currentScene = 0;
        let sceneInterval;
        let hasStarted = false;

        function showScene(index) {
            // Remove active class from all scenes
            scenes.forEach(scene => scene.classList.remove('active'));

            // Add active class to current scene
            if (scenes[index]) {
                scenes[index].classList.add('active');
            }
        }

        function nextScene() {
            currentScene = (currentScene + 1) % scenes.length;
            showScene(currentScene);
        }

        function startAnimation() {
            if (hasStarted) return;
            hasStarted = true;
            
            // Start with first scene
            showScene(0);
            
            // Start the cycling interval
            sceneInterval = setInterval(nextScene, sceneDuration);
        }

        // Scroll-based trigger
        let scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasStarted) {
                    startAnimation();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-50px'
        });

        if (heroVisual) {
            scrollObserver.observe(heroVisual);
        }

        // Pause on hover
        const demoContainer = document.querySelector('.demo-container');
        if (demoContainer) {
            demoContainer.addEventListener('mouseenter', () => {
                if (sceneInterval) {
                    clearInterval(sceneInterval);
                }
            });
            
            demoContainer.addEventListener('mouseleave', () => {
                if (hasStarted) {
                    sceneInterval = setInterval(nextScene, sceneDuration);
                }
            });
        }
    }

    // ==========================================
    // Loading Complete
    // ==========================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Add stagger animation to elements
        const cards = document.querySelectorAll('.feature-card, .pricing-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Initialize sequential scene animations
        initSequentialScenes();
        
        // Scroll indicator click handler
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                const comparisonSection = document.querySelector('.comparison-section');
                if (comparisonSection) {
                    comparisonSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
        
        console.log('✅ Pro Rise AI landing page fully loaded');
    });

})();
