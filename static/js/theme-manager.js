/**
 * 主题管理器 - 增强版主题切换系统
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'classic';
        this.themes = {
            classic: { name: '经典粉色', icon: '🌸' },
            sakura: { name: '浅樱花粉', icon: '🌺' },
            rose: { name: '玫瑰红', icon: '🌹' },
            coral: { name: '珊瑚粉', icon: '🐚' },
            lavender_original: { name: '薰衣草原版', icon: '💜' },
            warm: { name: '暖粉调', icon: '🔥' },
            dark: { name: '深色专业', icon: '🌙' },
            forest: { name: '森林绿', icon: '🌲' },
            ocean: { name: '海洋蓝', icon: '🌊' },
            sunset: { name: '日落橙', icon: '🌅' },
            lavender: { name: '薰衣草紫', icon: '💜' },
            'rose-gold': { name: '玫瑰金', icon: '✨' }
        };
        
        this.init();
    }
    
    init() {
        this.loadSavedTheme();
        this.createThemeSelector();
        this.bindEvents();
    }
    
    loadSavedTheme() {
        const saved = localStorage.getItem('preferred-theme');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
            this.applyTheme(saved);
        }
    }
    
    createThemeSelector() {
        // 先尝试挂载到导航栏
        const navbarTarget = document.getElementById('navbar-theme-selector');
        const target = navbarTarget || document.body;
        
        const selector = document.createElement('div');
        selector.className = navbarTarget ? 'navbar-theme-selector' : 'enhanced-theme-selector';
        selector.innerHTML = `
            <button class="theme-toggle-btn nav-link" id="theme-toggle" title="切换主题" style="background: none; border: none; color: rgba(255,255,255,0.9); padding: 0.5rem 0.75rem;">
                <span class="theme-icon">🎨</span>
            </button>
            <div class="theme-dropdown" id="theme-dropdown">
                <div class="theme-dropdown-header">
                    <h6>选择主题</h6>
                    <button class="close-btn" id="close-theme-dropdown">×</button>
                </div>
                <div class="theme-grid">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <button class="theme-option ${key === this.currentTheme ? 'active' : ''}" 
                                data-theme="${key}" 
                                title="${theme.name}">
                            <div class="theme-preview theme-${key}"></div>
                            <span class="theme-emoji">${theme.icon}</span>
                            <span class="theme-name">${theme.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="theme-actions">
                    <button class="random-theme-btn" id="random-theme">
                        🎲 随机主题
                    </button>
                    <button class="reset-theme-btn" id="reset-theme">
                        🔄 重置默认
                    </button>
                    <button class="toggle-icons-btn" id="toggle-icons" title="切换图标模式">
                        🔧 图标模式
                    </button>
                </div>
            </div>
        `;
        
        target.appendChild(selector);
        
        // 添加样式
        this.addThemeSelectorStyles(!!navbarTarget);
    }
    
    addThemeSelectorStyles(isNavbar = false) {
        const style = document.createElement('style');
        style.textContent = `
            /* 基础主题选择器样式 */
            .enhanced-theme-selector {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
            }
            
            /* 导航栏中的主题选择器 */
            .navbar-theme-selector {
                position: relative;
                z-index: 1050;
            }
            
            .navbar-theme-selector .theme-toggle-btn {
                background: none !important;
                border: none !important;
                color: rgba(255,255,255,0.9) !important;
                padding: 0.5rem 0.75rem !important;
                border-radius: 0.375rem !important;
                transition: all 0.3s ease !important;
                font-size: 16px !important;
                width: auto !important;
                height: auto !important;
            }
            
            .navbar-theme-selector .theme-toggle-btn:hover {
                background: rgba(255,255,255,0.1) !important;
                color: white !important;
                transform: none !important;
                box-shadow: none !important;
            }
            
            .theme-toggle-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .theme-toggle-btn:hover {
                transform: scale(1.1) rotate(180deg);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .theme-dropdown {
                position: absolute;
                top: ${isNavbar ? '100%' : '60px'};
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 15px;
                padding: 20px;
                min-width: 300px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                transform: translateY(-10px);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .theme-dropdown.show {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            
            .theme-dropdown-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .theme-dropdown-header h6 {
                margin: 0;
                color: #333;
                font-weight: 600;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .theme-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .theme-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 8px;
                border: 2px solid transparent;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .theme-option:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                border-color: rgba(102, 126, 234, 0.3);
            }
            
            .theme-option.active {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.1);
            }
            
            .theme-preview {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                margin-bottom: 5px;
                border: 2px solid rgba(255, 255, 255, 0.8);
            }
            
            .theme-preview.theme-classic { background: linear-gradient(45deg, #ff69b4, #ff1493); }
            .theme-preview.theme-sakura { background: linear-gradient(45deg, #ffb6c1, #ffc0cb); }
            .theme-preview.theme-rose { background: linear-gradient(45deg, #dc143c, #b22222); }
            .theme-preview.theme-coral { background: linear-gradient(45deg, #ff7f50, #ff6347); }
            .theme-preview.theme-lavender_original { background: linear-gradient(45deg, #e6e6fa, #dda0dd); }
            .theme-preview.theme-warm { background: linear-gradient(45deg, #ff8c94, #ffaaa5); }
            .theme-preview.theme-dark { background: linear-gradient(45deg, #1e293b, #334155); }
            .theme-preview.theme-forest { background: linear-gradient(45deg, #10b981, #059669); }
            .theme-preview.theme-ocean { background: linear-gradient(45deg, #0ea5e9, #0284c7); }
            .theme-preview.theme-sunset { background: linear-gradient(45deg, #f97316, #ea580c); }
            .theme-preview.theme-lavender { background: linear-gradient(45deg, #a855f7, #9333ea); }
            .theme-preview.theme-rose-gold { background: linear-gradient(45deg, #f43f5e, #e11d48); }
            
            .theme-emoji {
                font-size: 16px;
                margin-bottom: 3px;
            }
            
            .theme-name {
                font-size: 11px;
                color: #666;
                text-align: center;
                font-weight: 500;
            }
            
            .theme-actions {
                display: flex;
                gap: 10px;
            }
            
            .random-theme-btn,
            .reset-theme-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .random-theme-btn {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
            }
            
            .reset-theme-btn {
                background: rgba(102, 126, 234, 0.1);
                color: #667eea;
            }
            
            .random-theme-btn:hover,
            .reset-theme-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            }
            
            @media (max-width: 768px) {
                .enhanced-theme-selector {
                    top: 15px;
                    right: 15px;
                }
                
                .theme-toggle-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
                
                .theme-dropdown {
                    min-width: 280px;
                    padding: 15px;
                }
                
                .theme-grid {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                
                .theme-option {
                    padding: 8px 4px;
                }
                
                .theme-preview {
                    width: 25px;
                    height: 25px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        const toggleBtn = document.getElementById('theme-toggle');
        const dropdown = document.getElementById('theme-dropdown');
        const closeBtn = document.getElementById('close-theme-dropdown');
        const randomBtn = document.getElementById('random-theme');
        const resetBtn = document.getElementById('reset-theme');
        
        toggleBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        closeBtn.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!toggleBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // 主题选择
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                dropdown.classList.remove('show');
            }
        });
        
        // 随机主题
        randomBtn.addEventListener('click', () => {
            const themes = Object.keys(this.themes);
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            this.setTheme(randomTheme);
            dropdown.classList.remove('show');
        });
        
        // 重置主题
        resetBtn.addEventListener('click', () => {
            this.setTheme('classic');
            dropdown.classList.remove('show');
        });
        
        // 切换图标模式
        const toggleIconsBtn = document.getElementById('toggle-icons');
        toggleIconsBtn.addEventListener('click', () => {
            if (window.iconManager) {
                window.iconManager.toggleIconMode();
                dropdown.classList.remove('show');
                this.showThemeNotification('图标模式已切换');
            } else {
                this.showThemeNotification('图标管理器未加载');
            }
        });
    }
    
    setTheme(themeName) {
        if (!this.themes[themeName]) return;
        
        this.currentTheme = themeName;
        this.applyTheme(themeName);
        this.updateActiveButton(themeName);
        localStorage.setItem('preferred-theme', themeName);
        
        // 显示主题切换通知
        this.showThemeNotification(this.themes[themeName].name);
    }
    
    applyTheme(themeName) {
        console.log('应用主题:', themeName);
        
        // 移除所有主题类
        const allThemeClasses = Object.keys(this.themes).map(t => `theme-${t}`);
        console.log('移除的主题类:', allThemeClasses);
        document.body.classList.remove(...allThemeClasses);
        
        // 应用新主题类
        const newThemeClass = `theme-${themeName}`;
        console.log('添加的主题类:', newThemeClass);
        document.body.classList.add(newThemeClass);
        
        // 强制重新计算样式
        document.body.offsetHeight;
        
        // 触发主题变更事件
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, themeData: this.themes[themeName] }
        }));
        
        console.log('当前body类名:', document.body.className);
    }
    
    updateActiveButton(themeName) {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeName);
        });
    }
    
    showThemeNotification(themeName) {
        // 移除现有通知
        const existing = document.querySelector('.theme-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎨</span>
                <span class="notification-text">已切换到 ${themeName} 主题</span>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .theme-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(102, 126, 234, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10001;
                animation: slideInNotification 0.3s ease;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            @keyframes slideInNotification {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                .theme-notification {
                    top: 70px;
                    right: 15px;
                    font-size: 12px;
                    padding: 10px 16px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInNotification 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 2000);
    }
}

// 初始化主题管理器
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// 导出给其他脚本使用
window.ThemeManager = ThemeManager;