# R语言助手 - Django Web应用

这是一个基于Django框架的R语言学习助手，集成了DeepSeek Chat API来提供智能的R语言代码生成和解释服务。

## 功能特点

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
