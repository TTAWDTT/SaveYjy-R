"""
安全增强模块
提供输入验证、CSRF保护、错误处理改进、用户权限检查等安全措施
"""

import re
import html
import logging
from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.utils.html import strip_tags
from django.utils.encoding import force_str
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from functools import wraps
import hashlib
import time
from .models import PerformanceMetrics

logger = logging.getLogger(__name__)


class SecurityValidator:
    """安全验证器"""
    
    # 危险字符和模式检测
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # XSS脚本
        r'javascript:',                # JavaScript伪协议
        r'on\w+\s*=',                 # 事件处理器
        r'eval\s*\(',                 # eval函数
        r'exec\s*\(',                 # exec函数
        r'import\s+os',               # 危险导入
        r'import\s+subprocess',       # 系统调用
        r'__import__',                # 动态导入
        r'file\s*\(',                 # 文件操作
        r'open\s*\(',                 # 文件打开
        r'\bwhile\s+True\b',          # 无限循环
        r'\bfor\s+\w+\s+in\s+range\s*\(\s*\d{6,}\s*\)',  # 大循环
    ]
    
    # R语言安全模式
    R_DANGEROUS_PATTERNS = [
        r'system\s*\(',              # 系统调用
        r'shell\s*\(',               # Shell调用
        r'source\s*\([^)]*http',     # 远程代码加载
        r'eval\s*\(',                # eval函数
        r'parse\s*\(',               # parse函数
        r'file\.\w+\s*\(',           # 文件操作
        r'download\.file\s*\(',      # 文件下载
        r'install\.packages\s*\(',   # 包安装
        r'library\s*\([^)]*http',    # 远程库加载
    ]
    
    @classmethod
    def validate_r_code(cls, code: str) -> Dict[str, Any]:
        """验证R代码安全性"""
        if not code or not isinstance(code, str):
            return {'is_safe': False, 'issues': ['代码不能为空']}
        
        issues = []
        
        # 长度检查
        if len(code) > 50000:  # 50KB限制
            issues.append('代码长度超过限制（最大50KB）')
        
        # 危险模式检查
        for pattern in cls.R_DANGEROUS_PATTERNS:
            if re.search(pattern, code, re.IGNORECASE):
                issues.append(f'检测到潜在危险操作: {pattern}')
        
        # 编码检查
        try:
            code.encode('utf-8')
        except UnicodeEncodeError:
            issues.append('代码包含无效字符编码')
        
        # 基本语法检查（简单）
        if code.count('(') != code.count(')'):
            issues.append('括号不匹配')
        
        if code.count('{') != code.count('}'):
            issues.append('大括号不匹配')
        
        return {
            'is_safe': len(issues) == 0,
            'issues': issues,
            'code_length': len(code),
            'validation_time': time.time()
        }
    
    @classmethod
    def sanitize_input(cls, input_text: str) -> str:
        """清理输入文本"""
        if not input_text:
            return ""
        
        # 转换为字符串并去除HTML标签
        clean_text = strip_tags(force_str(input_text))
        
        # HTML实体编码
        clean_text = html.escape(clean_text)
        
        # 移除多余空白
        clean_text = re.sub(r'\s+', ' ', clean_text.strip())
        
        return clean_text
    
    @classmethod
    def validate_user_input(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """验证用户输入数据"""
        validation_results = {}
        
        for field, value in data.items():
            if isinstance(value, str):
                # 检查XSS
                for pattern in cls.DANGEROUS_PATTERNS:
                    if re.search(pattern, value, re.IGNORECASE):
                        validation_results[field] = {
                            'is_safe': False,
                            'issue': f'检测到潜在的安全威胁: {pattern}'
                        }
                        break
                else:
                    validation_results[field] = {'is_safe': True}
            else:
                validation_results[field] = {'is_safe': True}
        
        return validation_results


class RateLimiter:
    """速率限制器"""
    
    def __init__(self):
        self.requests = {}  # IP -> [(timestamp, endpoint), ...]
        self.cleanup_interval = 300  # 5分钟清理一次
        self.last_cleanup = time.time()
    
    def is_allowed(self, ip_address: str, endpoint: str, limit: int = 60, window: int = 60) -> bool:
        """检查是否允许请求"""
        current_time = time.time()
        
        # 定期清理旧记录
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_requests(current_time - window)
            self.last_cleanup = current_time
        
        # 获取IP的请求记录
        if ip_address not in self.requests:
            self.requests[ip_address] = []
        
        # 过滤时间窗口内的请求
        recent_requests = [
            (timestamp, ep) for timestamp, ep in self.requests[ip_address]
            if current_time - timestamp <= window and ep == endpoint
        ]
        
        # 检查是否超过限制
        if len(recent_requests) >= limit:
            logger.warning(f"Rate limit exceeded for {ip_address} on {endpoint}")
            return False
        
        # 记录当前请求
        self.requests[ip_address].append((current_time, endpoint))
        return True
    
    def _cleanup_old_requests(self, cutoff_time: float):
        """清理旧的请求记录"""
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                (timestamp, endpoint) for timestamp, endpoint in self.requests[ip]
                if timestamp > cutoff_time
            ]
            if not self.requests[ip]:
                del self.requests[ip]


class SecurityMiddleware:
    """安全中间件"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limiter = RateLimiter()
    
    def __call__(self, request):
        # 速率限制检查
        ip_address = self.get_client_ip(request)
        endpoint = request.path
        
        if not self.rate_limiter.is_allowed(ip_address, endpoint):
            from django.http import JsonResponse
            return JsonResponse({
                'error': '请求过于频繁，请稍后再试',
                'code': 'RATE_LIMIT_EXCEEDED'
            }, status=429)
        
        # 安全头设置
        response = self.get_response(request)
        
        # 添加安全头
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;"
        
        return response
    
    def get_client_ip(self, request):
        """获取客户端IP地址"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


def secure_view(allowed_methods: List[str] = None, require_auth: bool = True, 
                rate_limit: int = 60, validate_input: bool = True):
    """安全视图装饰器"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            start_time = time.time()
            
            try:
                # 方法检查
                if allowed_methods and request.method not in allowed_methods:
                    return JsonResponse({'error': '不允许的HTTP方法'}, status=405)
                
                # 认证检查
                if require_auth and not request.user.is_authenticated:
                    return JsonResponse({'error': '需要登录'}, status=401)
                
                # 输入验证
                if validate_input and request.method in ['POST', 'PUT', 'PATCH']:
                    if hasattr(request, 'body') and request.body:
                        try:
                            import json
                            data = json.loads(request.body)
                            validation_results = SecurityValidator.validate_user_input(data)
                            
                            # 检查是否有安全问题
                            for field, result in validation_results.items():
                                if not result.get('is_safe', True):
                                    logger.warning(f"Security validation failed for field {field}: {result.get('issue')}")
                                    return JsonResponse({
                                        'error': f'输入验证失败: {field}',
                                        'details': result.get('issue')
                                    }, status=400)
                        except json.JSONDecodeError:
                            pass  # 忽略非JSON请求
                
                # 执行原始视图
                response = view_func(request, *args, **kwargs)
                
                # 记录成功访问
                PerformanceMetrics.objects.create(
                    operation_type='secure_view_access',
                    operation_name=view_func.__name__,
                    execution_time=time.time() - start_time,
                    success=True,
                    details={
                        'user_id': request.user.id if request.user.is_authenticated else None,
                        'ip_address': SecurityMiddleware().get_client_ip(request),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'method': request.method,
                        'path': request.path
                    }
                )
                
                return response
                
            except Exception as e:
                # 记录错误访问
                PerformanceMetrics.objects.create(
                    operation_type='secure_view_error',
                    operation_name=view_func.__name__,
                    execution_time=time.time() - start_time,
                    success=False,
                    error_message=str(e),
                    details={
                        'user_id': request.user.id if request.user.is_authenticated else None,
                        'ip_address': SecurityMiddleware().get_client_ip(request),
                        'error_type': type(e).__name__
                    }
                )
                
                logger.error(f"Secure view error in {view_func.__name__}: {str(e)}")
                return JsonResponse({'error': '服务器内部错误'}, status=500)
        
        return wrapper
    return decorator


class InputSanitizer:
    """输入清理器"""
    
    @staticmethod
    def sanitize_r_code(code: str) -> str:
        """清理R代码输入"""
        if not code:
            return ""
        
        # 移除潜在危险的函数调用
        dangerous_functions = [
            'system', 'shell', 'eval', 'parse',
            'download.file', 'install.packages'
        ]
        
        cleaned_code = code
        for func in dangerous_functions:
            pattern = rf'\b{func}\s*\('
            cleaned_code = re.sub(pattern, f'# REMOVED: {func}(', cleaned_code, flags=re.IGNORECASE)
        
        return cleaned_code
    
    @staticmethod
    def validate_file_upload(file) -> Dict[str, Any]:
        """验证文件上传"""
        if not file:
            return {'is_safe': False, 'message': '文件不能为空'}
        
        # 大小检查
        if file.size > 5 * 1024 * 1024:  # 5MB限制
            return {'is_safe': False, 'message': '文件大小超过5MB限制'}
        
        # 扩展名检查
        allowed_extensions = ['.r', '.R', '.txt', '.csv', '.tsv']
        file_ext = '.' + file.name.split('.')[-1].lower()
        
        if file_ext not in allowed_extensions:
            return {'is_safe': False, 'message': f'不支持的文件类型: {file_ext}'}
        
        # 内容检查（简单）
        try:
            content = file.read().decode('utf-8')
            file.seek(0)  # 重置文件指针
            
            # 验证内容
            validation_result = SecurityValidator.validate_r_code(content)
            if not validation_result['is_safe']:
                return {
                    'is_safe': False, 
                    'message': '文件内容包含安全风险',
                    'issues': validation_result['issues']
                }
            
        except UnicodeDecodeError:
            return {'is_safe': False, 'message': '文件编码不正确，请使用UTF-8编码'}
        
        return {'is_safe': True, 'message': '文件验证通过'}


# 全局实例
security_validator = SecurityValidator()
rate_limiter = RateLimiter()
input_sanitizer = InputSanitizer()