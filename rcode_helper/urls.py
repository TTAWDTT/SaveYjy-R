from django.urls import path
from . import views
from .api_views import (
    CodeQualityAnalysisView, TestCaseGenerationView, OptimizationSuggestionsView,
    ClientMetricsView, PerformanceDashboardView, HealthCheckView
)

app_name = 'rcode_helper'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('homework/', views.HomeworkSolutionView.as_view(), name='homework_solution'),
    path('explanation/', views.CodeExplanationView.as_view(), name='code_explanation'),
    path('chat/', views.ChatView.as_view(), name='chat'),
    path('history/', views.HistoryView.as_view(), name='history'),
    path('request/<int:request_id>/', views.RequestDetailView.as_view(), name='request_detail'),
    path('monitoring/', views.MonitoringDashboardView.as_view(), name='monitoring_dashboard'),
    
    # 功能测试页面
    path('test/', views.test_features_view, name='test_features'),
    
    # Temporary demo view for modern interface
    path('modern-demo/', views.modern_demo_view, name='modern_demo'),
    
    # 分析数据收集API
    path('api/analytics/', views.api_analytics, name='api_analytics'),
    
    # 新的增强API端点
    path('api/code-quality/', CodeQualityAnalysisView.as_view(), name='api_code_quality'),
    path('api/test-cases/', TestCaseGenerationView.as_view(), name='api_test_cases'),
    path('api/optimization/', OptimizationSuggestionsView.as_view(), name='api_optimization'),
    path('api/client-metrics/', ClientMetricsView.as_view(), name='api_client_metrics'),
    path('api/performance-dashboard/', PerformanceDashboardView.as_view(), name='api_performance_dashboard'),
    path('api/health/', HealthCheckView.as_view(), name='api_health_check'),
]