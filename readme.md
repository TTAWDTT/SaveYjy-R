# R语言智能助手

一个基于Django和DeepSeek AI的高级R语言学习平台，提供智能代码生成、详细解释和友好聊天功能。

## ✨ 主要功能

### 🎯 三大核心功能

1. **Answer (代码生成)** 📝
   - 输入R语言作业题目
   - AI生成三种不同的解决方案
   - 每个方案包含详细的中文注释
   - 自动命名程序文件

2. **Explain (代码解释)** 💡
   - 粘贴您的R语言代码
   - AI用平易近人的语气解释代码功能
   - 逐步分析代码逻辑和意义
   - 通俗易懂的表达方式

3. **Talk (智能对话)** 💬
   - 与R语言专家进行友好交流
   - 获取学习建议和编程技巧
   - 讨论R语言相关问题
   - 专业指导和支持

## 🎨 界面特色

### 现代化设计
- ✨ **磨砂玻璃效果** - 高级视觉体验
- 🌟 **动态粒子背景** - 炫酷交互效果
- 🎭 **渐变色主题** - 优雅配色方案
- 📱 **响应式布局** - 完美适配各种设备

### 交互体验
- 🎯 **悬浮动画** - 流畅的卡片交互
- 💫 **图标发光** - 精美的视觉反馈
- 🌈 **脉冲效果** - 吸引用户注意
- ⚡ **平滑过渡** - 自然的动画效果

## 🛠️ 技术架构

### 后端技术
- **Django 5.0.14** - 强大的Web框架
- **DeepSeek Chat API** - 先进的AI语言模型
- **SQLite** - 轻量级数据库
- **模块化设计** - 易于维护和扩展

### 前端技术
- **Bootstrap 5** - 现代化UI框架
- **Font Awesome** - 丰富的图标库
- **Prism.js** - 代码语法高亮
- **CSS3动画** - 高级视觉效果

### 代码特色
- 📦 **PromptManager** - 集中化提示词管理
- 🔧 **模块化架构** - 清晰的代码结构
- 🎯 **服务层抽象** - 易于测试和维护
- 📊 **完整日志记录** - 便于调试和分析

## 🚀 快速开始

### 环境要求
```bash
Python 3.8+
Django 5.0.14
requests
python-dotenv
```

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd SaveYjy-R
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
创建 `.env` 文件：
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEBUG=True
SECRET_KEY=your_secret_key_here
```

4. **初始化数据库**
```bash
python manage.py migrate
```

5. **启动服务**
```bash
python manage.py runserver
```

6. **访问应用**
打开浏览器访问：`http://127.0.0.1:8000/`

## 📁 项目结构

```
SaveYjy-R/
├── r_assistant/           # 主项目配置
│   ├── settings.py       # Django配置
│   ├── urls.py          # 主URL路由
│   └── wsgi.py          # WSGI配置
├── rcode_helper/         # 主应用
│   ├── models.py        # 数据模型
│   ├── views.py         # 视图逻辑
│   ├── forms.py         # 表单定义
│   ├── services.py      # AI服务层
│   ├── prompts.py       # 提示词管理
│   └── urls.py          # 应用URL路由
├── templates/           # HTML模板
│   └── rcode_helper/    # 应用模板
├── static/             # 静态资源
│   └── css/           # 样式文件
└── manage.py          # Django管理脚本
```

## 🎯 核心模块

### PromptManager (提示词管理)
```python
class PromptManager:
    """集中管理所有AI提示词"""
    
    @staticmethod
    def get_homework_prompt(question):
        """获取作业题解答提示词"""
        
    @staticmethod
    def get_explanation_prompt(code):
        """获取代码解释提示词"""
        
    @staticmethod
    def get_chat_prompt(message):
        """获取聊天对话提示词"""
```

### DeepSeekService (AI服务)
```python
class DeepSeekService:
    """DeepSeek AI集成服务"""
    
    def generate_homework_solutions(self, question):
        """生成作业题解决方案"""
        
    def explain_r_code(self, code):
        """解释R语言代码"""
        
    def chat_with_user(self, message):
        """与用户对话"""
```

## 🔧 配置说明

### DeepSeek API配置
在 `settings.py` 中配置：
```python
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
```

### 提示词自定义
在 `prompts.py` 中修改提示词：
```python
# 作业题解答配置
HOMEWORK_CONFIG = {
    'temperature': 0.7,
    'max_tokens': 3000,
    'solutions_count': 3
}

# 代码解释配置  
EXPLANATION_CONFIG = {
    'temperature': 0.8,
    'max_tokens': 2000,
    'style': 'friendly'
}

# 聊天对话配置
CHAT_CONFIG = {
    'temperature': 0.9,
    'max_tokens': 1500,
    'personality': 'helpful_expert'
}
```

## 📊 数据模型

### RequestLog (请求日志)
```python
class RequestLog(models.Model):
    REQUEST_TYPES = [
        ('homework', '作业题解答'),
        ('explanation', '代码解释'),
        ('chat', '普通聊天'),
    ]
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    user_input = models.TextField()
    ai_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### CodeSolution (代码解决方案)
```python
class CodeSolution(models.Model):
    request_log = models.ForeignKey(RequestLog, on_delete=models.CASCADE)
    solution_number = models.IntegerField()
    program_name = models.CharField(max_length=100)
    r_code = models.TextField()
    explanation = models.TextField()
```

## 🎨 样式特色

### 高级CSS效果
- **磨砂玻璃** - `backdrop-filter: blur(20px)`
- **动态渐变** - `conic-gradient` 旋转效果
- **悬浮阴影** - 多层阴影叠加
- **平滑动画** - `cubic-bezier` 缓动函数

### 响应式设计
- 移动端优化
- 平板适配
- 桌面端增强
- 触摸友好

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 📞 支持与反馈

如有问题或建议，请通过GitHub Issues提交反馈。

---

<div align="center">
  <p>🌟 如果这个项目对您有帮助，请给它一个星标！</p>
  <p>Made with ❤️ for R Language Learners</p>
</div>

1. **R语言作业题解答**：用户输入R语言作业题，系统会用三种不同的方法生成R语言代码解决方案
2. **R语言代码解释**：用户输入R语言代码，系统会用平易近人的语气解释代码的作用和意义

## 安装和运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 设置环境变量：
在项目根目录创建 `.env` 文件，添加你的DeepSeek API密钥：
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

3. 运行数据库迁移：
```bash
python manage.py makemigrations
python manage.py migrate
```

4. 启动开发服务器：
```bash
python manage.py runserver
```

5. 在浏览器中访问 `http://127.0.0.1:8000`

## 使用说明

### R语言作业题解答
1. 在首页选择"作业题解答"功能
2. 输入你的R语言作业题描述
3. 点击"生成代码"按钮
4. 系统会提供三种不同的解决方案，每个方案都包含详细的中文注释

### R语言代码解释
1. 在首页选择"代码解释"功能  
2. 粘贴你需要解释的R语言代码
3. 点击"解释代码"按钮
4. 系统会用通俗易懂的语言解释代码的功能和意义

## 技术栈

- **后端**：Django 4.2
- **AI集成**：DeepSeek Chat API
- **数据库**：SQLite (可扩展到PostgreSQL/MySQL)
- **前端**：HTML5 + CSS3 + JavaScript
- **部署**：支持Docker部署

## 项目结构

```
SaveYjy-R/
├── manage.py
├── requirements.txt
├── r_assistant/          # Django主项目配置
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── rcode_helper/         # 主应用
│   ├── models.py        # 数据模型
│   ├── views.py         # 视图逻辑
│   ├── urls.py          # URL配置
│   ├── forms.py         # 表单
│   └── services.py      # DeepSeek API服务
├── templates/           # HTML模板
└── static/             # 静态文件
    ├── css/
    ├── js/
    └── images/
```
