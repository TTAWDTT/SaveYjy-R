/**
 * Emoji显示修复脚本
 * 检测并修复Emoji显示问题
 */

class EmojiFixManager {
    constructor() {
        this.isFixed = false;
        this.init();
    }

    init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkAndFix());
        } else {
            this.checkAndFix();
        }
        
        // 字体加载完成后再次检查
        if ('fonts' in document) {
            document.fonts.ready.then(() => {
                setTimeout(() => this.checkAndFix(), 100);
            });
        }
    }

    checkAndFix() {
        console.log('🔍 开始检测Emoji显示问题...');
        
        // 检测方法1: Canvas测试
        const canvasSupport = this.testEmojiCanvas();
        console.log('Canvas Emoji支持:', canvasSupport);

        // 检测方法2: DOM测试
        const domSupport = this.testEmojiDOM();
        console.log('DOM Emoji支持:', domSupport);

        // 检测方法3: 字体加载状态检查
        const fontLoadSupport = this.checkFontLoading();
        console.log('字体加载状态:', fontLoadSupport);

        // 如果检测到问题，应用修复
        if (!canvasSupport || !domSupport || !fontLoadSupport) {
            console.log('⚠️ 检测到Emoji显示问题，开始修复...');
            this.applyFixes();
        } else {
            console.log('✅ Emoji显示正常');
        }
    }

    testEmojiCanvas() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 50;
            canvas.height = 50;
            
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = '30px Arial';
            ctx.fillStyle = '#000';
            ctx.fillText('😀', 25, 25);
            
            const imageData = ctx.getImageData(0, 0, 50, 50);
            const pixels = imageData.data;
            
            // 检查是否有非透明像素
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] > 0) return true;
            }
            return false;
        } catch (e) {
            console.warn('Canvas测试失败:', e);
            return false;
        }
    }

    testEmojiDOM() {
        try {
            const testElement = document.createElement('span');
            testElement.innerHTML = '😀';
            testElement.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                font-size: 100px;
                visibility: hidden;
            `;
            document.body.appendChild(testElement);
            
            const width = testElement.offsetWidth;
            const height = testElement.offsetHeight;
            
            document.body.removeChild(testElement);
            
            // 如果宽度和高度合理，说明渲染正常
            return width > 50 && height > 50;
        } catch (e) {
            console.warn('DOM测试失败:', e);
            return false;
        }
    }

    checkFontLoading() {
        try {
            // 检查字体是否已加载
            if (document.fonts) {
                // 检查常用emoji字体是否已加载
                const emojiFonts = ['Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'];
                let loaded = false;
                
                for (const font of emojiFonts) {
                    const fontStatus = document.fonts.check(`16px "${font}"`) || 
                                     document.fonts.check(`16px '${font}'`);
                    if (fontStatus) {
                        loaded = true;
                        break;
                    }
                }
                
                console.log('Emoji字体加载状态:', loaded ? '已加载' : '未加载');
                return loaded;
            }
            return true; // 如果不支持document.fonts，假设支持
        } catch (e) {
            console.warn('字体加载检查失败:', e);
            return true; // 出错时假设支持
        }
    }

    applyFixes() {
        this.fixFontFamily();
        this.fixSpecificElements();
        this.addEmojiClass();
        this.isFixed = true;
        console.log('🔧 Emoji修复已应用');
    }

    fixFontFamily() {
        // 修复body字体
        const style = document.createElement('style');
        style.innerHTML = `
            /* Emoji修复样式 */
            body, html {
                font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'SimHei', system-ui, Roboto, sans-serif !important;
            }
            
            /* 强制Emoji字体 */
            .emoji-fix {
                font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif !important;
                font-variant-emoji: emoji !important;
                text-rendering: optimizeLegibility !important;
            }
            
            /* 针对特定Emoji字符 */
            .emoji-char {
                font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif !important;
                font-variant-emoji: emoji !important;
                display: inline-block !important;
            }
            
            /* 为所有元素设置emoji字体优先级 */
            * {
                font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'SimHei', system-ui, Roboto, sans-serif !important;
            }
        `;
        document.head.appendChild(style);
    }

    fixSpecificElements() {
        // 查找并修复包含Emoji的元素
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        
        this.walkTextNodes(document.body, (textNode) => {
            if (emojiRegex.test(textNode.textContent)) {
                this.wrapEmojis(textNode);
            }
        });
    }

    walkTextNodes(element, callback) {
        if (element.nodeType === Node.TEXT_NODE) {
            callback(element);
        } else {
            for (let child of element.childNodes) {
                this.walkTextNodes(child, callback);
            }
        }
    }

    wrapEmojis(textNode) {
        const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
        
        const text = textNode.textContent;
        if (!emojiRegex.test(text)) return;

        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();
        
        let lastIndex = 0;
        let match;
        
        emojiRegex.lastIndex = 0; // 重置正则表达式
        
        while ((match = emojiRegex.exec(text)) !== null) {
            // 添加Emoji前的文本
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            
            // 创建Emoji span
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji-char';
            emojiSpan.textContent = match[0];
            fragment.appendChild(emojiSpan);
            
            lastIndex = match.index + match[0].length;
        }
        
        // 添加剩余文本
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        
        parent.replaceChild(fragment, textNode);
    }

    addEmojiClass() {
        // 为body添加emoji-fix类
        document.body.classList.add('emoji-fix');
        
        // 为所有可能包含emoji的元素添加类
        const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'button', 'a'];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu.test(el.textContent)) {
                    el.classList.add('emoji-fix');
                }
            });
        });
    }

    // 公共方法：手动触发修复
    forcefix() {
        console.log('🔧 强制应用Emoji修复...');
        this.applyFixes();
    }

    // 公共方法：检查修复状态
    getStatus() {
        return {
            isFixed: this.isFixed,
            canvasSupport: this.testEmojiCanvas(),
            domSupport: this.testEmojiDOM()
        };
    }
}

// 创建全局实例
window.emojiFixManager = new EmojiFixManager();

// 暴露调试方法
window.debugEmoji = () => {
    console.log('🔍 Emoji调试信息:');
    console.log('状态:', window.emojiFixManager.getStatus());
    console.log('用户代理:', navigator.userAgent);
    console.log('平台:', navigator.platform);
    console.log('字符集:', document.characterSet);
    
    // 强制修复
    window.emojiFixManager.forcefix();
};

console.log('🎯 Emoji修复管理器已加载');