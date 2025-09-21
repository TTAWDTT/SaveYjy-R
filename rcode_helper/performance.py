"""
性能监控、缓存管理和错误跟踪系统
与模型集成，提供全方位的系统监控功能
"""

import time
import logging
import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable
from functools import wraps
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from django.db import models
from .models import PerformanceMetrics, UserAnalytics

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """性能监控器"""
    
    @staticmethod
    def measure_time(endpoint: str = ''):
        """测量函数执行时间的装饰器"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                error_msg = None
                
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    raise
                finally:
                    execution_time = time.time() - start_time
                    
                    # 记录性能指标
                    try:
                        PerformanceMetrics.objects.create(
                            operation_type='sync_function',
                            operation_name=func.__name__,
                            execution_time=execution_time,
                            success=success,
                            error_message=error_msg,
                            details={
                                'endpoint': endpoint,
                                'function_name': func.__name__,
                                'args_count': len(args),
                                'kwargs_count': len(kwargs)
                            }
                        )
                    except Exception as metric_error:
                        logger.error(f"Failed to record performance metric: {metric_error}")
            
            return wrapper
        return decorator
    
    @staticmethod
    def measure_async_time(endpoint: str = ''):
        """测量异步函数执行时间的装饰器"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                error_msg = None
                
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    raise
                finally:
                    execution_time = time.time() - start_time
                    
                    # 记录性能指标
                    try:
                        PerformanceMetrics.objects.create(
                            operation_type='async_function',
                            operation_name=func.__name__,
                            execution_time=execution_time,
                            success=success,
                            error_message=error_msg,
                            details={
                                'endpoint': endpoint,
                                'function_name': func.__name__,
                                'args_count': len(args),
                                'kwargs_count': len(kwargs)
                            }
                        )
                    except Exception as metric_error:
                        logger.error(f"Failed to record performance metric: {metric_error}")
            
            return wrapper
        return decorator
    
    @staticmethod
    def get_performance_summary(hours: int = 24) -> Dict[str, Any]:
        """获取性能摘要"""
        start_time = timezone.now() - timedelta(hours=hours)
        
        metrics = PerformanceMetrics.objects.filter(timestamp__gte=start_time)
        
        if not metrics.exists():
            return {
                'total_operations': 0,
                'avg_execution_time': 0,
                'success_rate': 100,
                'error_count': 0
            }
        
        total_ops = metrics.count()
        avg_time = metrics.aggregate(avg_time=models.Avg('execution_time'))['avg_time']
        success_count = metrics.filter(success=True).count()
        error_count = total_ops - success_count
        
        return {
            'total_operations': total_ops,
            'avg_execution_time': round(avg_time, 3) if avg_time else 0,
            'success_rate': round((success_count / total_ops) * 100, 2) if total_ops > 0 else 100,
            'error_count': error_count,
            'period_hours': hours
        }


class CacheManager:
    """缓存管理器"""
    
    DEFAULT_TIMEOUT = 300  # 5分钟
    
    @staticmethod
    def get_cache_key(prefix: str, *args, **kwargs) -> str:
        """生成缓存键"""
        key_data = f"{prefix}:{':'.join(map(str, args))}:{':'.join(f'{k}={v}' for k, v in sorted(kwargs.items()))}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    @staticmethod
    def get_or_set_cache(cache_key: str, fetch_func: Callable, timeout: int = None) -> Any:
        """获取或设置缓存"""
        timeout = timeout or CacheManager.DEFAULT_TIMEOUT
        
        # 尝试从缓存获取
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            logger.debug(f"Cache hit for key: {cache_key}")
            return cached_result
        
        # 缓存未命中，执行函数并缓存结果
        logger.debug(f"Cache miss for key: {cache_key}")
        result = fetch_func()
        cache.set(cache_key, result, timeout)
        
        return result
    
    @staticmethod
    def invalidate_pattern(pattern: str):
        """根据模式失效缓存"""
        try:
            cache.delete_pattern(pattern)
            logger.info(f"Invalidated cache pattern: {pattern}")
        except AttributeError:
            # Redis缓存支持pattern删除，其他缓存可能不支持
            logger.warning(f"Cache backend doesn't support pattern deletion: {pattern}")
    
    @staticmethod
    def track_user_behavior(user, action_type: str, details: Dict[str, Any] = None):
        """跟踪用户行为"""
        try:
            UserAnalytics.objects.create(
                user=user if user.is_authenticated else None,
                action_type=action_type,
                details=details or {}
            )
        except Exception as e:
            logger.error(f"Failed to track user behavior: {e}")
    
    @staticmethod
    def get_user_analytics_summary(user, days: int = 30) -> Dict[str, Any]:
        """获取用户行为分析摘要"""
        start_time = timezone.now() - timedelta(days=days)
        
        analytics = UserAnalytics.objects.filter(
            user=user,
            timestamp__gte=start_time
        )
        
        if not analytics.exists():
            return {
                'total_actions': 0,
                'action_breakdown': {},
                'most_active_day': None
            }
        
        # 行为类型分解
        action_breakdown = {}
        for analytics_record in analytics:
            action_type = analytics_record.action_type
            action_breakdown[action_type] = action_breakdown.get(action_type, 0) + 1
        
        # 最活跃的一天
        daily_activity = analytics.extra({
            'date': "DATE(timestamp)"
        }).values('date').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        most_active_day = daily_activity.first()['date'] if daily_activity else None
        
        return {
            'total_actions': analytics.count(),
            'action_breakdown': action_breakdown,
            'most_active_day': most_active_day,
            'period_days': days
        }


class ErrorTracker:
    """错误跟踪器"""
    
    @staticmethod
    def track_error(operation: str, error: Exception, context: Dict[str, Any] = None):
        """跟踪错误"""
        try:
            error_details = {
                'error_type': type(error).__name__,
                'error_message': str(error),
                'operation': operation,
                'context': context or {},
                'timestamp': timezone.now().isoformat()
            }
            
            logger.error(f"Error tracked: {error_details}")
            
            # 也可以保存到数据库
            PerformanceMetrics.objects.create(
                operation_type='error',
                operation_name=operation,
                execution_time=0,
                success=False,
                error_message=str(error),
                details=error_details
            )
            
        except Exception as tracking_error:
            logger.error(f"Failed to track error: {tracking_error}")
    
    @staticmethod
    def get_error_summary(hours: int = 24) -> Dict[str, Any]:
        """获取错误摘要"""
        start_time = timezone.now() - timedelta(hours=hours)
        
        error_metrics = PerformanceMetrics.objects.filter(
            success=False,
            timestamp__gte=start_time
        )
        
        if not error_metrics.exists():
            return {
                'total_errors': 0,
                'error_types': {},
                'most_common_error': None
            }
        
        # 错误类型统计
        error_types = {}
        for error in error_metrics:
            operation = error.operation_name
            error_types[operation] = error_types.get(operation, 0) + 1
        
        # 最常见的错误
        most_common_error = max(error_types.items(), key=lambda x: x[1])[0] if error_types else None
        
        return {
            'total_errors': error_metrics.count(),
            'error_types': error_types,
            'most_common_error': most_common_error,
            'period_hours': hours
        }


# 全局实例
performance_monitor = PerformanceMonitor()
cache_manager = CacheManager()
error_tracker = ErrorTracker()