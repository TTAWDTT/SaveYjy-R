/* ========== 图标管理器 v3.1 - 纯Emoji模式 ========== */

class IconManager {
    constructor() {
        this.isEmojiMode = true; // 始终启用emoji模式
        this.debugMode = false;
        this.init();
    }

    init() {
        console.log('🎯 IconManager v3.1 启动 (纯Emoji模式)');
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        // 直接启用emoji模式
        this.enableEmojiMode();
        console.log('✅ Emoji模式已启用');
    }

    enableEmojiMode() {
        // 确保emoji模式启用
        this.isEmojiMode = true;
        document.body.classList.add('icon-fallback-active');
    }

    // 静态方法供外部调用
    static getInstance() {
        if (!window.iconManagerInstance) {
            window.iconManagerInstance = new IconManager();
        }
        return window.iconManagerInstance;
    }
}

// 自动启动
if (typeof window !== 'undefined') {
    window.IconManager = IconManager;
    
    // 确保只创建一个实例
    if (!window.iconManagerInstance) {
        window.iconManagerInstance = new IconManager();
    }
}

// 导出模块（如果支持）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconManager;
}