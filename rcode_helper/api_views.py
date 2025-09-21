"""
新增的API视图，支持前端增强功能
包括代码质量分析、测试用例生成、优化建议等
"""
import json
import asyncio
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db import models
from .models import PerformanceMetrics, UserAnalytics
from .enhanced_services import EnhancedAIService
from .workflows import WorkflowExecutor
from .security import secure_view, SecurityValidator
import logging

logger = logging.getLogger(__name__)

class APIResponseMixin:
    """API响应混入类，提供标准化的JSON响应格式"""
    
    def json_response(self, data=None, success=True, message="", status=200):
        response_data = {
            'success': success,
            'message': message,
            'timestamp': timezone.now().isoformat(),
            'data': data or {}
        }
        return JsonResponse(response_data, status=status)
    
    def error_response(self, message="操作失败", status=400, error_code=None):
        return self.json_response(
            success=False,
            message=message,
            data={'error_code': error_code} if error_code else {},
            status=status
        )

@method_decorator([csrf_exempt, require_POST], name='dispatch')
class CodeQualityAnalysisView(View, APIResponseMixin):
    """代码质量分析API"""
    
    @secure_view(allowed_methods=['POST'], require_auth=False, rate_limit=20)
    def post(self, request):
        try:
            data = json.loads(request.body)
            code = data.get('code', '').strip()
            
            if not code:
                return self.error_response("请提供要分析的代码")
            
            # 安全验证
            validation_result = SecurityValidator.validate_r_code(code)
            if not validation_result['is_safe']:
                return self.error_response(
                    f"代码安全验证失败: {', '.join(validation_result['issues'])}", 
                    status=400
                )
            
            # 记录用户行为
            if hasattr(request, 'user') and request.user.is_authenticated:
                UserAnalytics.objects.create(
                    user=request.user,
                    action_type='code_quality_analysis',
                    details={'code_length': len(code)}
                )
            
            # 执行质量分析工作流
            workflow_executor = WorkflowExecutor()
            analysis = asyncio.run(workflow_executor.analyze_code_quality(code))
            
            return self.json_response(data={'analysis': analysis})
            
        except json.JSONDecodeError:
            return self.error_response("无效的JSON数据", status=400)
        except Exception as e:
            logger.error(f"Code quality analysis error: {str(e)}")
            return self.error_response("分析过程中发生错误", status=500)

@method_decorator([csrf_exempt, require_POST], name='dispatch')
class TestCaseGenerationView(View, APIResponseMixin):
    """测试用例生成API"""
    
    @secure_view(allowed_methods=['POST'], require_auth=False, rate_limit=10)
    def post(self, request):
        try:
            data = json.loads(request.body)
            code = data.get('code', '').strip()
            
            if not code:
                return self.error_response("请提供要生成测试用例的代码")
            
            # 安全验证
            validation_result = SecurityValidator.validate_r_code(code)
            if not validation_result['is_safe']:
                return self.error_response(
                    f"代码安全验证失败: {', '.join(validation_result['issues'])}", 
                    status=400
                )
            
            # 记录用户行为
            if hasattr(request, 'user') and request.user.is_authenticated:
                UserAnalytics.objects.create(
                    user=request.user,
                    action_type='test_case_generation',
                    details={'code_length': len(code)}
                )
            
            # 生成测试用例
            ai_service = EnhancedAIService()
            test_cases = asyncio.run(ai_service.generate_test_cases(code))
            
            return self.json_response(data={'test_cases': test_cases})
            
        except json.JSONDecodeError:
            return self.error_response("无效的JSON数据", status=400)
        except Exception as e:
            logger.error(f"Test case generation error: {str(e)}")
            return self.error_response("生成测试用例时发生错误", status=500)

@method_decorator([csrf_exempt, require_POST], name='dispatch')
class OptimizationSuggestionsView(View, APIResponseMixin):
    """代码优化建议API"""
    
    @secure_view(allowed_methods=['POST'], require_auth=False, rate_limit=10)
    def post(self, request):
        try:
            data = json.loads(request.body)
            code = data.get('code', '').strip()
            
            if not code:
                return self.error_response("请提供要优化的代码")
            
            # 安全验证
            validation_result = SecurityValidator.validate_r_code(code)
            if not validation_result['is_safe']:
                return self.error_response(
                    f"代码安全验证失败: {', '.join(validation_result['issues'])}", 
                    status=400
                )
            
            # 记录用户行为
            if hasattr(request, 'user') and request.user.is_authenticated:
                UserAnalytics.objects.create(
                    user=request.user,
                    action_type='optimization_suggestions',
                    details={'code_length': len(code)}
                )
            
            # 生成优化建议
            ai_service = EnhancedAIService()
            suggestions = asyncio.run(ai_service.get_optimization_suggestions(code))
            
            return self.json_response(data={'suggestions': suggestions})
            
        except json.JSONDecodeError:
            return self.error_response("无效的JSON数据", status=400)
        except Exception as e:
            logger.error(f"Optimization suggestions error: {str(e)}")
            return self.error_response("生成优化建议时发生错误", status=500)

@method_decorator([csrf_exempt, require_POST], name='dispatch')
class ClientMetricsView(View, APIResponseMixin):
    """客户端性能指标收集API"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # 记录性能指标
            PerformanceMetrics.objects.create(
                operation_type='client_metrics',
                operation_name='page_performance',
                execution_time=data.get('pageLoadTime', 0) / 1000,  # 转换为秒
                success=True,
                details={
                    'user_interactions': data.get('userInteractions', 0),
                    'ajax_request_times': data.get('ajaxRequestTimes', []),
                    'errors': data.get('errors', []),
                    'url': data.get('url', ''),
                    'user_agent': data.get('userAgent', ''),
                    'timestamp': data.get('timestamp', timezone.now().timestamp())
                }
            )
            
            return self.json_response(message="指标收集成功")
            
        except json.JSONDecodeError:
            return self.error_response("无效的JSON数据", status=400)
        except Exception as e:
            logger.error(f"Client metrics collection error: {str(e)}")
            return self.error_response("指标收集失败", status=500)

@method_decorator([csrf_exempt], name='dispatch')
class PerformanceDashboardView(View, APIResponseMixin):
    """性能监控仪表板API"""
    
    def get(self, request):
        try:
            # 获取最近24小时的性能数据
            from datetime import timedelta
            last_24h = timezone.now() - timedelta(hours=24)
            
            # 操作类型统计
            operation_stats = {}
            metrics = PerformanceMetrics.objects.filter(
                timestamp__gte=last_24h
            ).values('operation_type').distinct()
            
            for metric in metrics:
                op_type = metric['operation_type']
                op_metrics = PerformanceMetrics.objects.filter(
                    operation_type=op_type,
                    timestamp__gte=last_24h
                )
                
                operation_stats[op_type] = {
                    'count': op_metrics.count(),
                    'avg_time': op_metrics.aggregate(
                        avg_time=models.Avg('execution_time')
                    )['avg_time'] or 0,
                    'success_rate': op_metrics.filter(success=True).count() / max(op_metrics.count(), 1) * 100
                }
            
            # 用户行为分析
            user_analytics = {}
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_actions = UserAnalytics.objects.filter(
                    user=request.user,
                    timestamp__gte=last_24h
                ).values('action_type').distinct()
                
                for action in user_actions:
                    action_type = action['action_type']
                    action_count = UserAnalytics.objects.filter(
                        user=request.user,
                        action_type=action_type,
                        timestamp__gte=last_24h
                    ).count()
                    
                    user_analytics[action_type] = action_count
            
            # 系统健康状态
            total_requests = PerformanceMetrics.objects.filter(timestamp__gte=last_24h).count()
            successful_requests = PerformanceMetrics.objects.filter(
                timestamp__gte=last_24h, 
                success=True
            ).count()
            
            system_health = {
                'uptime_percentage': (successful_requests / max(total_requests, 1)) * 100,
                'total_requests': total_requests,
                'error_rate': ((total_requests - successful_requests) / max(total_requests, 1)) * 100
            }
            
            return self.json_response(data={
                'operation_stats': operation_stats,
                'user_analytics': user_analytics,
                'system_health': system_health,
                'period': '24h'
            })
            
        except Exception as e:
            logger.error(f"Performance dashboard error: {str(e)}")
            return self.error_response("获取性能数据失败", status=500)

class HealthCheckView(View, APIResponseMixin):
    """系统健康检查API"""
    
    def get(self, request):
        try:
            # 检查数据库连接
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            # 检查AI服务状态
            ai_service = EnhancedAIService()
            ai_status = asyncio.run(ai_service.health_check())
            
            # 检查缓存
            from django.core.cache import cache
            cache.set('health_check', 'ok', 10)
            cache_status = cache.get('health_check') == 'ok'
            
            health_data = {
                'database': True,
                'ai_service': ai_status,
                'cache': cache_status,
                'timestamp': timezone.now().isoformat(),
                'version': '1.0.0'
            }
            
            overall_health = all(health_data.values())
            
            return self.json_response(
                data=health_data,
                success=overall_health,
                message="系统正常" if overall_health else "系统存在问题"
            )
            
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return self.error_response("健康检查失败", status=500)

# 工具函数
def async_view_handler(async_func):
    """异步视图装饰器"""
    def wrapper(request, *args, **kwargs):
        return asyncio.run(async_func(request, *args, **kwargs))
    return wrapper