/**
 * Performance Optimizer
 * 页面性能优化模块：代码分割、懒加载、缓存策略等
 */

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.loadedModules = new Set();
        this.imageCache = new Map();
        this.resourceQueue = [];
        this.isOnline = navigator.onLine;
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupResourcePreloading();
        this.setupImageLazyLoading();
        this.setupCodeSplitting();
        this.setupCacheStrategy();
        this.setupNetworkOptimization();
        this.setupPerformanceMonitoring();
        
        console.log('🚀 性能优化器已初始化');
    }
    
    // ===== 懒加载优化 =====
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver不支持，使用回退方案');
            return;
        }
        
        // 图片懒加载观察器
        this.observers.set('images', new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observers.get('images').unobserve(entry.target);
                    }
                });
            },
            { 
                rootMargin: '50px 0px',
                threshold: 0.1
            }
        ));
        
        // 组件懒加载观察器
        this.observers.set('components', new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadComponent(entry.target);
                        this.observers.get('components').unobserve(entry.target);
                    }
                });
            },
            { 
                rootMargin: '100px 0px',
                threshold: 0.1
            }
        ));
    }
    
    setupImageLazyLoading() {
        // 为所有需要懒加载的图片设置观察
        const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        
        lazyImages.forEach(img => {
            // 设置占位符
            if (!img.src && !img.dataset.src) return;
            
            if (img.dataset.src && !img.src) {
                img.src = this.generatePlaceholder(img.width || 300, img.height || 200);
            }
            
            this.observers.get('images')?.observe(img);
        });
        
        // 动态添加的图片也进行懒加载
        const imageObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const images = node.querySelectorAll?.('img[data-src], img[loading="lazy"]') || 
                                     (node.tagName === 'IMG' ? [node] : []);
                        
                        images.forEach(img => {
                            if (img.dataset.src && !img.src) {
                                img.src = this.generatePlaceholder(img.width || 300, img.height || 200);
                            }
                            this.observers.get('images')?.observe(img);
                        });
                    }
                });
            });
        });
        
        imageObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    generatePlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加加载图标
        ctx.fillStyle = '#ccc';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', width / 2, height / 2);
        
        return canvas.toDataURL('image/png');
    }
    
    async loadImage(img) {
        const src = img.dataset.src || img.src;
        if (!src || this.imageCache.has(src)) return;
        
        try {
            // 显示加载状态
            img.classList.add('loading');
            
            // 预加载图片
            const preloadImg = new Image();
            await new Promise((resolve, reject) => {
                preloadImg.onload = resolve;
                preloadImg.onerror = reject;
                preloadImg.src = src;
            });
            
            // 缓存图片
            this.imageCache.set(src, preloadImg);
            
            // 应用图片
            img.src = src;
            img.classList.remove('loading');
            img.classList.add('loaded');
            
            // 添加淡入效果
            this.fadeIn(img);
            
        } catch (error) {
            console.error('图片加载失败:', src, error);
            img.classList.remove('loading');
            img.classList.add('error');
            
            // 设置错误占位符
            img.src = this.generateErrorPlaceholder();
        }
    }
    
    generateErrorPlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(0, 0, 300, 200);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('加载失败', 150, 100);
        
        return canvas.toDataURL('image/png');
    }
    
    fadeIn(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.3s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }
    
    // ===== 组件懒加载 =====
    setupCodeSplitting() {
        const lazyComponents = document.querySelectorAll('[data-lazy-component]');
        
        lazyComponents.forEach(element => {
            this.observers.get('components')?.observe(element);
        });
    }
    
    async loadComponent(element) {
        const componentName = element.dataset.lazyComponent;
        if (!componentName || this.loadedModules.has(componentName)) return;
        
        try {
            element.innerHTML = '<div class="component-loading">组件加载中...</div>';
            
            // 动态加载组件
            const module = await this.dynamicImport(componentName);
            
            if (module && module.default) {
                const componentInstance = new module.default(element);
                await componentInstance.render();
                
                this.loadedModules.add(componentName);
                element.classList.add('component-loaded');
            }
            
        } catch (error) {
            console.error(`组件加载失败: ${componentName}`, error);
            element.innerHTML = '<div class="component-error">组件加载失败</div>';
        }
    }
    
    async dynamicImport(moduleName) {
        const moduleMap = {
            'chart': () => import('/static/js/components/chart.js'),
            'editor': () => import('/static/js/components/editor.js'),
            'dashboard': () => import('/static/js/components/dashboard.js'),
            'analytics': () => import('/static/js/components/analytics.js')
        };
        
        if (moduleMap[moduleName]) {
            return await moduleMap[moduleName]();
        }
        
        // 通用模块加载
        return await import(`/static/js/components/${moduleName}.js`);
    }
    
    // ===== 资源预加载 =====
    setupResourcePreloading() {
        // 预加载关键资源
        this.preloadCriticalResources();
        
        // 空闲时间预加载
        this.setupIdlePreloading();
        
        // 预测性预加载
        this.setupPredictivePreloading();
    }
    
    preloadCriticalResources() {
        const criticalResources = [
            '/static/css/advanced-code-editor.css',
            '/static/js/advanced-code-editor.js',
            'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs/loader.js'
        ];
        
        criticalResources.forEach(url => {
            this.preloadResource(url);
        });
    }
    
    preloadResource(url, type = 'auto') {
        if (this.loadedModules.has(url)) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        if (type === 'auto') {
            if (url.endsWith('.css')) {
                link.as = 'style';
            } else if (url.endsWith('.js')) {
                link.as = 'script';
            } else {
                link.as = 'fetch';
                link.crossOrigin = 'anonymous';
            }
        } else {
            link.as = type;
        }
        
        document.head.appendChild(link);
        this.loadedModules.add(url);
    }
    
    setupIdlePreloading() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.preloadIdleResources();
            });
        } else {
            setTimeout(() => {
                this.preloadIdleResources();
            }, 2000);
        }
    }
    
    preloadIdleResources() {
        const idleResources = [
            '/static/js/interaction-enhancer.js',
            '/static/css/themes.css',
            '/static/js/analytics.js'
        ];
        
        idleResources.forEach(url => {
            this.queueResourceLoad(url);
        });
        
        this.processResourceQueue();
    }
    
    setupPredictivePreloading() {
        // 监听用户行为，预测需要加载的资源
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('#') && !link.href.startsWith('javascript:')) {
                this.predictivePreload(link.href);
            }
        });
        
        // 监听滚动行为
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.checkScrollPreloading();
            }, 100);
        });
    }
    
    predictivePreload(url) {
        // 避免重复预加载
        if (this.loadedModules.has(url)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        this.loadedModules.add(url);
    }
    
    checkScrollPreloading() {
        const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        if (scrollPercentage > 80) {
            // 用户接近页面底部，预加载下一页内容
            this.preloadNextPageResources();
        }
    }
    
    preloadNextPageResources() {
        const nextPageLinks = document.querySelectorAll('a[rel="next"], .pagination .next');
        nextPageLinks.forEach(link => {
            if (link.href) {
                this.predictivePreload(link.href);
            }
        });
    }
    
    // ===== 缓存策略 =====
    setupCacheStrategy() {
        // Service Worker 缓存
        this.setupServiceWorker();
        
        // 内存缓存
        this.setupMemoryCache();
        
        // LocalStorage 缓存
        this.setupLocalStorageCache();
    }
    
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/static/js/sw.js');
                console.log('Service Worker 注册成功:', registration);
                
                // 监听更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service Worker 注册失败:', error);
            }
        }
    }
    
    setupMemoryCache() {
        this.memoryCache = new Map();
        this.memoryCacheSize = 0;
        this.maxMemoryCacheSize = 50 * 1024 * 1024; // 50MB
    }
    
    cacheInMemory(key, data) {
        const size = this.calculateObjectSize(data);
        
        if (size > this.maxMemoryCacheSize) return false;
        
        // 清理空间
        while (this.memoryCacheSize + size > this.maxMemoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
                const firstData = this.memoryCache.get(firstKey);
                this.memoryCacheSize -= this.calculateObjectSize(firstData);
                this.memoryCache.delete(firstKey);
            } else {
                break;
            }
        }
        
        this.memoryCache.set(key, data);
        this.memoryCacheSize += size;
        return true;
    }
    
    getFromMemoryCache(key) {
        return this.memoryCache.get(key);
    }
    
    calculateObjectSize(obj) {
        return JSON.stringify(obj).length * 2; // 大致估算
    }
    
    setupLocalStorageCache() {
        this.localStoragePrefix = 'rhelper_cache_';
        this.maxLocalStorageAge = 24 * 60 * 60 * 1000; // 24小时
    }
    
    cacheInLocalStorage(key, data, maxAge = this.maxLocalStorageAge) {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                maxAge
            };
            
            localStorage.setItem(this.localStoragePrefix + key, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.warn('LocalStorage 缓存失败:', error);
            return false;
        }
    }
    
    getFromLocalStorageCache(key) {
        try {
            const cached = localStorage.getItem(this.localStoragePrefix + key);
            if (!cached) return null;
            
            const cacheItem = JSON.parse(cached);
            const age = Date.now() - cacheItem.timestamp;
            
            if (age > cacheItem.maxAge) {
                localStorage.removeItem(this.localStoragePrefix + key);
                return null;
            }
            
            return cacheItem.data;
        } catch (error) {
            console.warn('LocalStorage 读取失败:', error);
            return null;
        }
    }
    
    clearExpiredCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.localStoragePrefix)) {
                this.getFromLocalStorageCache(key.replace(this.localStoragePrefix, ''));
            }
        });
    }
    
    // ===== 网络优化 =====
    setupNetworkOptimization() {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineNotification();
        });
        
        // 网络质量检测
        this.detectNetworkQuality();
    }
    
    async detectNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // 根据网络类型调整加载策略
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.enableDataSavingMode();
            }
            
            connection.addEventListener('change', () => {
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    this.enableDataSavingMode();
                } else {
                    this.disableDataSavingMode();
                }
            });
        }
    }
    
    enableDataSavingMode() {
        console.log('启用数据节省模式');
        document.body.classList.add('data-saving-mode');
        
        // 停止自动播放媒体
        const media = document.querySelectorAll('video, audio');
        media.forEach(el => {
            el.pause();
            el.preload = 'none';
        });
        
        // 降低图片质量
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.src = this.generateLowQualityVersion(img.src);
            }
        });
    }
    
    disableDataSavingMode() {
        console.log('禁用数据节省模式');
        document.body.classList.remove('data-saving-mode');
        
        // 恢复原始图片
        const images = document.querySelectorAll('img[data-original-src]');
        images.forEach(img => {
            img.src = img.dataset.originalSrc;
            delete img.dataset.originalSrc;
        });
    }
    
    generateLowQualityVersion(src) {
        // 简单的低质量版本生成（实际中可能需要服务器端支持）
        return src + (src.includes('?') ? '&' : '?') + 'quality=low';
    }
    
    // ===== 性能监控 =====
    setupPerformanceMonitoring() {
        // Web Vitals 监控
        this.monitorWebVitals();
        
        // 资源加载时间监控
        this.monitorResourceLoading();
        
        // 用户交互性能监控
        this.monitorInteractionPerformance();
    }
    
    monitorWebVitals() {
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((entryList) => {
            let clsValue = 0;
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }
    
    monitorResourceLoading() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (entry.duration > 1000) { // 超过1秒的资源
                    console.warn('慢资源:', entry.name, entry.duration + 'ms');
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }
    
    monitorInteractionPerformance() {
        const interactionElements = document.querySelectorAll('button, a, input, textarea');
        
        interactionElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const startTime = performance.now();
                
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    if (duration > 100) { // 超过100ms
                        console.warn('慢交互:', element, duration + 'ms');
                    }
                });
            });
        });
    }
    
    // ===== 队列管理 =====
    queueResourceLoad(url, priority = 0) {
        this.resourceQueue.push({ url, priority });
        this.resourceQueue.sort((a, b) => b.priority - a.priority);
    }
    
    async processResourceQueue() {
        const maxConcurrent = this.isOnline ? 6 : 2;
        const processing = [];
        
        while (this.resourceQueue.length > 0 && processing.length < maxConcurrent) {
            const item = this.resourceQueue.shift();
            const promise = this.loadResource(item.url);
            processing.push(promise);
        }
        
        if (processing.length > 0) {
            await Promise.allSettled(processing);
            
            if (this.resourceQueue.length > 0) {
                setTimeout(() => this.processResourceQueue(), 100);
            }
        }
    }
    
    async loadResource(url) {
        try {
            const response = await fetch(url);
            return response;
        } catch (error) {
            console.error('资源加载失败:', url, error);
            throw error;
        }
    }
    
    // ===== 通知方法 =====
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-download"></i>
                <span>发现新版本，点击更新</span>
                <button onclick="location.reload()">更新</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
    
    showOfflineNotification() {
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.innerHTML = `
            <div class="offline-content">
                <i class="fas fa-wifi"></i>
                <span>网络连接已断开，部分功能可能不可用</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    processOfflineQueue() {
        console.log('网络恢复，处理离线队列');
        // 处理离线期间积累的请求
    }
}

// 样式
const performanceStyles = `
<style>
/* 图片加载状态 */
img.loading {
    filter: blur(2px);
    opacity: 0.7;
}

img.loaded {
    filter: none;
    opacity: 1;
    transition: filter 0.3s ease, opacity 0.3s ease;
}

img.error {
    filter: grayscale(100%);
    opacity: 0.5;
}

/* 组件加载状态 */
.component-loading {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    background: #f8f9fa;
    border-radius: 8px;
    animation: pulse 2s infinite;
}

.component-error {
    text-align: center;
    padding: 2rem;
    color: #dc3545;
    background: #f8d7da;
    border-radius: 8px;
}

.component-loaded {
    animation: fadeIn 0.5s ease;
}

/* 数据节省模式 */
.data-saving-mode .particles {
    display: none;
}

.data-saving-mode .loading-animation {
    animation-duration: 0.01ms !important;
}

/* 更新通知 */
.update-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
}

.update-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.update-content button {
    background: white;
    color: #007bff;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
}

/* 离线通知 */
.offline-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc3545;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    z-index: 9999;
    animation: slideDown 0.3s ease;
}

.offline-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* 动画 */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); }
    to { transform: translateX(-50%) translateY(0); }
}

/* 性能优化类 */
.perf-optimized {
    will-change: transform;
    contain: layout style paint;
}

.perf-heavy-element {
    contain: strict;
}

/* 响应式优化 */
@media (max-width: 768px) {
    .update-notification,
    .offline-notification {
        left: 10px;
        right: 10px;
        transform: none;
    }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
    .component-loading {
        animation: none;
    }
    
    img.loaded {
        transition: none;
    }
    
    .update-notification,
    .offline-notification {
        animation: none;
    }
}
</style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', performanceStyles);

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// 导出
window.PerformanceOptimizer = PerformanceOptimizer;