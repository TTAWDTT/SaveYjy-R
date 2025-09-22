/**
 * User Experience Enhancer
 * 用户体验增强模块：智能提示、快捷操作、个性化设置等
 */

class UXEnhancer {
    constructor() {
        this.preferences = this.loadPreferences();
        this.shortcuts = new Map();
        this.tooltips = new Map();
        this.tutorials = new Map();
        this.analytics = {
            interactions: 0,
            features_used: new Set(),
            session_start: Date.now(),
            errors: []
        };
        
        this.init();
    }
    
    init() {
        this.setupSmartTooltips();
        this.setupContextMenus();
        this.setupKeyboardShortcuts();
        this.setupGestures();
        this.setupPersonalization();
        this.setupAccessibility();
        this.setupProgressiveDisclosure();
        this.setupSmartSuggestions();
        this.setupErrorPrevention();
        this.setupPerformanceFeedback();
        
        console.log('🎨 用户体验增强器已初始化');
    }
    
    // ===== 智能提示系统 =====
    setupSmartTooltips() {
        this.observeUserBehavior();
        this.createTooltipSystem();
        this.setupContextualHelp();
    }
    
    observeUserBehavior() {
        let hoverTime = 0;
        let lastHoverElement = null;
        
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[data-tooltip], [title], button, input, .interactive');
            if (!element) return;
            
            lastHoverElement = element;
            hoverTime = Date.now();
            
            setTimeout(() => {
                if (lastHoverElement === element && Date.now() - hoverTime >= 800) {
                    this.showSmartTooltip(element);
                }
            }, 800);
        });
        
        document.addEventListener('mouseout', () => {
            lastHoverElement = null;
            this.hideAllTooltips();
        });
    }
    
    showSmartTooltip(element) {
        const existingTooltip = document.querySelector('.smart-tooltip');
        if (existingTooltip) existingTooltip.remove();
        
        const content = this.generateTooltipContent(element);
        if (!content) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'smart-tooltip';
        tooltip.innerHTML = content;
        
        document.body.appendChild(tooltip);
        this.positionTooltip(tooltip, element);
        
        // 动画显示
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
        
        // 记录交互
        this.analytics.interactions++;
        this.analytics.features_used.add('smart_tooltip');
    }
    
    generateTooltipContent(element) {
        // 基础提示
        let content = element.dataset.tooltip || element.title || '';
        
        // 快捷键提示
        const shortcut = this.getShortcutForElement(element);
        if (shortcut) {
            content += `<div class="tooltip-shortcut">快捷键: ${shortcut}</div>`;
        }
        
        // 使用统计
        const usage = this.getUsageStats(element);
        if (usage.count > 0) {
            content += `<div class="tooltip-usage">使用次数: ${usage.count}</div>`;
        }
        
        // 相关功能推荐
        const related = this.getRelatedFeatures(element);
        if (related.length > 0) {
            content += `<div class="tooltip-related">相关功能: ${related.join(', ')}</div>`;
        }
        
        return content || null;
    }
    
    positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // 边界检查
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top + tooltipRect.height > window.innerHeight - 8) {
            top = rect.top - tooltipRect.height - 8;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }
    
    hideAllTooltips() {
        document.querySelectorAll('.smart-tooltip').forEach(tooltip => {
            tooltip.classList.remove('visible');
            setTimeout(() => tooltip.remove(), 300);
        });
    }
    
    // ===== 上下文菜单 =====
    setupContextMenus() {
        document.addEventListener('contextmenu', (e) => {
            const element = e.target.closest('[data-context-menu], .code-editor, textarea, input');
            if (!element) return;
            
            e.preventDefault();
            this.showContextMenu(e, element);
        });
        
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }
    
    showContextMenu(event, element) {
        this.hideContextMenu();
        
        const menu = this.createContextMenu(element);
        if (!menu) return;
        
        document.body.appendChild(menu);
        
        // 定位菜单
        let x = event.clientX;
        let y = event.clientY;
        
        const menuRect = menu.getBoundingClientRect();
        if (x + menuRect.width > window.innerWidth) {
            x = window.innerWidth - menuRect.width - 8;
        }
        if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height - 8;
        }
        
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        requestAnimationFrame(() => {
            menu.classList.add('visible');
        });
    }
    
    createContextMenu(element) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        const actions = this.getContextActions(element);
        if (actions.length === 0) return null;
        
        actions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            if (action.disabled) item.classList.add('disabled');
            
            item.innerHTML = `
                <i class="fas fa-${action.icon}"></i>
                <span>${action.label}</span>
                ${action.shortcut ? `<kbd>${action.shortcut}</kbd>` : ''}
            `;
            
            if (!action.disabled) {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    action.handler();
                    this.hideContextMenu();
                });
            }
            
            menu.appendChild(item);
        });
        
        return menu;
    }
    
    getContextActions(element) {
        const actions = [];
        
        // 通用操作
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.contentEditable === 'true') {
            const hasSelection = window.getSelection().toString().length > 0;
            
            actions.push(
                { icon: 'cut', label: '剪切', shortcut: 'Ctrl+X', handler: () => document.execCommand('cut'), disabled: !hasSelection },
                { icon: 'copy', label: '复制', shortcut: 'Ctrl+C', handler: () => document.execCommand('copy'), disabled: !hasSelection },
                { icon: 'paste', label: '粘贴', shortcut: 'Ctrl+V', handler: () => document.execCommand('paste') },
                { icon: 'undo', label: '撤销', shortcut: 'Ctrl+Z', handler: () => document.execCommand('undo') },
                { icon: 'redo', label: '重做', shortcut: 'Ctrl+Y', handler: () => document.execCommand('redo') }
            );
        }
        
        // 代码编辑器特殊操作
        if (element.classList.contains('code-editor')) {
            actions.push(
                { icon: 'play', label: '运行代码', shortcut: 'Ctrl+Enter', handler: () => this.runCode(element) },
                { icon: 'save', label: '保存代码', shortcut: 'Ctrl+S', handler: () => this.saveCode(element) },
                { icon: 'download', label: '导出代码', handler: () => this.exportCode(element) },
                { icon: 'share', label: '分享代码', handler: () => this.shareCode(element) }
            );
        }
        
        return actions;
    }
    
    hideContextMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) {
            menu.classList.remove('visible');
            setTimeout(() => menu.remove(), 200);
        }
    }
    
    // ===== 键盘快捷键增强 =====
    setupKeyboardShortcuts() {
        // 注册默认快捷键
        this.registerShortcuts({
            'Ctrl+/': () => this.showShortcutHelp(),
            'Ctrl+K': () => this.openCommandPalette(),
            'Ctrl+Shift+P': () => this.openCommandPalette(),
            'F1': () => this.showHelp(),
            'Escape': () => this.closeAllModals(),
            'Ctrl+,': () => this.openSettings(),
            'Ctrl+Shift+I': () => this.openInspector(),
            'Alt+F': () => this.focusSearchBox(),
            'Ctrl+B': () => this.toggleSidebar(),
            'Ctrl+Shift+D': () => this.toggleDarkMode()
        });
        
        document.addEventListener('keydown', (e) => {
            const combo = this.getKeyCombo(e);
            const handler = this.shortcuts.get(combo);
            
            if (handler) {
                e.preventDefault();
                handler();
                this.analytics.features_used.add('keyboard_shortcut');
            }
        });
    }
    
    registerShortcuts(shortcuts) {
        Object.entries(shortcuts).forEach(([combo, handler]) => {
            this.shortcuts.set(combo, handler);
        });
    }
    
    getKeyCombo(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        if (event.metaKey) parts.push('Meta');
        
        const key = event.key;
        if (key.length === 1) {
            parts.push(key.toUpperCase());
        } else {
            parts.push(key);
        }
        
        return parts.join('+');
    }
    
    showShortcutHelp() {
        const modal = this.createModal('快捷键帮助', this.generateShortcutList());
        this.showModal(modal);
    }
    
    generateShortcutList() {
        const categories = {
            '通用': [
                ['Ctrl+/', '显示快捷键帮助'],
                ['Ctrl+K', '打开命令面板'],
                ['Ctrl+,', '打开设置'],
                ['Escape', '关闭弹窗']
            ],
            '编辑': [
                ['Ctrl+Z', '撤销'],
                ['Ctrl+Y', '重做'],
                ['Ctrl+A', '全选'],
                ['Ctrl+C', '复制'],
                ['Ctrl+V', '粘贴']
            ],
            '导航': [
                ['Ctrl+B', '切换侧边栏'],
                ['Alt+F', '聚焦搜索框'],
                ['F1', '显示帮助']
            ]
        };
        
        let html = '';
        Object.entries(categories).forEach(([category, shortcuts]) => {
            html += `<div class="shortcut-category">
                <h4>${category}</h4>
                <div class="shortcut-list">`;
            
            shortcuts.forEach(([combo, description]) => {
                html += `<div class="shortcut-item">
                    <span class="shortcut-description">${description}</span>
                    <kbd>${combo}</kbd>
                </div>`;
            });
            
            html += '</div></div>';
        });
        
        return html;
    }
    
    // ===== 手势支持 =====
    setupGestures() {
        if (!('ontouchstart' in window)) return;
        
        let touchStartX, touchStartY, touchStartTime;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const deltaTime = touchEndTime - touchStartTime;
                
                this.handleGesture(deltaX, deltaY, deltaTime, e.target);
            }
        }, { passive: true });
    }
    
    handleGesture(deltaX, deltaY, deltaTime, target) {
        const minDistance = 100;
        const maxTime = 500;
        
        if (deltaTime > maxTime) return;
        
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > minDistance && absX > absY) {
            // 水平滑动
            if (deltaX > 0) {
                this.handleSwipeRight(target);
            } else {
                this.handleSwipeLeft(target);
            }
        } else if (absY > minDistance && absY > absX) {
            // 垂直滑动
            if (deltaY > 0) {
                this.handleSwipeDown(target);
            } else {
                this.handleSwipeUp(target);
            }
        }
    }
    
    handleSwipeRight(target) {
        // 右滑：返回上一页或显示侧边栏
        if (target.closest('.modal')) {
            this.closeModal(target.closest('.modal'));
        } else {
            this.toggleSidebar(true);
        }
    }
    
    handleSwipeLeft(target) {
        // 左滑：隐藏侧边栏或下一页
        this.toggleSidebar(false);
    }
    
    handleSwipeUp(target) {
        // 上滑：滚动到顶部或显示快捷操作
        if (window.scrollY > 100) {
            this.smoothScrollTo(0);
        }
    }
    
    handleSwipeDown(target) {
        // 下滑：刷新页面或显示通知
        if (window.scrollY === 0) {
            this.refreshPage();
        }
    }
    
    // ===== 个性化设置 =====
    setupPersonalization() {
        this.loadUserPreferences();
        this.setupThemeSystem();
        this.setupLayoutCustomization();
        this.setupBehaviorAdaptation();
    }
    
    loadUserPreferences() {
        const stored = localStorage.getItem('ux_preferences');
        if (stored) {
            this.preferences = { ...this.preferences, ...JSON.parse(stored) };
        }
        
        this.applyPreferences();
    }
    
    applyPreferences() {
        // 应用主题
        if (this.preferences.theme) {
            document.body.dataset.theme = this.preferences.theme;
        }
        
        // 应用字体大小
        if (this.preferences.fontSize) {
            document.documentElement.style.fontSize = `${this.preferences.fontSize}px`;
        }
        
        // 应用动画设置
        if (this.preferences.reduceMotion) {
            document.body.classList.add('reduce-motion');
        }
        
        // 应用布局设置
        if (this.preferences.compactMode) {
            document.body.classList.add('compact-mode');
        }
    }
    
    savePreferences() {
        localStorage.setItem('ux_preferences', JSON.stringify(this.preferences));
    }
    
    updatePreference(key, value) {
        this.preferences[key] = value;
        this.savePreferences();
        this.applyPreferences();
    }
    
    // ===== 无障碍功能 =====
    setupAccessibility() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupHighContrastMode();
        this.setupFocusManagement();
    }
    
    setupKeyboardNavigation() {
        // Tab键导航增强
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // 跳转链接
        this.createSkipLinks();
    }
    
    createSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content">跳转到主要内容</a>
            <a href="#navigation">跳转到导航</a>
            <a href="#search">跳转到搜索</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    setupScreenReaderSupport() {
        // 为动态内容添加ARIA实时区域
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only live-region';
        document.body.appendChild(liveRegion);
        
        this.liveRegion = liveRegion;
    }
    
    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    // ===== 渐进式披露 =====
    setupProgressiveDisclosure() {
        this.observeUserExpertise();
        this.createTutorialSystem();
        this.setupFeatureDiscovery();
    }
    
    observeUserExpertise() {
        // 基于用户行为判断专业水平
        const expertiseScore = this.calculateExpertiseScore();
        
        if (expertiseScore < 30) {
            this.showBeginnersFeatures();
        } else if (expertiseScore > 70) {
            this.showAdvancedFeatures();
        }
    }
    
    calculateExpertiseScore() {
        const factors = {
            sessionTime: Math.min((Date.now() - this.analytics.session_start) / 60000, 30), // 最多30分钟
            featuresUsed: this.analytics.features_used.size,
            interactions: Math.min(this.analytics.interactions, 100),
            shortcutsUsed: Array.from(this.analytics.features_used).filter(f => f.includes('shortcut')).length
        };
        
        return (factors.sessionTime + factors.featuresUsed * 2 + factors.interactions / 10 + factors.shortcutsUsed * 5);
    }
    
    // ===== 智能建议 =====
    setupSmartSuggestions() {
        this.setupCodeSuggestions();
        this.setupWorkflowSuggestions();
        this.setupOptimizationSuggestions();
    }
    
    setupCodeSuggestions() {
        const codeInputs = document.querySelectorAll('.code-editor, textarea[name*="code"]');
        
        codeInputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                this.analyzeCodeAndSuggest(input);
            }, 1000));
        });
    }
    
    analyzeCodeAndSuggest(input) {
        const code = input.value;
        const suggestions = [];
        
        // 分析常见问题
        if (code.includes('for(')) {
            suggestions.push({
                type: 'improvement',
                message: '考虑使用向量化操作替代for循环以提高性能',
                action: () => this.showVectorizationExample()
            });
        }
        
        if (code.includes('library(') && !code.includes('suppressMessages(')) {
            suggestions.push({
                type: 'best-practice',
                message: '建议使用suppressMessages()来减少加载库时的输出',
                action: () => this.insertSuppressMessages(input)
            });
        }
        
        if (suggestions.length > 0) {
            this.showSuggestions(input, suggestions);
        }
    }
    
    showSuggestions(element, suggestions) {
        const suggestionPanel = document.createElement('div');
        suggestionPanel.className = 'suggestion-panel';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = `suggestion-item ${suggestion.type}`;
            item.innerHTML = `
                <div class="suggestion-content">
                    <i class="fas fa-lightbulb"></i>
                    <span>${suggestion.message}</span>
                </div>
                <button class="suggestion-action">应用</button>
            `;
            
            item.querySelector('.suggestion-action').addEventListener('click', suggestion.action);
            suggestionPanel.appendChild(item);
        });
        
        this.positionSuggestionPanel(suggestionPanel, element);
        document.body.appendChild(suggestionPanel);
        
        // 自动隐藏
        setTimeout(() => {
            suggestionPanel.remove();
        }, 10000);
    }
    
    // ===== 错误预防 =====
    setupErrorPrevention() {
        this.setupFormValidation();
        this.setupNavigationGuards();
        this.setupDataLossProtection();
    }
    
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showValidationErrors(form);
                }
            });
        });
    }
    
    validateForm(form) {
        const errors = [];
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.name || field.id} 是必填项`);
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });
        
        return errors.length === 0;
    }
    
    setupNavigationGuards() {
        let hasUnsavedChanges = false;
        
        // 监听表单变化
        document.addEventListener('input', (e) => {
            if (e.target.closest('form')) {
                hasUnsavedChanges = true;
            }
        });
        
        // 监听表单提交
        document.addEventListener('submit', () => {
            hasUnsavedChanges = false;
        });
        
        // 页面离开警告
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return e.returnValue;
            }
        });
    }
    
    // ===== 性能反馈 =====
    setupPerformanceFeedback() {
        this.monitorInteractionLatency();
        this.showProgressIndicators();
        this.optimizeScrollPerformance();
    }
    
    monitorInteractionLatency() {
        const interactiveElements = document.querySelectorAll('button, a, input, [onclick]');
        
        interactiveElements.forEach(element => {
            element.addEventListener('click', () => {
                const start = performance.now();
                
                requestAnimationFrame(() => {
                    const latency = performance.now() - start;
                    if (latency > 16) { // 超过一帧时间
                        this.showPerformanceWarning(element, latency);
                    }
                });
            });
        });
    }
    
    showProgressIndicators() {
        // 为长时间操作显示进度
        const loadingButtons = document.querySelectorAll('[data-loading]');
        
        loadingButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.showButtonLoading(button);
            });
        });
    }
    
    showButtonLoading(button) {
        const originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        button.disabled = true;
        
        // 模拟完成（实际中应该根据实际操作完成）
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }
    
    // ===== 辅助方法 =====
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'ux-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" aria-label="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        return modal;
    }
    
    showModal(modal) {
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
        
        // 聚焦管理
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements[0]) {
            focusableElements[0].focus();
        }
    }
    
    closeModal(modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    smoothScrollTo(position) {
        window.scrollTo({
            top: position,
            behavior: 'smooth'
        });
    }
    
    // 其他方法的实现...
    getShortcutForElement(element) { return null; }
    getUsageStats(element) { return { count: 0 }; }
    getRelatedFeatures(element) { return []; }
    runCode(element) { console.log('运行代码'); }
    saveCode(element) { console.log('保存代码'); }
    exportCode(element) { console.log('导出代码'); }
    shareCode(element) { console.log('分享代码'); }
    openCommandPalette() { console.log('打开命令面板'); }
    showHelp() { console.log('显示帮助'); }
    closeAllModals() { document.querySelectorAll('.ux-modal').forEach(m => this.closeModal(m)); }
    openSettings() { console.log('打开设置'); }
    openInspector() { console.log('打开检查器'); }
    focusSearchBox() { document.querySelector('input[type="search"]')?.focus(); }
    toggleSidebar(show) { console.log('切换侧边栏'); }
    toggleDarkMode() { this.updatePreference('theme', this.preferences.theme === 'dark' ? 'light' : 'dark'); }
    refreshPage() { location.reload(); }
    showBeginnersFeatures() { console.log('显示初学者功能'); }
    showAdvancedFeatures() { console.log('显示高级功能'); }
    showVectorizationExample() { console.log('显示向量化示例'); }
    insertSuppressMessages(input) { console.log('插入suppressMessages'); }
    positionSuggestionPanel(panel, element) { /* 定位逻辑 */ }
    showValidationErrors(form) { console.log('显示验证错误'); }
    showPerformanceWarning(element, latency) { console.log(`性能警告: ${latency}ms`); }
}

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 样式
const uxStyles = `
<style>
/* 智能提示 */
.smart-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    max-width: 300px;
    z-index: 10000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    pointer-events: none;
}

.smart-tooltip.visible {
    opacity: 1;
    transform: translateY(0);
}

.tooltip-shortcut,
.tooltip-usage,
.tooltip-related {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 12px;
    opacity: 0.8;
}

/* 上下文菜单 */
.context-menu {
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.2s ease;
    overflow: hidden;
}

.context-menu.visible {
    opacity: 1;
    transform: scale(1);
}

.context-menu-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.context-menu-item:hover:not(.disabled) {
    background: #f8f9fa;
}

.context-menu-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.context-menu-item i {
    margin-right: 12px;
    width: 16px;
    color: #6c757d;
}

.context-menu-item kbd {
    margin-left: auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
}

/* 快捷键帮助 */
.shortcut-category {
    margin-bottom: 24px;
}

.shortcut-category h4 {
    color: #495057;
    margin-bottom: 12px;
    font-size: 16px;
}

.shortcut-list {
    display: grid;
    gap: 8px;
}

.shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;
}

.shortcut-description {
    color: #495057;
}

.shortcut-item kbd {
    background: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 600;
}

/* 建议面板 */
.suggestion-panel {
    position: absolute;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 400px;
    overflow: hidden;
}

.suggestion-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f8f9fa;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item.improvement {
    border-left: 4px solid #28a745;
}

.suggestion-item.best-practice {
    border-left: 4px solid #ffc107;
}

.suggestion-content {
    flex: 1;
    display: flex;
    align-items: center;
}

.suggestion-content i {
    margin-right: 8px;
    color: #6c757d;
}

.suggestion-action {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

/* 模态框 */
.ux-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.ux-modal.visible {
    opacity: 1;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.modal-content {
    position: relative;
    background: white;
    border-radius: 12px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.ux-modal.visible .modal-content {
    transform: scale(1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
    margin: 0;
    color: #495057;
}

.modal-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #6c757d;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.modal-close:hover {
    background: #f8f9fa;
}

.modal-body {
    padding: 24px;
}

/* 无障碍功能 */
.skip-links {
    position: absolute;
    top: -100px;
    left: 0;
    z-index: 10000;
}

.skip-links a {
    position: absolute;
    left: -10000px;
    background: #000;
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 0 0 4px 0;
}

.skip-links a:focus {
    position: static;
    left: 0;
    top: 0;
}

.sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

/* 键盘导航 */
.keyboard-navigation *:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

/* 表单验证 */
.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

/* 加载状态 */
.loading button {
    position: relative;
    color: transparent;
}

.loading button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .smart-tooltip {
        max-width: 250px;
        font-size: 12px;
        padding: 8px 12px;
    }
    
    .context-menu {
        min-width: 200px;
    }
    
    .modal-content {
        margin: 16px;
        max-height: calc(100vh - 32px);
    }
    
    .suggestion-panel {
        max-width: calc(100vw - 32px);
    }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
    .smart-tooltip {
        background: black;
        border: 2px solid white;
    }
    
    .context-menu {
        border: 2px solid black;
    }
    
    .suggestion-panel {
        border: 2px solid black;
    }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
    .smart-tooltip,
    .context-menu,
    .ux-modal,
    .modal-content {
        transition: none;
    }
    
    .loading button::after {
        animation: none;
    }
}
</style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', uxStyles);

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.uxEnhancer = new UXEnhancer();
});

// 导出
window.UXEnhancer = UXEnhancer;