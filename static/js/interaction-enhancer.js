/**
 * Enhanced Interaction Experience
 * 增强的交互体验功能：键盘快捷键、拖拽、手势、加载动画等
 */

class InteractionEnhancer {
    constructor() {
        this.shortcuts = new Map();
        this.dragElements = new Set();
        this.isInitialized = false;
        this.gestureHandlers = new Map();
        this.loadingQueue = new Set();
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        this.setupLoadingAnimations();
        this.setupGestureHandlers();
        this.setupConfirmDialogs();
        this.setupTooltips();
        this.setupProgressIndicators();
        
        this.isInitialized = true;
        console.log('🚀 交互体验增强器已初始化');
    }
    
    // ===== 键盘快捷键系统 =====
    setupKeyboardShortcuts() {
        // 注册默认快捷键
        this.registerShortcut('Ctrl+Enter', '提交表单', () => {
            const activeForm = document.querySelector('form:focus-within');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        });
        
        this.registerShortcut('Ctrl+K', '快速搜索', () => {
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        });
        
        this.registerShortcut('Ctrl+D', '复制当前代码', () => {
            const codeElement = document.querySelector('pre code, .monaco-editor, textarea[name*="code"]');
            if (codeElement) {
                this.copyToClipboard(codeElement.textContent || codeElement.value);
            }
        });
        
        this.registerShortcut('Ctrl+L', '清空输入', () => {
            const activeInput = document.activeElement;
            if (activeInput && (activeInput.tagName === 'TEXTAREA' || activeInput.tagName === 'INPUT')) {
                if (confirm('确定要清空当前输入内容吗？')) {
                    activeInput.value = '';
                    this.showNotification('输入已清空', 'info');
                }
            }
        });
        
        this.registerShortcut('Ctrl+/', '显示快捷键帮助', () => {
            this.showShortcutHelp();
        });
        
        this.registerShortcut('Escape', '关闭弹窗', () => {
            const modal = document.querySelector('.modal.show');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });
        
        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            const key = this.getShortcutKey(e);
            if (this.shortcuts.has(key)) {
                e.preventDefault();
                const { action } = this.shortcuts.get(key);
                action();
            }
        });
    }
    
    registerShortcut(key, description, action) {
        this.shortcuts.set(key, { description, action });
    }
    
    getShortcutKey(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Meta');
        
        if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
            parts.push(e.key);
        }
        
        return parts.join('+');
    }
    
    showShortcutHelp() {
        const shortcuts = Array.from(this.shortcuts.entries());
        const helpContent = shortcuts.map(([key, { description }]) => 
            `<div class="shortcut-item">
                <kbd class="shortcut-key">${key}</kbd>
                <span class="shortcut-desc">${description}</span>
            </div>`
        ).join('');
        
        this.showModal('键盘快捷键', helpContent, 'info');
    }
    
    // ===== 拖拽功能 =====
    setupDragAndDrop() {
        // 文件拖拽上传
        this.setupFileDragDrop();
        
        // 代码块拖拽排序
        this.setupCodeBlockDrag();
        
        // 通用元素拖拽
        this.setupGeneralDrag();
    }
    
    setupFileDragDrop() {
        const dropZones = document.querySelectorAll('.file-drop-zone, textarea');
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                }
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    this.handleFilesDrop(files, zone);
                }
            });
        });
    }
    
    handleFilesDrop(files, targetElement) {
        const file = files[0];
        
        if (file.type === 'text/plain' || file.name.endsWith('.R') || file.name.endsWith('.r')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (targetElement.tagName === 'TEXTAREA') {
                    targetElement.value = e.target.result;
                    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    // 如果是代码编辑器
                    if (typeof advancedEditor !== 'undefined' && advancedEditor) {
                        advancedEditor.setValue(e.target.result);
                    }
                }
                this.showNotification(`文件 ${file.name} 已加载`, 'success');
            };
            reader.readAsText(file);
        } else {
            this.showNotification('仅支持文本文件和R脚本文件', 'warning');
        }
    }
    
    setupCodeBlockDrag() {
        const codeBlocks = document.querySelectorAll('.code-block, .code-container');
        
        codeBlocks.forEach(block => {
            block.draggable = true;
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.textContent);
                block.classList.add('dragging');
            });
            
            block.addEventListener('dragend', () => {
                block.classList.remove('dragging');
            });
        });
    }
    
    setupGeneralDrag() {
        const draggableElements = document.querySelectorAll('[data-draggable="true"]');
        
        draggableElements.forEach(element => {
            element.draggable = true;
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/html', element.outerHTML);
                element.classList.add('dragging');
            });
        });
    }
    
    // ===== 加载动画系统 =====
    setupLoadingAnimations() {
        // 表单提交加载
        this.setupFormLoadingStates();
        
        // 页面导航加载
        this.setupNavigationLoading();
        
        // AJAX请求加载
        this.setupAjaxLoading();
    }
    
    setupFormLoadingStates() {
        const forms = document.querySelectorAll('form[data-progress="true"]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    this.setLoadingState(submitBtn, true);
                    
                    // 添加加载覆盖层
                    this.addLoadingOverlay(form);
                }
            });
        });
    }
    
    setupNavigationLoading() {
        const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"]):not([target="_blank"])');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    this.showPageLoading();
                }
            });
        });
        
        // 监听页面卸载
        window.addEventListener('beforeunload', () => {
            this.showPageLoading();
        });
    }
    
    setupAjaxLoading() {
        // 拦截 fetch 请求
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const loadingId = this.generateLoadingId();
            this.addToLoadingQueue(loadingId);
            
            return originalFetch(...args)
                .finally(() => {
                    this.removeFromLoadingQueue(loadingId);
                });
        };
        
        // 拦截 XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            const loadingId = this.loadingId = generateLoadingId();
            addToLoadingQueue(loadingId);
            
            this.addEventListener('loadend', () => {
                removeFromLoadingQueue(loadingId);
            });
            
            return originalXHROpen.apply(this, args);
        };
    }
    
    setLoadingState(element, loading) {
        if (loading) {
            element.dataset.originalText = element.innerHTML;
            element.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>处理中...';
            element.disabled = true;
            element.classList.add('loading');
        } else {
            element.innerHTML = element.dataset.originalText || element.innerHTML;
            element.disabled = false;
            element.classList.remove('loading');
            delete element.dataset.originalText;
        }
    }
    
    addLoadingOverlay(container) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="loading-text mt-3">正在处理您的请求...</div>
            </div>
        `;
        
        container.style.position = 'relative';
        container.appendChild(overlay);
        
        return overlay;
    }
    
    removeLoadingOverlay(container) {
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    showPageLoading() {
        const pageLoader = document.createElement('div');
        pageLoader.id = 'page-loader';
        pageLoader.innerHTML = `
            <div class="page-loading-content">
                <div class="loading-logo">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
                <div class="loading-text">页面加载中...</div>
            </div>
        `;
        
        document.body.appendChild(pageLoader);
        
        // 模拟进度条
        setTimeout(() => {
            const progressBar = pageLoader.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
        }, 100);
    }
    
    // ===== 手势处理 =====
    setupGestureHandlers() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 滑动阈值
            const threshold = 50;
            
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
            
            if (Math.abs(deltaY) > threshold) {
                if (deltaY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }
        });
    }
    
    handleSwipeRight() {
        // 右滑：返回上一页或显示侧边栏
        if (history.length > 1) {
            history.back();
        }
    }
    
    handleSwipeLeft() {
        // 左滑：前进或隐藏侧边栏
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
        }
    }
    
    handleSwipeUp() {
        // 上滑：滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    handleSwipeDown() {
        // 下滑：显示下拉刷新
        this.showPullToRefresh();
    }
    
    // ===== 确认对话框 =====
    setupConfirmDialogs() {
        const dangerousActions = document.querySelectorAll('[data-confirm]');
        
        dangerousActions.forEach(element => {
            element.addEventListener('click', (e) => {
                const message = element.dataset.confirm;
                if (!this.showConfirmDialog(message)) {
                    e.preventDefault();
                    return false;
                }
            });
        });
    }
    
    showConfirmDialog(message, type = 'warning') {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, type);
            document.body.appendChild(modal);
            
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            
            modal.querySelector('.btn-confirm').onclick = () => {
                modalInstance.hide();
                resolve(true);
            };
            
            modal.querySelector('.btn-cancel').onclick = () => {
                modalInstance.hide();
                resolve(false);
            };
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        });
    }
    
    createConfirmModal(message, type) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle text-danger' : 'question-circle text-warning'}"></i>
                            确认操作
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-cancel">取消</button>
                        <button type="button" class="btn btn-${type === 'danger' ? 'danger' : 'warning'} btn-confirm">确认</button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }
    
    // ===== 工具提示 =====
    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"], [title]:not([title=""])');
        
        tooltipElements.forEach(element => {
            if (!element.dataset.bsToggle) {
                element.dataset.bsToggle = 'tooltip';
            }
            new bootstrap.Tooltip(element);
        });
    }
    
    // ===== 进度指示器 =====
    setupProgressIndicators() {
        const progressElements = document.querySelectorAll('.progress-indicator');
        
        progressElements.forEach(element => {
            this.animateProgress(element);
        });
    }
    
    animateProgress(element) {
        const target = parseInt(element.dataset.target) || 100;
        const duration = parseInt(element.dataset.duration) || 2000;
        const bar = element.querySelector('.progress-bar');
        
        if (bar) {
            let current = 0;
            const increment = target / (duration / 16);
            
            const animate = () => {
                current += increment;
                if (current >= target) {
                    current = target;
                } else {
                    requestAnimationFrame(animate);
                }
                
                bar.style.width = current + '%';
                bar.textContent = Math.round(current) + '%';
            };
            
            requestAnimationFrame(animate);
        }
    }
    
    // ===== 工具方法 =====
    generateLoadingId() {
        return 'loading_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    addToLoadingQueue(id) {
        this.loadingQueue.add(id);
        this.updateGlobalLoadingState();
    }
    
    removeFromLoadingQueue(id) {
        this.loadingQueue.delete(id);
        this.updateGlobalLoadingState();
    }
    
    updateGlobalLoadingState() {
        const isLoading = this.loadingQueue.size > 0;
        document.body.classList.toggle('is-loading', isLoading);
        
        // 更新页面标题
        if (isLoading) {
            document.title = '⏳ ' + document.title.replace(/^⏳ /, '');
        } else {
            document.title = document.title.replace(/^⏳ /, '');
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('已复制到剪贴板', 'success');
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            this.showNotification('复制失败', 'error');
            return false;
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast show`;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
    
    getIconForType(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    showModal(title, content, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                            ${title}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        return modalInstance;
    }
    
    showPullToRefresh() {
        if (document.querySelector('.pull-to-refresh')) return;
        
        const refreshElement = document.createElement('div');
        refreshElement.className = 'pull-to-refresh';
        refreshElement.innerHTML = `
            <div class="refresh-icon">
                <i class="fas fa-sync-alt fa-spin"></i>
            </div>
            <div class="refresh-text">松开刷新</div>
        `;
        
        document.body.insertBefore(refreshElement, document.body.firstChild);
        
        setTimeout(() => {
            refreshElement.remove();
            location.reload();
        }, 1000);
    }
}

// 样式定义
const interactionStyles = `
<style>
/* 快捷键帮助样式 */
.shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
}

.shortcut-key {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
}

.shortcut-desc {
    color: #6c757d;
}

/* 拖拽样式 */
.drag-over {
    border: 2px dashed #007bff !important;
    background: rgba(0, 123, 255, 0.1) !important;
}

.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
}

/* 加载覆盖层 */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.loading-spinner {
    text-align: center;
}

.loading-text {
    color: #6c757d;
    font-size: 0.875rem;
}

/* 页面加载器 */
#page-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.page-loading-content {
    text-align: center;
    color: white;
}

.loading-logo {
    font-size: 4rem;
    margin-bottom: 2rem;
    animation: pulse 2s infinite;
}

.loading-progress {
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin: 2rem auto;
}

.progress-bar {
    height: 100%;
    background: white;
    width: 0%;
    transition: width 2s ease;
}

/* 通知样式增强 */
.notification-toast {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: none;
    border-radius: 8px;
}

/* 下拉刷新 */
.pull-to-refresh {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #007bff;
    color: white;
    padding: 1rem 2rem;
    border-radius: 0 0 8px 8px;
    z-index: 9999;
    animation: slideDown 0.3s ease;
}

/* 动画 */
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); }
    to { transform: translateX(-50%) translateY(0); }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* 加载状态 */
.is-loading {
    cursor: wait;
}

.is-loading * {
    pointer-events: none;
}

/* 响应式优化 */
@media (max-width: 768px) {
    .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
    
    .notification-toast {
        left: 10px;
        right: 10px;
        min-width: auto;
    }
    
    #page-loader .loading-logo {
        font-size: 3rem;
    }
    
    .loading-progress {
        width: 150px;
    }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
    .loading-overlay {
        background: rgba(0, 0, 0, 0.8);
        color: white;
    }
    
    .shortcut-key {
        background: #000;
        color: #fff;
        border-color: #fff;
    }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
    .loading-logo,
    .notification-toast,
    .pull-to-refresh {
        animation: none !important;
    }
    
    .progress-bar {
        transition: none !important;
    }
}
</style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', interactionStyles);

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.interactionEnhancer = new InteractionEnhancer();
});

// 导出
window.InteractionEnhancer = InteractionEnhancer;