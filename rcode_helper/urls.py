from django.urls import path
from . import views

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
]