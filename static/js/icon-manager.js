/**
 * 图标管理器 v2.0 - 增强的图标显示解决方案
 */
class IconManager {
    constructor() {
        this.iconMap = {
            // Font Awesome 到 Emoji 的映射
            'fa-lightbulb': '💡',
            'fa-question-circle': '❓',
            'fa-highlighter': '📍',
            'fa-highlight': '📍',
            'fa-file-code': '📄',
            'fa-code': '💻',
            'fa-brain': '🧠',
            'fa-print': '🖨️',
            'fa-copy': '📋',
            'fa-clock': '🕐',
            'fa-home': '🏠',
            'fa-history': '📋',
            'fa-chart-line': '📈',
            'fa-tachometer-alt': '📊',
            'fa-vial': '🧪',
            'fa-heart': '❤️',
            'fa-check-circle': '✅',
            'fa-magic': '✨',
            'fa-comments': '💬',
            'fa-clipboard-list': '📋',
            'fa-wifi': '📶',
            'fa-palette': '🎨',
            'fa-icons': '🔧',
            'fa-swatchbook': '🎨',
            'fa-info-circle': 'ℹ️'
        };
        
        this.isEmojiModeActive = false;
        this.init();
    }
    
    init() {
        // 延迟检查，确保页面完全加载
        setTimeout(() => {
            this.checkFontAwesome();
            this.setupFallbacks();
            this.observeNewIcons();
        }, 500);
    }
    
    checkFontAwesome() {
        // 方法1: 创建测试元素检查Font Awesome是否工作
        const testElement = document.createElement('i');
        testElement.className = 'fas fa-home';
        testElement.style.cssText = 'opacity: 0; position: absolute; pointer-events: none;';
        document.body.appendChild(testElement);
        
        // 方法2: 检查FontAwesome CSS是否加载
        let fontAwesomeLoaded = false;
        const links = document.querySelectorAll('link[href*="font-awesome"]');
        if (links.length > 0) {
            links.forEach(link => {
                if (link.sheet && link.sheet.cssRules) {
                    fontAwesomeLoaded = true;
                }
            });
        }
        
        console.log('检测到Font Awesome链接数量:', links.length);
        console.log('CSS规则加载状态:', fontAwesomeLoaded);
        
        // 短暂延迟以确保样式加载
        setTimeout(() => {
            const computed = window.getComputedStyle(testElement, ':before');
            const content = computed.getPropertyValue('content');
            
            // 检查是否有有效的内容
            const hasFontAwesome = content && content !== 'none' && content !== '""' && content !== '' && content !== 'normal';
            
            console.log('Font Awesome检测:', hasFontAwesome ? '已加载' : '未加载');
            console.log('检测到的content值:', content);
            console.log('computed样式:', computed.fontFamily);
            
            // 更严格的检测：如果没有明确的图标内容或字体族不包含FontAwesome，启用emoji
            if (!hasFontAwesome || !fontAwesomeLoaded) {
                console.log('启用Emoji备用方案...');
                this.enableEmojiIcons();
            } else {
                console.log('Font Awesome正常，但仍然设置备用方案...');
                // 即使Font Awesome正常，也设置备用映射，以防后续加载失败
                this.setupFallbacks();
            }
            
            document.body.removeChild(testElement);
        }, 100);
    }
    
    enableEmojiIcons() {
        console.log('启用Emoji图标备用方案');
        this.isEmojiModeActive = true;
        
        // 添加标识类到body - 这将激活CSS规则
        document.body.classList.add('icon-fallback-active');
        console.log('已添加icon-fallback-active类到body');
        
        // 强制重新计算所有图标样式
        this.updateAllIcons();
        
        // 显示通知
        this.showIconNotification();
        
        // 强制页面重新渲染
        setTimeout(() => {
            document.body.offsetHeight; // 触发重排
            console.log('Body类名:', document.body.className);
            
            // 验证CSS规则是否生效
            const testIcon = document.querySelector('i.fas, i.fa');
            if (testIcon) {
                const computedAfter = window.getComputedStyle(testIcon, ':after');
                console.log('测试图标::after content:', computedAfter.content);
            }
        }, 100);
    }
    
    updateAllIcons() {
        const icons = document.querySelectorAll('i.fas, i.fa, i.far, i.fab');
        console.log('找到图标数量:', icons.length);
        
        icons.forEach(icon => {
            this.setupIconFallback(icon);
        });
    }
    
    setupIconFallback(icon) {
        // 检查图标类名并设置备用emoji
        for (const [faClass, emoji] of Object.entries(this.iconMap)) {
            if (icon.classList.contains(faClass)) {
                // 方法1: 设置aria-hidden属性
                if (!icon.getAttribute('aria-hidden') || icon.getAttribute('aria-hidden') === 'true') {
                    icon.setAttribute('aria-hidden', emoji);
                }
                
                // 方法2: 如果处于emoji模式且没有内容，直接设置文本内容
                if (this.isEmojiModeActive) {
                    const hasContent = window.getComputedStyle(icon, ':before').content !== 'none';
                    if (!hasContent || icon.textContent.trim() === '') {
                        icon.textContent = emoji;
                        icon.style.fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
                        icon.style.fontStyle = 'normal';
                        icon.style.fontWeight = 'normal';
                    }
                }
                break;
            }
        }
    }
    
    observeNewIcons() {
        // 观察新添加的图标元素
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查新添加的图标元素
                        const icons = node.querySelectorAll ? 
                            node.querySelectorAll('i.fas, i.fa, i.far, i.fab') : [];
                        
                        icons.forEach(icon => this.setupIconFallback(icon));
                        
                        // 如果节点本身是图标
                        if (node.matches && node.matches('i.fas, i.fa, i.far, i.fab')) {
                            this.setupIconFallback(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    showIconNotification() {
        // 显示图标备用模式通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(255, 193, 7, 0.95);
            color: #333;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10001;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
            animation: slideInFromRight 0.3s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔧</span>
                <span>图标已切换到Emoji模式</span>
            </div>
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // 5秒后移除通知
        setTimeout(() => {
            notification.style.animation = 'slideInFromRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                style.remove();
            }, 300);
        }, 5000);
    }
    
    // 手动添加图标映射
    addIconMapping(faClass, emoji) {
        this.iconMap[faClass] = emoji;
        
        // 更新现有图标
        const icons = document.querySelectorAll(`i.${faClass}`);
        icons.forEach(icon => this.setupIconFallback(icon));
    }
    
    // 强制刷新所有图标
    refreshIcons() {
        this.updateAllIcons();
    }
    
    // 切换图标模式（用于测试）
    toggleIconMode() {
        if (this.isEmojiModeActive) {
            document.body.classList.remove('icon-fallback-active');
            this.isEmojiModeActive = false;
            // 清除emoji文本内容
            const icons = document.querySelectorAll('i.fas, i.fa, i.far, i.fab');
            icons.forEach(icon => {
                if (icon.textContent.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
                    icon.textContent = '';
                    icon.style.fontFamily = '';
                }
            });
        } else {
            this.enableEmojiIcons();
        }
    }
}

// 创建全局图标管理器实例
window.iconManager = new IconManager();

// 当页面加载完成后再次检查
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.iconManager) {
            window.iconManager.refreshIcons();
        }
    }, 1000);
});

// 当Font Awesome样式表加载完成后检查
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.iconManager) {
            window.iconManager.checkFontAwesome();
        }
    }, 500);
});

// 导出给其他脚本使用
window.IconManager = IconManager;

// 创建全局图标管理器实例
window.iconManager = new IconManager();

// 当页面加载完成后再次检查
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.iconManager.refreshIcons();
    }, 1000);
});

// 导出给其他脚本使用
window.IconManager = IconManager;