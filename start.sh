#!/bin/bash
# Linux/Mac启动脚本

echo "========================================"
echo "R语言助手 - Django Web应用"
echo "========================================"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装/更新依赖包..."
pip install -r requirements.txt

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "创建环境变量文件..."
    cp .env.example .env
    echo ""
    echo "请编辑 .env 文件并添加您的 DeepSeek API 密钥"
    echo ""
    read -p "按任意键继续..."
fi

# 数据库迁移
echo "执行数据库迁移..."
python manage.py makemigrations
python manage.py migrate

# 创建超级用户（可选）
echo ""
read -p "是否创建管理员账户? (y/N): " create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

echo ""
echo "启动开发服务器..."
echo "请在浏览器中访问: http://127.0.0.1:8000"
echo ""
python manage.py runserver