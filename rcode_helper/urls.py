from django.urls import path
from . import views

app_name = 'rcode_helper'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('homework/', views.HomeworkSolutionView.as_view(), name='homework_solution'),
    path('explanation/', views.CodeExplanationView.as_view(), name='code_explanation'),
    path('history/', views.HistoryView.as_view(), name='history'),
    path('request/<int:request_id>/', views.RequestDetailView.as_view(), name='request_detail'),
]