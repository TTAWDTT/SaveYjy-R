/**
 * Modern Theme System and UI Enhancement Module
 * Inspired by Vanity repository patterns
 * Created for SaveYjy-R Frontend Modernization
 */

class ModernThemeSystem {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.setupThemeToggle();
        this.setupAnimations();
        this.setupModernComponents();
        console.log('🎨 Modern Theme System initialized');
    }

    // Theme Management
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('modernTheme') || 'dark';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('modernTheme', theme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Add bounce animation to toggle button
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.classList.add('bounce-animate');
            setTimeout(() => {
                toggleBtn.classList.remove('bounce-animate');
            }, 600);
        }
    }

    updateThemeIcon() {
        const sunIcon = document.querySelector('.theme-toggle .sun');
        const moonIcon = document.querySelector('.theme-toggle .moon');
        
        if (sunIcon && moonIcon) {
            if (this.currentTheme === 'light') {
                sunIcon.style.opacity = '1';
                sunIcon.style.transform = 'rotate(0deg)';
                moonIcon.style.opacity = '0';
                moonIcon.style.transform = 'rotate(-180deg)';
            } else {
                sunIcon.style.opacity = '0';
                sunIcon.style.transform = 'rotate(180deg)';
                moonIcon.style.opacity = '1';
                moonIcon.style.transform = 'rotate(0deg)';
            }
        }
    }

    setupThemeToggle() {
        // Create theme toggle if it doesn't exist
        if (!document.querySelector('.theme-toggle')) {
            this.createThemeToggle();
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });
    }

    createThemeToggle() {
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <i class="fas fa-sun sun"></i>
            <i class="fas fa-moon moon"></i>
        `;
        
        // Find a suitable container to add the toggle
        const header = document.querySelector('.nav-modern, .header, .sidebar-header');
        if (header) {
            header.appendChild(themeToggle);
        }
    }

    // Animation System
    setupAnimations() {
        this.observeElementsForAnimation();
        this.setupHoverEffects();
    }

    observeElementsForAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe elements that should animate in
        document.querySelectorAll('.modern-card, .form-modern, .feature-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupHoverEffects() {
        // Add modern hover effects to cards
        document.querySelectorAll('.modern-card, .feature-card').forEach(card => {
            card.addEventListener('mouseenter', this.addCardHoverEffect);
            card.addEventListener('mouseleave', this.removeCardHoverEffect);
        });
    }

    addCardHoverEffect(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = 'var(--shadow-lg)';
        card.style.borderColor = 'var(--accent)';
    }

    removeCardHoverEffect(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'var(--shadow-md)';
        card.style.borderColor = 'var(--border)';
    }

    // Modern Component Enhancements
    setupModernComponents() {
        this.modernizeButtons();
        this.modernizeForms();
        this.modernizeCards();
        this.setupParticleBackground();
    }

    modernizeButtons() {
        document.querySelectorAll('.btn').forEach(btn => {
            if (!btn.classList.contains('btn-modern')) {
                btn.classList.add('btn-modern');
                
                // Add shimmer effect
                btn.addEventListener('mouseenter', this.addShimmerEffect);
            }
        });
    }

    addShimmerEffect(e) {
        const btn = e.currentTarget;
        if (btn.querySelector('.shimmer')) return;

        const shimmer = document.createElement('div');
        shimmer.className = 'shimmer';
        shimmer.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s ease;
            pointer-events: none;
        `;
        
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(shimmer);
        
        setTimeout(() => {
            shimmer.style.left = '100%';
            setTimeout(() => shimmer.remove(), 600);
        }, 10);
    }

    modernizeForms() {
        document.querySelectorAll('form').forEach(form => {
            if (!form.classList.contains('form-modern')) {
                form.classList.add('form-modern');
            }
        });

        document.querySelectorAll('input, textarea, select').forEach(input => {
            if (!input.classList.contains('form-input-modern')) {
                input.classList.add('form-input-modern');
            }
        });

        document.querySelectorAll('label').forEach(label => {
            if (!label.classList.contains('form-label-modern')) {
                label.classList.add('form-label-modern');
            }
        });
    }

    modernizeCards() {
        document.querySelectorAll('.card').forEach(card => {
            if (!card.classList.contains('modern-card')) {
                card.classList.add('modern-card');
            }
        });
    }

    setupParticleBackground() {
        if (document.querySelector('.particles-bg')) return;

        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-bg';
        particlesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
            pointer-events: none;
        `;

        // Create particles
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(67, 97, 238, 0.6);
                border-radius: 50%;
                animation: float 8s ease-in-out infinite;
                animation-delay: ${i * 1.5}s;
            `;
            
            // Random position
            particle.style.top = Math.random() * 100 + '%';
            particle.style.left = Math.random() * 100 + '%';
            
            particlesContainer.appendChild(particle);
        }

        // Add CSS for float animation
        if (!document.querySelector('#particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px) translateX(0px); 
                        opacity: 0.7; 
                    }
                    25% { 
                        transform: translateY(-20px) translateX(10px); 
                        opacity: 1; 
                    }
                    50% { 
                        transform: translateY(-40px) translateX(-10px); 
                        opacity: 0.5; 
                    }
                    75% { 
                        transform: translateY(-20px) translateX(5px); 
                        opacity: 0.8; 
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(particlesContainer);
    }

    // Utility Methods
    modernizeExistingContent() {
        // Convert existing content to modern styles
        this.convertOldButtons();
        this.convertOldCards();
        this.convertOldForms();
    }

    convertOldButtons() {
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-warning, .btn-info').forEach(btn => {
            if (!btn.classList.contains('btn-modern')) {
                btn.classList.add('btn-modern');
            }
        });
    }

    convertOldCards() {
        document.querySelectorAll('.card, .feature-card, .premium-card').forEach(card => {
            if (!card.classList.contains('modern-card')) {
                card.classList.add('modern-card');
            }
        });
    }

    convertOldForms() {
        document.querySelectorAll('.form-control, .form-select').forEach(input => {
            if (!input.classList.contains('form-input-modern')) {
                input.classList.add('form-input-modern');
            }
        });
    }

    // Background Enhancement
    addModernBackground() {
        document.body.classList.add('modern-bg');
    }

    // Loading States
    showLoadingState(element) {
        element.style.opacity = '0.7';
        element.style.pointerEvents = 'none';
        
        const loader = document.createElement('div');
        loader.className = 'modern-loader';
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid var(--border);
            border-top: 2px solid var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        element.style.position = 'relative';
        element.appendChild(loader);
        
        // Add spin animation if not exists
        if (!document.querySelector('#loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    hideLoadingState(element) {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        
        const loader = element.querySelector('.modern-loader');
        if (loader) {
            loader.remove();
        }
    }

    // Modern Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `modern-notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 300px;
            animation: slideInDown 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
                   style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'});"></i>
                <span style="color: var(--text-primary);">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: var(--text-muted); cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Responsive Enhancement Module
class ResponsiveEnhancer {
    constructor() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };
        this.init();
    }

    init() {
        this.setupResponsiveFeatures();
        this.setupMobileOptimizations();
        this.setupTouchEnhancement();
    }

    setupResponsiveFeatures() {
        window.addEventListener('resize', () => {
            this.adjustLayoutForScreenSize();
        });
        
        this.adjustLayoutForScreenSize();
    }

    setupMobileOptimizations() {
        if (this.isMobile()) {
            document.body.classList.add('mobile-optimized');
            this.addMobileSpecificStyles();
        }
    }

    setupTouchEnhancement() {
        if (this.isTouchDevice()) {
            document.body.classList.add('touch-device');
            this.enhanceTouchTargets();
        }
    }

    isMobile() {
        return window.innerWidth < this.breakpoints.mobile;
    }

    isTablet() {
        return window.innerWidth >= this.breakpoints.mobile && window.innerWidth < this.breakpoints.desktop;
    }

    isDesktop() {
        return window.innerWidth >= this.breakpoints.desktop;
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    adjustLayoutForScreenSize() {
        if (this.isMobile()) {
            this.applyMobileLayout();
        } else if (this.isTablet()) {
            this.applyTabletLayout();
        } else {
            this.applyDesktopLayout();
        }
    }

    applyMobileLayout() {
        document.querySelectorAll('.grid-cols-3, .grid-cols-4').forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(1, 1fr)';
        });
    }

    applyTabletLayout() {
        document.querySelectorAll('.grid-cols-4').forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        });
    }

    applyDesktopLayout() {
        document.querySelectorAll('.grid-modern').forEach(grid => {
            grid.style.gridTemplateColumns = ''; // Reset to original
        });
    }

    addMobileSpecificStyles() {
        const mobileStyles = document.createElement('style');
        mobileStyles.id = 'mobile-specific-styles';
        mobileStyles.textContent = `
            .mobile-optimized .btn-modern {
                min-height: 44px;
                padding: var(--space-md) var(--space-lg);
            }
            
            .mobile-optimized .form-input-modern {
                font-size: 16px; /* Prevents zoom on iOS */
                min-height: 44px;
            }
            
            .mobile-optimized .modern-card {
                padding: var(--space-lg);
            }
        `;
        document.head.appendChild(mobileStyles);
    }

    enhanceTouchTargets() {
        document.querySelectorAll('button, .btn, a, input, textarea, select').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.modernTheme = new ModernThemeSystem();
    window.responsiveEnhancer = new ResponsiveEnhancer();
    
    // Apply modern styles to existing content
    setTimeout(() => {
        window.modernTheme.modernizeExistingContent();
        window.modernTheme.addModernBackground();
    }, 100);
});

// Export for use in other modules
window.ModernThemeSystem = ModernThemeSystem;
window.ResponsiveEnhancer = ResponsiveEnhancer;