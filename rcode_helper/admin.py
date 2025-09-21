from django.contrib import admin
from .models import RequestLog, CodeSolution


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ['request_type', 'created_at', 'ip_address']
    list_filter = ['request_type', 'created_at']
    search_fields = ['user_input', 'ai_response']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


@admin.register(CodeSolution)
class CodeSolutionAdmin(admin.ModelAdmin):
    list_display = ['solution_name', 'request_log', 'order']
    list_filter = ['order']
    search_fields = ['solution_name', 'code_content']
    ordering = ['request_log', 'order']