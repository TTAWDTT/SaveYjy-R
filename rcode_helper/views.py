from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django.http import JsonResponse
from .forms import HomeworkForm, CodeExplanationForm
from .models import RequestLog, CodeSolution
from .services import DeepSeekService
import json


def get_client_ip(request):
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class HomeView(View):
    """首页视图"""
    
    def get(self, request):
        homework_form = HomeworkForm()
        explanation_form = CodeExplanationForm()
        
        context = {
            'homework_form': homework_form,
            'explanation_form': explanation_form,
        }
        return render(request, 'rcode_helper/home.html', context)


@method_decorator(csrf_protect, name='dispatch')
class HomeworkSolutionView(View):
    """作业题解答视图"""
    
    def post(self, request):
        form = HomeworkForm(request.POST)
        
        if form.is_valid():
            homework_question = form.cleaned_data['homework_question']
            
            # 创建请求记录
            request_log = RequestLog.objects.create(
                request_type='homework',
                user_input=homework_question,
                ip_address=get_client_ip(request)
            )
            
            try:
                # 调用DeepSeek API生成解决方案
                deepseek_service = DeepSeekService()
                solutions = deepseek_service.generate_homework_solutions(homework_question)
                
                # 保存AI响应
                request_log.ai_response = json.dumps(solutions, ensure_ascii=False)
                request_log.save()
                
                # 保存每个解决方案
                for i, solution in enumerate(solutions, 1):
                    CodeSolution.objects.create(
                        request_log=request_log,
                        solution_name=solution.get('name', f'方案{i}'),
                        code_content=solution.get('code', ''),
                        method_description=solution.get('description', ''),
                        order=i
                    )
                
                context = {
                    'homework_question': homework_question,
                    'solutions': solutions,
                    'request_id': request_log.id
                }
                
                return render(request, 'rcode_helper/homework_result.html', context)
                
            except Exception as e:
                messages.error(request, f'生成解决方案时出现错误：{str(e)}')
                return redirect('home')
        
        else:
            messages.error(request, '请输入有效的作业题目')
            return redirect('home')


@method_decorator(csrf_protect, name='dispatch') 
class CodeExplanationView(View):
    """代码解释视图"""
    
    def post(self, request):
        form = CodeExplanationForm(request.POST)
        
        if form.is_valid():
            r_code = form.cleaned_data['r_code']
            
            # 创建请求记录
            request_log = RequestLog.objects.create(
                request_type='explanation',
                user_input=r_code,
                ip_address=get_client_ip(request)
            )
            
            try:
                # 调用DeepSeek API解释代码
                deepseek_service = DeepSeekService()
                explanation = deepseek_service.explain_r_code(r_code)
                
                # 保存AI响应
                request_log.ai_response = explanation
                request_log.save()
                
                context = {
                    'r_code': r_code,
                    'explanation': explanation,
                    'request_id': request_log.id
                }
                
                return render(request, 'rcode_helper/explanation_result.html', context)
                
            except Exception as e:
                messages.error(request, f'解释代码时出现错误：{str(e)}')
                return redirect('home')
        
        else:
            messages.error(request, '请输入有效的R语言代码')
            return redirect('home')


class HistoryView(View):
    """历史记录视图"""
    
    def get(self, request):
        # 获取最近的请求记录
        recent_requests = RequestLog.objects.all()[:20]
        
        context = {
            'recent_requests': recent_requests
        }
        
        return render(request, 'rcode_helper/history.html', context)


class RequestDetailView(View):
    """请求详情视图"""
    
    def get(self, request, request_id):
        try:
            request_log = RequestLog.objects.get(id=request_id)
            
            context = {
                'request_log': request_log,
            }
            
            if request_log.request_type == 'homework':
                # 获取关联的解决方案
                solutions = request_log.solutions.all()
                context['solutions'] = solutions
                return render(request, 'rcode_helper/homework_detail.html', context)
            else:
                return render(request, 'rcode_helper/explanation_detail.html', context)
                
        except RequestLog.DoesNotExist:
            messages.error(request, '请求记录不存在')
            return redirect('history')