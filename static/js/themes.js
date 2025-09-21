/* ========== 主题切换系统 ========== */

class ThemeManager {
    constructor() {
        this.themes = [
            { name: 'classic', label: '经典粉色', class: 'theme-classic' },
            { name: 'sakura', label: '樱花粉', class: 'theme-sakura' },
            { name: 'rose', label: '玫瑰粉', class: 'theme-rose' },
            { name: 'purple-pink', label: '紫粉渐变', class: 'theme-purple-pink' },
            { name: 'coral', label: '珊瑚粉', class: 'theme-coral' },
            { name: 'rose-gold', label: '玫瑰金', class: 'theme-rose-gold' }
        ];
        
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.createThemeSelector();
        this.applyTheme(this.currentTheme);
        this.addEventListeners();
    }

    createThemeSelector() {
        // 检查是否已存在主题选择器
        if (document.querySelector('.theme-selector')) {
            return;
        }

        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <div class="d-flex flex-wrap justify-content-center" style="max-width: 200px;">
                ${this.themes.map(theme => `
                    <div class="theme-button ${theme.name}-btn" 
                         data-theme="${theme.name}" 
                         title="${theme.label}"
                         style="background: ${this.getThemePreview(theme.name)};">
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(selector);
    }

    getThemePreview(themeName) {
        const previews = {
            'classic': 'linear-gradient(45deg, #ff69b4, #ff1493)',
            'sakura': 'linear-gradient(45deg, #ffb7c5, #ffa0b3)',
            'rose': 'linear-gradient(45deg, #dc143c, #b91c3c)',
            'purple-pink': 'linear-gradient(45deg, #d946ef, #c026d3)',
            'coral': 'linear-gradient(45deg, #ff6b9d, #ff5722)',
            'rose-gold': 'linear-gradient(45deg, #e91e63, #ad1457)'
        };
        return previews[themeName] || previews['classic'];
    }

    addEventListeners() {
        document.querySelectorAll('.theme-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeName = e.target.dataset.theme;
                this.switchTheme(themeName);
            });
        });
    }

    switchTheme(themeName) {
        if (this.currentTheme === themeName) return;
        
        // 添加切换动画
        document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // 移除当前主题
        this.removeCurrentTheme();
        
        // 应用新主题
        this.applyTheme(themeName);
        
        // 保存主题偏好
        this.saveTheme(themeName);
        
        // 更新当前主题
        this.currentTheme = themeName;
        
        // 更新按钮状态
        this.updateButtonStates();
        
        // 显示主题切换提示
        this.showThemeNotification(themeName);
        
        // 移除过渡效果
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }

    applyTheme(themeName) {
        const theme = this.themes.find(t => t.name === themeName);
        if (theme) {
            document.body.classList.add(theme.class);
            document.body.classList.add('theme-transition');
        }
    }

    removeCurrentTheme() {
        this.themes.forEach(theme => {
            document.body.classList.remove(theme.class);
        });
    }

    updateButtonStates() {
        document.querySelectorAll('.theme-button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.theme === this.currentTheme) {
                button.classList.add('active');
            }
        });
    }

    showThemeNotification(themeName) {
        const theme = this.themes.find(t => t.name === themeName);
        if (!theme) return;

        // 移除已存在的通知
        const existingNotification = document.querySelector('.theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed" 
                 style="top: 20px; left: 50%; transform: translateX(-50%); z-index: 1050; min-width: 200px;">
                <i class="fas fa-palette me-2"></i>
                已切换到: ${theme.label}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            const alert = notification.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }

    saveTheme(themeName) {
        localStorage.setItem('preferred-theme', themeName);
    }

    loadTheme() {
        return localStorage.getItem('preferred-theme') || 'classic';
    }
}

// 主题相关的工具函数
const ThemeUtils = {
    // 获取当前主题的CSS变量值
    getCSSVariable(variableName) {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    },
    
    // 动态设置CSS变量
    setCSSVariable(variableName, value) {
        document.documentElement.style.setProperty(variableName, value);
    },
    
    // 获取当前主题名称
    getCurrentTheme() {
        return window.themeManager ? window.themeManager.currentTheme : 'classic';
    },
    
    // 检查是否为深色主题
    isDarkTheme() {
        const currentTheme = this.getCurrentTheme();
        return ['rose', 'purple-pink', 'rose-gold'].includes(currentTheme);
    }
};

// 初始化主题管理器
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
    
    // 为动态加载的内容应用主题
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // 为新添加的元素应用当前主题
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 如果是卡片或按钮等元素，确保应用了正确的主题样式
                        if (node.classList && (node.classList.contains('card') || node.classList.contains('btn'))) {
                            node.style.transition = 'all 0.3s ease';
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// 导出到全局作用域
window.ThemeManager = ThemeManager;
window.ThemeUtils = ThemeUtils;