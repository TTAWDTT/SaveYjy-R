@echo off
REM Windows批处理脚本 - 快速启动开发服务器

echo ========================================
echo R语言助手 - Django Web应用
echo ========================================

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 激活虚拟环境...
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装/更新依赖包...
pip install -r requirements.txt

REM 检查.env文件
if not exist ".env" (
    echo 创建环境变量文件...
    copy .env.example .env
    echo.
    echo 请编辑 .env 文件并添加您的 DeepSeek API 密钥
    echo.
    pause
)

REM 数据库迁移
echo 执行数据库迁移...
python manage.py makemigrations
python manage.py migrate

REM 创建超级用户（可选）
echo.
set /p create_superuser=是否创建管理员账户? (y/N): 
if /i "%create_superuser%"=="y" (
    python manage.py createsuperuser
)

echo.
echo 启动开发服务器...
echo 请在浏览器中访问: http://127.0.0.1:8000
echo.
python manage.py runserver

pause