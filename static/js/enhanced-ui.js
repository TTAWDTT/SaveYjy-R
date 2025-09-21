/**
 * 实时进度监控和通知系统的JavaScript组件
 */

class ProgressMonitor {
    constructor() {
        this.activeRequests = new Map();
        this.setupProgressBars();
        this.setupNotificationSystem();
    }
    
    setupProgressBars() {
        // 为每个表单添加进度条
        const forms = document.querySelectorAll('form[data-progress="true"]');
        forms.forEach(form => {
            this.addProgressBarToForm(form);
        });
    }
    
    addProgressBarToForm(form) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container d-none';
        progressContainer.innerHTML = `
            <div class="progress mb-3">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 0%">
                    <span class="progress-text">处理中...</span>
                </div>
            </div>
            <div class="progress-details">
                <small class="text-muted">
                    <span class="current-step">正在初始化</span>
                    <span class="float-end">
                        <span class="elapsed-time">0</span>秒
                    </span>
                </small>
            </div>
        `;
        
        // 插入到表单的开头
        form.insertBefore(progressContainer, form.firstChild);
        
        // 添加表单提交监听器
        form.addEventListener('submit', (e) => {
            this.startProgress(form);
        });
    }
    
    startProgress(form) {
        const progressContainer = form.querySelector('.progress-container');
        const progressBar = form.querySelector('.progress-bar');
        const progressText = form.querySelector('.progress-text');
        const currentStep = form.querySelector('.current-step');
        const elapsedTimeElement = form.querySelector('.elapsed-time');
        
        progressContainer.classList.remove('d-none');
        
        const requestId = Date.now().toString();
        const startTime = Date.now();
        
        // 存储请求信息
        this.activeRequests.set(requestId, {
            form: form,
            startTime: startTime,
            progressBar: progressBar,
            progressText: progressText,
            currentStep: currentStep,
            elapsedTimeElement: elapsedTimeElement
        });
        
        // 开始进度模拟
        this.simulateProgress(requestId);
        
        return requestId;
    }
    
    simulateProgress(requestId) {
        const request = this.activeRequests.get(requestId);
        if (!request) return;
        
        const steps = [
            { progress: 10, text: '正在分析输入...', time: 1000 },
            { progress: 25, text: '调用AI服务...', time: 2000 },
            { progress: 50, text: '处理工作流...', time: 3000 },
            { progress: 75, text: '生成响应...', time: 4000 },
            { progress: 90, text: '优化结果...', time: 1000 }
        ];
        
        let currentStepIndex = 0;
        
        const updateProgress = () => {
            if (currentStepIndex >= steps.length) return;
            
            const step = steps[currentStepIndex];
            this.updateProgress(requestId, step.progress, step.text);
            
            currentStepIndex++;
            setTimeout(updateProgress, step.time);
        };
        
        updateProgress();
        
        // 更新时间显示
        const timeInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - request.startTime) / 1000);
            request.elapsedTimeElement.textContent = elapsed;
            
            if (!this.activeRequests.has(requestId)) {
                clearInterval(timeInterval);
            }
        }, 1000);
    }
    
    updateProgress(requestId, percentage, stepText) {
        const request = this.activeRequests.get(requestId);
        if (!request) return;
        
        request.progressBar.style.width = `${percentage}%`;
        request.progressText.textContent = `${percentage}%`;
        request.currentStep.textContent = stepText;
    }
    
    completeProgress(requestId, success = true) {
        const request = this.activeRequests.get(requestId);
        if (!request) return;
        
        if (success) {
            request.progressBar.style.width = '100%';
            request.progressText.textContent = '完成!';
            request.currentStep.textContent = '处理完成';
            request.progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            request.progressBar.classList.add('bg-success');
        } else {
            request.progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            request.progressBar.classList.add('bg-danger');
            request.progressText.textContent = '错误';
            request.currentStep.textContent = '处理失败';
        }
        
        // 3秒后隐藏进度条
        setTimeout(() => {
            const progressContainer = request.form.querySelector('.progress-container');
            progressContainer.classList.add('d-none');
            this.activeRequests.delete(requestId);
        }, 3000);
    }
    
    setupNotificationSystem() {
        // 创建通知容器
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'position-fixed top-0 end-0 p-3';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notificationContainer = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `toast align-items-center text-white bg-${type} border-0`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast"></button>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        // 使用Bootstrap的Toast组件
        const bsToast = new bootstrap.Toast(notification, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();
        
        // 在toast隐藏后移除元素
        notification.addEventListener('hidden.bs.toast', () => {
            notification.remove();
        });
    }
}

// 全局进度监控实例
const progressMonitor = new ProgressMonitor();

// 增强的AJAX请求处理
class EnhancedAjaxHandler {
    constructor() {
        this.setupAjaxHandlers();
    }
    
    setupAjaxHandlers() {
        // 代码解释增强处理
        this.setupCodeExplanationHandler();
        
        // 聊天增强处理
        this.setupChatHandler();
        
        // 新增API功能处理
        this.setupApiHandlers();
    }
    
    setupCodeExplanationHandler() {
        const form = document.getElementById('explanation-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const requestId = progressMonitor.startProgress(form);
            const formData = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    const html = await response.text();
                    document.getElementById('explanation-result').innerHTML = html;
                    
                    progressMonitor.completeProgress(requestId, true);
                    progressMonitor.showNotification('代码解释完成！', 'success');
                    
                    // 获取代码质量分析
                    this.requestCodeQuality(formData.get('r_code'));
                    
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                progressMonitor.completeProgress(requestId, false);
                progressMonitor.showNotification(`处理失败: ${error.message}`, 'danger');
                console.error('Code explanation error:', error);
            }
        });
    }
    
    async requestCodeQuality(code) {
        try {
            const response = await fetch('/api/code-quality/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ code: code })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayCodeQuality(data.analysis);
            }
        } catch (error) {
            console.error('Code quality analysis error:', error);
        }
    }
    
    displayCodeQuality(analysis) {
        const qualityContainer = document.getElementById('quality-analysis-container');
        if (!qualityContainer) return;
        
        qualityContainer.innerHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h6><i class="fas fa-chart-line me-2"></i>代码质量分析</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="quality-metric">
                                <label>可读性评分</label>
                                <div class="progress">
                                    <div class="progress-bar" style="width: ${analysis.readability_score * 100}%">
                                        ${Math.round(analysis.readability_score * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="quality-metric">
                                <label>可维护性评分</label>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: ${analysis.maintainability_score * 100}%">
                                        ${Math.round(analysis.maintainability_score * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <h6>最佳实践检查</h6>
                        <ul class="list-unstyled">
                            ${analysis.best_practices.map(practice => `<li><i class="fas fa-check text-success me-2"></i>${practice}</li>`).join('')}
                        </ul>
                    </div>
                    
                    ${analysis.performance_suggestions.length > 0 ? `
                        <div class="mt-3">
                            <h6>性能建议</h6>
                            <ul class="list-unstyled">
                                ${analysis.performance_suggestions.map(suggestion => `<li><i class="fas fa-lightbulb text-warning me-2"></i>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        qualityContainer.classList.remove('d-none');
    }
    
    setupChatHandler() {
        const form = document.getElementById('chat-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const requestId = progressMonitor.startProgress(form);
            const formData = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    const html = await response.text();
                    document.getElementById('chat-result').innerHTML = html;
                    
                    progressMonitor.completeProgress(requestId, true);
                    progressMonitor.showNotification('聊天回复完成！', 'success');
                    
                    // 清空输入框
                    form.querySelector('textarea[name="message"]').value = '';
                    
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                progressMonitor.completeProgress(requestId, false);
                progressMonitor.showNotification(`聊天失败: ${error.message}`, 'danger');
                console.error('Chat error:', error);
            }
        });
    }
    
    setupApiHandlers() {
        // 测试用例生成按钮
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="generate-tests"]')) {
                this.generateTestCases(e.target);
            }
        });
        
        // 优化建议按钮
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="optimize-code"]')) {
                this.getOptimizationSuggestions(e.target);
            }
        });
    }
    
    async generateTestCases(button) {
        const code = document.getElementById('r_code_input').value;
        if (!code.trim()) {
            progressMonitor.showNotification('请先输入代码', 'warning');
            return;
        }
        
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>生成中...';
        
        try {
            const response = await fetch('/api/test-cases/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ code: code })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayTestCases(data.test_cases);
                progressMonitor.showNotification('测试用例生成完成！', 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            progressMonitor.showNotification(`生成测试用例失败: ${error.message}`, 'danger');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-vial me-2"></i>生成测试用例';
        }
    }
    
    displayTestCases(testCases) {
        const container = document.getElementById('test-cases-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h6><i class="fas fa-vial me-2"></i>测试用例</h6>
                </div>
                <div class="card-body">
                    <pre><code class="language-r">${testCases.test_code}</code></pre>
                    <div class="mt-3">
                        <h6>测试框架: ${testCases.testing_framework}</h6>
                        <div class="badge-group">
                            ${testCases.test_categories.map(category => `<span class="badge bg-secondary me-1">${category}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.classList.remove('d-none');
    }
    
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
}

// 初始化增强的AJAX处理器
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedAjaxHandler();
});

// 响应式设计增强
class ResponsiveEnhancer {
    constructor() {
        this.setupResponsiveFeatures();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
    }
    
    setupResponsiveFeatures() {
        // 移动端优化
        if (window.innerWidth < 768) {
            this.enableMobileOptimizations();
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustLayoutForScreenSize();
        });
    }
    
    enableMobileOptimizations() {
        // 为移动端添加特殊样式类
        document.body.classList.add('mobile-optimized');
        
        // 调整表单输入框高度
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.style.minHeight = '120px';
        });
        
        // 添加触摸友好的按钮样式
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.classList.add('btn-lg');
        });
    }
    
    adjustLayoutForScreenSize() {
        const isSmallScreen = window.innerWidth < 768;
        
        // 调整侧边栏显示
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            if (isSmallScreen) {
                sidebar.classList.add('d-none', 'd-md-block');
            } else {
                sidebar.classList.remove('d-none');
            }
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter 提交表单
            if (e.ctrlKey && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'TEXTAREA') {
                    const form = activeElement.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            }
            
            // Ctrl+K 聚焦到搜索框
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], textarea');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }
    
    setupAutoSave() {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            let saveTimeout;
            
            textarea.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.autoSaveContent(textarea);
                }, 2000); // 2秒后自动保存
            });
        });
    }
    
    autoSaveContent(textarea) {
        const key = `autosave_${textarea.id || textarea.name}`;
        localStorage.setItem(key, textarea.value);
        
        // 显示保存指示器
        this.showSaveIndicator(textarea);
    }
    
    showSaveIndicator(textarea) {
        let indicator = textarea.parentNode.querySelector('.save-indicator');
        if (!indicator) {
            indicator = document.createElement('small');
            indicator.className = 'save-indicator text-muted';
            textarea.parentNode.appendChild(indicator);
        }
        
        indicator.textContent = '已自动保存';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }
    
    restoreAutoSavedContent() {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const key = `autosave_${textarea.id || textarea.name}`;
            const savedContent = localStorage.getItem(key);
            
            if (savedContent && !textarea.value.trim()) {
                textarea.value = savedContent;
                this.showRestoreIndicator(textarea);
            }
        });
    }
    
    showRestoreIndicator(textarea) {
        const indicator = document.createElement('div');
        indicator.className = 'alert alert-info alert-dismissible fade show';
        indicator.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            已恢复自动保存的内容
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        textarea.parentNode.insertBefore(indicator, textarea);
        
        setTimeout(() => {
            indicator.remove();
        }, 5000);
    }
}

// 初始化响应式增强
document.addEventListener('DOMContentLoaded', () => {
    const responsiveEnhancer = new ResponsiveEnhancer();
    responsiveEnhancer.restoreAutoSavedContent();
});

// 性能监控客户端
class ClientPerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            ajaxRequestTimes: [],
            userInteractions: 0,
            errors: []
        };
        
        this.init();
    }
    
    init() {
        this.measurePageLoadTime();
        this.trackUserInteractions();
        this.trackErrors();
        this.sendMetricsToServer();
    }
    
    measurePageLoadTime() {
        window.addEventListener('load', () => {
            this.metrics.pageLoadTime = performance.now();
            console.log(`Page loaded in ${this.metrics.pageLoadTime}ms`);
        });
    }
    
    trackUserInteractions() {
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.metrics.userInteractions++;
            });
        });
    }
    
    trackErrors() {
        window.addEventListener('error', (e) => {
            this.metrics.errors.push({
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                timestamp: Date.now()
            });
        });
    }
    
    sendMetricsToServer() {
        // 每30秒发送一次性能指标
        setInterval(() => {
            if (this.metrics.userInteractions > 0) {
                this.submitMetrics();
            }
        }, 30000);
        
        // 页面卸载时发送最终指标
        window.addEventListener('beforeunload', () => {
            this.submitMetrics();
        });
    }
    
    submitMetrics() {
        const data = {
            ...this.metrics,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        // 使用sendBeacon确保数据能够发送
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/client-metrics/', JSON.stringify(data));
        }
        
        // 重置计数器
        this.metrics.userInteractions = 0;
        this.metrics.ajaxRequestTimes = [];
        this.metrics.errors = [];
    }
}

// 初始化客户端性能监控
new ClientPerformanceMonitor();