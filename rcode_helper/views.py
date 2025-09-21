from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from asgiref.sync import sync_to_async
from .forms import LoginForm, HomeworkForm, CodeExplanationForm, ChatForm
from .file_processor import FileProcessor, format_file_content_for_ai
from .models import RequestLog, CodeSolution
from .services import DeepSeekService
from .enhanced_services import enhanced_ai_service
from .security import secure_view, SecurityValidator, InputSanitizer
import json
import asyncio
import time


class LoginView(View):
    """用户登录视图"""
    template_name = 'rcode_helper/login.html'
    
    def get(self, request):
        if request.session.get('user_authenticated'):
            return redirect('rcode_helper:dashboard')
        form = LoginForm()
        return render(request, self.template_name, {'form': form})
    
    def post(self, request):
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            
            # 简单的演示登录逻辑
            if username == 'admin' and password == 'admin123':
                request.session['user_authenticated'] = True
                request.session['username'] = username
                return redirect('rcode_helper:dashboard')
            else:
                messages.error(request, '用户名或密码错误')
        
        return render(request, self.template_name, {'form': form})


class LogoutView(View):
    """用户登出视图"""
    
    def get(self, request):
        request.session.flush()  # 清除所有会话数据
        messages.success(request, '您已成功登出')
        return redirect('rcode_helper:login')


class DashboardView(View):
    """主面板视图 - 新的SPA界面"""
    template_name = 'rcode_helper/dashboard.html'
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        context = {
            'homework_form': HomeworkForm(),
            'explanation_form': CodeExplanationForm(),
            'chat_form': ChatForm(),
            'username': request.session.get('username', 'Guest')
        }
        return render(request, self.template_name, context)


def get_client_ip(request):
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class HomeView(View):
    """首页视图 - 重定向到登录页面"""
    
    def get(self, request):
        if request.session.get('user_authenticated'):
            return redirect('rcode_helper:dashboard')
        return redirect('rcode_helper:login')
        
        context = {
            'homework_form': homework_form,
            'explanation_form': explanation_form,
            'chat_form': chat_form,
        }
        return render(request, 'rcode_helper/home.html', context)


@method_decorator(csrf_protect, name='dispatch')
class HomeworkSolutionView(View):
    """作业题解答视图"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        form = HomeworkForm(request.POST, request.FILES)
        
        if form.is_valid():
            input_method = form.cleaned_data['input_method']
            homework_question = ""
            file_info = None
            
            # 根据输入方式处理内容
            if input_method == 'text':
                homework_question = form.cleaned_data['homework_question']
            elif input_method == 'file':
                uploaded_file = form.cleaned_data['homework_file']
                
                # 处理上传的文件
                success, content = FileProcessor.process_file(uploaded_file)
                
                if success:
                    # 为AI格式化文件内容
                    homework_question = format_file_content_for_ai(content, uploaded_file.name)
                    file_info = FileProcessor.get_file_info(uploaded_file)
                else:
                    messages.error(request, f'文件处理失败：{content}')
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return JsonResponse({'error': f'文件处理失败：{content}'}, status=400)
                    return redirect('rcode_helper:dashboard')
            
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
                    'homework_question': homework_question if input_method == 'text' else f"文件：{form.cleaned_data['homework_file'].name}",
                    'solutions': solutions,
                    'request_id': request_log.id,
                    'input_method': input_method,
                    'file_info': file_info
                }
                
                # 检查是否为AJAX请求
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return render(request, 'rcode_helper/homework_result_partial.html', context)
                else:
                    return render(request, 'rcode_helper/homework_result.html', context)
                
            except Exception as e:
                messages.error(request, f'生成解决方案时出现错误：{str(e)}')
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'error': str(e)}, status=500)
                return redirect('rcode_helper:dashboard')
        
        else:
            error_messages = []
            for field, errors in form.errors.items():
                error_messages.extend(errors)
            error_message = '；'.join(error_messages)
            
            messages.error(request, f'表单验证失败：{error_message}')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'error': error_message}, status=400)
            return redirect('rcode_helper:dashboard')


@method_decorator(csrf_protect, name='dispatch') 
class CodeExplanationView(View):
    """代码解释视图 - 集成LangGraph工作流"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    @secure_view(allowed_methods=['POST'], require_auth=False, rate_limit=30)
    def post(self, request):
        form = CodeExplanationForm(request.POST)
        
        if form.is_valid():
            r_code = form.cleaned_data['r_code']
            user_query = form.cleaned_data.get('user_query', '')
            selected_lines_str = form.cleaned_data.get('selected_lines', '')
            
            # 安全验证R代码
            validation_result = SecurityValidator.validate_r_code(r_code)
            if not validation_result['is_safe']:
                messages.error(request, f"代码安全验证失败: {', '.join(validation_result['issues'])}")
                return redirect('rcode_helper:home')
            
            # 清理R代码输入
            sanitized_code = InputSanitizer.sanitize_r_code(r_code)
            if sanitized_code != r_code:
                messages.warning(request, "检测到潜在危险操作，已自动清理代码中的危险函数调用")
                r_code = sanitized_code
            
            # 解析选中的行号
            selected_lines = []
            if selected_lines_str:
                try:
                    selected_lines = json.loads(selected_lines_str)
                except (json.JSONDecodeError, ValueError):
                    selected_lines = []
            
            # 创建请求记录
            request_log = RequestLog.objects.create(
                request_type='explanation',
                user_input=r_code,
                ip_address=get_client_ip(request)
            )
            
            try:
                # 使用异步包装器调用增强的AI服务
                start_time = time.time()
                explanation_result = asyncio.run(
                    enhanced_ai_service.explain_code_enhanced(
                        code=r_code,
                        user_query=user_query,
                        selected_lines=selected_lines
                    )
                )
                
                # 同时运行代码质量分析
                quality_analysis = asyncio.run(
                    enhanced_ai_service.analyze_code_quality(r_code)
                )
                
                # 生成优化建议
                optimization_suggestions = asyncio.run(
                    enhanced_ai_service.suggest_optimizations(r_code)
                )
                
                processing_time = time.time() - start_time
                
                # 保存完整的AI响应
                full_response = {
                    'explanation': explanation_result,
                    'quality_analysis': quality_analysis,
                    'optimization_suggestions': optimization_suggestions,
                    'processing_time': processing_time,
                    'enhanced': True
                }
                
                request_log.ai_response = json.dumps(full_response, ensure_ascii=False)
                request_log.save()
                
                context = {
                    'r_code': r_code,
                    'explanation_result': explanation_result,
                    'quality_analysis': quality_analysis,
                    'optimization_suggestions': optimization_suggestions,
                    'user_query': user_query,
                    'selected_lines': selected_lines,
                    'request_id': request_log.id,
                    'processing_time': processing_time,
                    'confidence_score': explanation_result.get('confidence_score', 0.8),
                    'reasoning_chain': explanation_result.get('reasoning_chain', []),
                    'suggestions': explanation_result.get('suggestions', []),
                    'enhanced_features': True
                }
                
                # 检查是否为AJAX请求
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return render(request, 'rcode_helper/explanation_result_partial.html', context)
                else:
                    return render(request, 'rcode_helper/explanation_result.html', context)
                
            except Exception as e:
                # 如果增强服务失败，回退到传统方法
                try:
                    deepseek_service = DeepSeekService()
                    explanation = deepseek_service.explain_r_code_enhanced(
                        r_code, 
                        user_query=user_query, 
                        selected_lines=selected_lines
                    )
                    
                    request_log.ai_response = explanation
                    request_log.save()
                    
                    context = {
                        'r_code': r_code,
                        'explanation': explanation,
                        'user_query': user_query,
                        'selected_lines': selected_lines,
                        'request_id': request_log.id,
                        'fallback_mode': True,
                        'error_message': f"增强功能不可用，使用基础模式: {str(e)}"
                    }
                    
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return render(request, 'rcode_helper/explanation_result_partial.html', context)
                    else:
                        return render(request, 'rcode_helper/explanation_result.html', context)
                        
                except Exception as fallback_error:
                    messages.error(request, f'解释代码时出现错误：{str(fallback_error)}')
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return JsonResponse({'error': str(fallback_error)}, status=500)
                    return redirect('rcode_helper:dashboard')
        
        else:
            messages.error(request, '请输入有效的R语言代码')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'error': '请输入有效的R语言代码'}, status=400)
            return redirect('rcode_helper:dashboard')


@method_decorator(csrf_protect, name='dispatch')
class ChatView(View):
    """普通聊天视图 - 集成LangGraph对话工作流"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        form = ChatForm(request.POST)
        
        if form.is_valid():
            user_message = form.cleaned_data['message']
            
            # 获取对话历史
            conversation_history = request.session.get('conversation_history', [])
            
            # 创建请求记录
            request_log = RequestLog.objects.create(
                request_type='chat',
                user_input=user_message,
                ip_address=get_client_ip(request)
            )
            
            try:
                # 使用增强的对话工作流
                start_time = time.time()
                chat_result = asyncio.run(
                    enhanced_ai_service.chat_enhanced(
                        query=user_message,
                        conversation_history=conversation_history
                    )
                )
                
                processing_time = time.time() - start_time
                
                # 提取响应内容
                chat_response = chat_result.get('final_response', '')
                user_intent = chat_result.get('user_intent', '')
                confidence_score = chat_result.get('confidence_score', 0.8)
                
                # 保存增强的AI响应
                enhanced_response = {
                    'response': chat_response,
                    'user_intent': user_intent,
                    'confidence_score': confidence_score,
                    'processing_time': processing_time,
                    'workflow_type': chat_result.get('workflow_type', 'enhanced'),
                    'enhanced': True
                }
                
                request_log.ai_response = json.dumps(enhanced_response, ensure_ascii=False)
                request_log.save()
                
                # 更新对话历史
                conversation_history.append({
                    'type': 'user',
                    'content': user_message,
                    'timestamp': time.time()
                })
                conversation_history.append({
                    'type': 'assistant',
                    'content': chat_response,
                    'intent': user_intent,
                    'confidence': confidence_score,
                    'timestamp': time.time()
                })
                
                # 保持最近20轮对话
                if len(conversation_history) > 40:
                    conversation_history = conversation_history[-40:]
                
                request.session['conversation_history'] = conversation_history
                
                context = {
                    'user_message': user_message,
                    'chat_response': chat_response,
                    'user_intent': user_intent,
                    'confidence_score': confidence_score,
                    'processing_time': processing_time,
                    'request_id': request_log.id,
                    'enhanced_features': True,
                    'conversation_length': len(conversation_history) // 2
                }
                
                # 检查是否为AJAX请求
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return render(request, 'rcode_helper/chat_result_partial.html', context)
                else:
                    return render(request, 'rcode_helper/chat_result.html', context)
                
            except Exception as e:
                # 回退到传统聊天方法
                try:
                    deepseek_service = DeepSeekService()
                    chat_response = deepseek_service.chat_with_user(user_message)
                    
                    request_log.ai_response = chat_response
                    request_log.save()
                    
                    context = {
                        'user_message': user_message,
                        'chat_response': chat_response,
                        'request_id': request_log.id,
                        'fallback_mode': True,
                        'error_message': f"增强功能不可用，使用基础模式: {str(e)}"
                    }
                    
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return render(request, 'rcode_helper/chat_result_partial.html', context)
                    else:
                        return render(request, 'rcode_helper/chat_result.html', context)
                        
                except Exception as fallback_error:
                    messages.error(request, f'聊天服务出现错误：{str(fallback_error)}')
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return JsonResponse({'error': str(fallback_error)}, status=500)
                    return redirect('rcode_helper:dashboard')
        
        else:
            messages.error(request, '请输入有效的聊天内容')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'error': '请输入有效的聊天内容'}, status=400)
            return redirect('rcode_helper:dashboard')


class HistoryView(View):
    """历史记录视图"""
    template_name = 'rcode_helper/history.html'
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # 获取用户的历史记录
        request_logs = RequestLog.objects.all().order_by('-created_at')[:50]
        
        context = {
            'request_logs': request_logs,
        }
        return render(request, self.template_name, context)


# 新增的API端点用于增强功能
@require_http_methods(["POST"])
@csrf_protect
def api_code_quality_analysis(request):
    """代码质量分析API"""
    if not request.session.get('user_authenticated'):
        return JsonResponse({'error': '未授权访问'}, status=401)
    
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        
        if not code:
            return JsonResponse({'error': '代码不能为空'}, status=400)
        
        # 运行代码质量分析
        quality_analysis = asyncio.run(
            enhanced_ai_service.analyze_code_quality(code)
        )
        
        return JsonResponse({
            'success': True,
            'analysis': quality_analysis
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@csrf_protect
def api_generate_test_cases(request):
    """生成测试用例API"""
    if not request.session.get('user_authenticated'):
        return JsonResponse({'error': '未授权访问'}, status=401)
    
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        function_name = data.get('function_name', '')
        
        if not code:
            return JsonResponse({'error': '代码不能为空'}, status=400)
        
        # 生成测试用例
        test_cases = asyncio.run(
            enhanced_ai_service.generate_test_cases(code, function_name)
        )
        
        return JsonResponse({
            'success': True,
            'test_cases': test_cases
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@csrf_protect
def api_optimization_suggestions(request):
    """优化建议API"""
    if not request.session.get('user_authenticated'):
        return JsonResponse({'error': '未授权访问'}, status=401)
    
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        
        if not code:
            return JsonResponse({'error': '代码不能为空'}, status=400)
        
        # 生成优化建议
        suggestions = asyncio.run(
            enhanced_ai_service.suggest_optimizations(code)
        )
        
        return JsonResponse({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


class HistoryView(View):
    """历史记录视图"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # 获取最近的请求记录
        recent_requests = RequestLog.objects.all()[:20]
        
        context = {
            'recent_requests': recent_requests
        }
        
        return render(request, 'rcode_helper/history.html', context)


class RequestDetailView(View):
    """请求详情视图"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('user_authenticated'):
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
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
            elif request_log.request_type == 'chat':
                return render(request, 'rcode_helper/chat_detail.html', context)
            else:
                return render(request, 'rcode_helper/explanation_detail.html', context)
                
        except RequestLog.DoesNotExist:
            messages.error(request, '请求记录不存在')
            return redirect('history')


class MonitoringDashboardView(View):
    """系统监控仪表板视图"""
    
    def dispatch(self, request, *args, **kwargs):
        # 检查用户权限（可以添加管理员权限检查）
        if not request.user.is_authenticated:
            return redirect('rcode_helper:login')
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """显示监控仪表板页面"""
        return render(request, 'rcode_helper/monitoring_dashboard.html')