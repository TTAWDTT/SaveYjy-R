from django.db import models
from django.utils import timezone


class RequestLog(models.Model):
    """用户请求记录模型"""
    REQUEST_TYPES = [
        ('homework', '作业题解答'),
        ('explanation', '代码解释'),
    ]
    
    request_type = models.CharField(
        max_length=20, 
        choices=REQUEST_TYPES,
        verbose_name='请求类型'
    )
    user_input = models.TextField(verbose_name='用户输入')
    ai_response = models.TextField(verbose_name='AI回应', blank=True)
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    ip_address = models.GenericIPAddressField(verbose_name='IP地址', null=True, blank=True)
    
    class Meta:
        verbose_name = '请求记录'
        verbose_name_plural = '请求记录'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class CodeSolution(models.Model):
    """R语言代码解决方案模型"""
    request_log = models.ForeignKey(
        RequestLog, 
        on_delete=models.CASCADE, 
        related_name='solutions',
        verbose_name='关联请求'
    )
    solution_name = models.CharField(max_length=100, verbose_name='方案名称')
    code_content = models.TextField(verbose_name='代码内容')
    method_description = models.TextField(verbose_name='方法说明', blank=True)
    order = models.PositiveSmallIntegerField(default=1, verbose_name='排序')
    
    class Meta:
        verbose_name = 'R代码解决方案'
        verbose_name_plural = 'R代码解决方案'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.solution_name} (方案{self.order})"