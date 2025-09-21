"""
异步服务类，集成LangGraph工作流
提供高级的AI服务功能
"""
import asyncio
import json
import time
import hashlib
from typing import Dict, Any, List, Optional
from .workflows import LangGraphWorkflowManager
from .services import DeepSeekService
from .performance import PerformanceMonitor, CacheManager, ErrorTracker
from django.core.cache import cache
from django.conf import settings
import logging


logger = logging.getLogger('rcode_helper')


class EnhancedAIService:
    """增强的AI服务类，集成LangGraph工作流和性能监控"""
    
    def __init__(self):
        self.workflow_manager = LangGraphWorkflowManager()
        self.deepseek_service = DeepSeekService()
        self.cache_timeout = getattr(settings, 'AI_CACHE_TIMEOUT', 3600)  # 1小时缓存
    
    @PerformanceMonitor.measure_async_time(endpoint='explain_code_enhanced')
    async def explain_code_enhanced(self, code: str, user_query: str = "", 
                                  selected_lines: List[int] = None, 
                                  file_content: str = "") -> Dict[str, Any]:
        """增强的代码解释功能"""
        try:
            # 生成缓存键
            cache_data = {
                'code': code,
                'user_query': user_query,
                'selected_lines': selected_lines or []
            }
            cache_key = f"code_explain_{hashlib.md5(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()}"
            
            # 使用缓存管理器
            async def fetch_explanation():
                logger.info("Executing enhanced code explanation workflow")
                result = await self.workflow_manager.run_code_analysis_workflow(
                    code=code,
                    user_query=user_query,
                    selected_lines=selected_lines or [],
                    file_content=file_content
                )
                
                # 添加元数据
                result['execution_time'] = time.time() - start_time
                result['timestamp'] = time.time()
                result['service_version'] = '2.0.0'
                result['workflow_type'] = 'langgraph_enhanced'
                
                return result
            
            start_time = time.time()
            result = await CacheManager.async_get_or_set_cache(
                cache_key, 
                fetch_explanation, 
                self.cache_timeout
            )
            
            return result
            
        except Exception as e:
            ErrorTracker.track_error(e, {
                'function': 'explain_code_enhanced',
                'code_length': len(code),
                'has_user_query': bool(user_query),
                'selected_lines_count': len(selected_lines or [])
            })
            
            # 如果工作流失败，回退到传统方法
            return await self._fallback_code_explanation(code, user_query, selected_lines)
    
    @PerformanceMonitor.measure_async_time(endpoint='chat_enhanced')
    async def chat_enhanced(self, query: str, conversation_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """增强的聊天功能"""
        try:
            # 生成缓存键
            history_str = json.dumps(conversation_history or [], sort_keys=True)
            cache_key = f"chat_enhanced_{hashlib.md5((query + history_str).encode()).hexdigest()}"
            
            async def fetch_chat_response():
                logger.info("Executing enhanced conversation workflow")
                result = await self.workflow_manager.run_conversation_workflow(
                    query=query,
                    conversation_history=conversation_history or []
                )
                
                # 添加元数据
                result['execution_time'] = time.time() - start_time
                result['timestamp'] = time.time()
                result['service_version'] = '2.0.0'
                result['workflow_type'] = 'conversation_enhanced'
                
                return result
            
            start_time = time.time()
            result = await CacheManager.async_get_or_set_cache(
                cache_key, 
                fetch_chat_response, 
                self.cache_timeout // 2  # 对话缓存时间较短
            )
            
            return result
            
        except Exception as e:
            ErrorTracker.track_error(e, {
                'function': 'chat_enhanced',
                'query_length': len(query),
                'history_length': len(conversation_history or [])
            })
            
            # 回退到传统聊天方法
            return await self._fallback_chat(query, conversation_history)
    
    @PerformanceMonitor.measure_async_time(endpoint='analyze_code_quality')
    async def analyze_code_quality(self, code: str) -> Dict[str, Any]:
        """代码质量分析"""
        try:
            cache_key = f"code_quality_{hashlib.md5(code.encode()).hexdigest()}"
            
            def fetch_quality_analysis():
                logger.info("Executing code quality analysis")
                return {
                    'readability_score': self._calculate_readability_score(code),
                    'complexity_metrics': self._calculate_complexity_metrics(code),
                    'best_practices': self._check_best_practices(code),
                    'security_issues': self._check_security_issues(code),
                    'performance_suggestions': self._generate_performance_suggestions(code),
                    'maintainability_score': self._calculate_maintainability_score(code),
                    'timestamp': time.time()
                }
            
            return CacheManager.get_or_set_cache(
                cache_key, 
                fetch_quality_analysis, 
                self.cache_timeout
            )
            
        except Exception as e:
            ErrorTracker.track_error(e, {
                'function': 'analyze_code_quality',
                'code_length': len(code)
            })
            
            return {
                'error': f"代码质量分析失败: {str(e)}",
                'readability_score': 0,
                'complexity_metrics': {},
                'best_practices': [],
                'security_issues': [],
                'performance_suggestions': [],
                'maintainability_score': 0,
                'timestamp': time.time()
            }
    
    @PerformanceMonitor.measure_async_time(endpoint='generate_test_cases')
    async def generate_test_cases(self, code: str, function_name: str = None) -> Dict[str, Any]:
        """生成测试用例"""
        try:
            cache_key = f"test_cases_{hashlib.md5((code + (function_name or '')).encode()).hexdigest()}"
            
            async def fetch_test_cases():
                logger.info("Generating test cases")
                test_prompt = f"""
作为R语言测试专家，为以下代码生成全面的测试用例：

代码：
{code}

{'目标函数: ' + function_name if function_name else ''}

请生成：
1. 正常情况测试用例
2. 边界值测试用例  
3. 异常情况测试用例
4. 性能测试建议

返回完整的R语言测试代码，使用testthat包。
"""
                
                test_result = self.deepseek_service._make_request(test_prompt, "code_generation")
                
                return {
                    'test_code': test_result,
                    'test_categories': ['正常情况', '边界值', '异常情况', '性能测试'],
                    'testing_framework': 'testthat',
                    'generated_at': time.time()
                }
            
            return await CacheManager.async_get_or_set_cache(
                cache_key, 
                fetch_test_cases, 
                self.cache_timeout
            )
            
        except Exception as e:
            ErrorTracker.track_error(e, {
                'function': 'generate_test_cases',
                'code_length': len(code),
                'function_name': function_name
            })
            
            return {
                'error': f"测试用例生成失败: {str(e)}",
                'test_code': '',
                'test_categories': [],
                'testing_framework': '',
                'generated_at': time.time()
            }
    
    @PerformanceMonitor.measure_async_time(endpoint='suggest_optimizations')
    async def suggest_optimizations(self, code: str) -> Dict[str, Any]:
        """建议代码优化"""
        try:
            cache_key = f"optimization_{hashlib.md5(code.encode()).hexdigest()}"
            
            async def fetch_optimizations():
                logger.info("Generating optimization suggestions")
                optimization_prompt = f"""
作为R语言性能优化专家，分析以下代码并提供优化建议：

代码：
{code}

请提供：
1. 性能瓶颈分析
2. 内存使用优化
3. 算法改进建议
4. 并行化可能性
5. 包选择建议
6. 优化后的代码示例

重点关注R语言特有的优化技巧。
"""
                
                optimization_result = self.deepseek_service._make_request(optimization_prompt, "optimization")
                
                return {
                    'optimization_suggestions': optimization_result,
                    'priority_areas': ['性能', '内存', '算法', '并行化'],
                    'estimated_improvement': '20-50%',
                    'complexity_reduction': 'Medium',
                    'generated_at': time.time()
                }
            
            return await CacheManager.async_get_or_set_cache(
                cache_key, 
                fetch_optimizations, 
                self.cache_timeout
            )
            
        except Exception as e:
            ErrorTracker.track_error(e, {
                'function': 'suggest_optimizations',
                'code_length': len(code)
            })
            
            return {
                'error': f"优化建议生成失败: {str(e)}",
                'optimization_suggestions': '',
                'priority_areas': [],
                'estimated_improvement': 'Unknown',
                'complexity_reduction': 'Unknown',
                'generated_at': time.time()
            }
    
    # 私有辅助方法
    async def _fallback_code_explanation(self, code: str, user_query: str, selected_lines: List[int]) -> Dict[str, Any]:
        """回退的代码解释方法"""
        try:
            prompt = f"""
请解释以下R代码：

代码：
{code}

用户查询：{user_query if user_query else "无特定查询"}
选中行：{selected_lines if selected_lines else "未选择"}

请提供详细的代码解释。
"""
            result = self.deepseek_service._make_request(prompt, "explanation")
            
            return {
                'final_explanation': result,
                'confidence_score': 0.7,
                'reasoning_chain': ['回退方法'],
                'suggestions': ['建议使用完整的分析工作流'],
                'error_messages': ['工作流执行失败，使用简化方法'],
                'execution_time': 0,
                'workflow_type': 'fallback'
            }
        except Exception as e:
            return {
                'final_explanation': f"代码解释失败: {str(e)}",
                'confidence_score': 0.1,
                'reasoning_chain': [],
                'suggestions': [],
                'error_messages': [str(e)],
                'execution_time': 0,
                'workflow_type': 'error'
            }
    
    async def _fallback_chat(self, query: str, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """回退的聊天方法"""
        try:
            chat_response = self.deepseek_service._make_request(query, "chat")
            
            return {
                'final_response': chat_response,
                'confidence_score': 0.7,
                'user_intent': 'general_inquiry',
                'response_type': 'conversational',
                'execution_time': 0,
                'workflow_type': 'fallback'
            }
        except Exception as e:
            return {
                'final_response': f"抱歉，处理您的请求时出现了问题: {str(e)}",
                'confidence_score': 0.1,
                'user_intent': 'unknown',
                'response_type': 'error',
                'execution_time': 0,
                'workflow_type': 'error'
            }
    
    def _calculate_readability_score(self, code: str) -> float:
        """计算代码可读性分数"""
        lines = code.split('\n')
        comment_lines = len([line for line in lines if line.strip().startswith('#')])
        total_lines = len([line for line in lines if line.strip()])
        
        if total_lines == 0:
            return 0.0
        
        comment_ratio = comment_lines / total_lines
        # 基于注释比例和其他因素计算可读性
        readability = min(1.0, comment_ratio * 2 + 0.3)
        return round(readability, 2)
    
    def _calculate_complexity_metrics(self, code: str) -> Dict[str, Any]:
        """计算复杂度指标"""
        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        # 循环复杂度
        control_structures = ['for', 'while', 'if', 'else', 'switch']
        complexity = 1  # 基础复杂度
        for line in non_empty_lines:
            for structure in control_structures:
                complexity += line.count(structure)
        
        return {
            'cyclomatic_complexity': complexity,
            'lines_of_code': len(non_empty_lines),
            'function_count': code.count('function'),
            'nesting_level': self._calculate_nesting_level(code)
        }
    
    def _calculate_nesting_level(self, code: str) -> int:
        """计算嵌套层级"""
        max_level = 0
        current_level = 0
        
        for char in code:
            if char == '{':
                current_level += 1
                max_level = max(max_level, current_level)
            elif char == '}':
                current_level = max(0, current_level - 1)
        
        return max_level
    
    def _check_best_practices(self, code: str) -> List[str]:
        """检查最佳实践"""
        practices = []
        
        if '<-' in code:
            practices.append("✓ 使用R风格的赋值操作符 <-")
        if 'library(' in code or 'require(' in code:
            practices.append("✓ 正确加载R包")
        if '#' in code:
            practices.append("✓ 包含代码注释")
        if 'function' in code:
            practices.append("✓ 使用函数封装逻辑")
        
        # 检查潜在问题
        if 'rm(' not in code and len(code) > 500:
            practices.append("⚠ 建议添加内存清理代码")
        if code.count('for') > 3:
            practices.append("⚠ 考虑使用向量化操作替代循环")
        
        return practices
    
    def _check_security_issues(self, code: str) -> List[str]:
        """检查安全问题"""
        issues = []
        
        if 'eval(' in code:
            issues.append("⚠ 使用eval()可能存在安全风险")
        if 'system(' in code:
            issues.append("⚠ 系统调用需要谨慎处理")
        if 'source(' in code and 'http' in code:
            issues.append("⚠ 从网络源加载代码存在风险")
        
        return issues
    
    def _generate_performance_suggestions(self, code: str) -> List[str]:
        """生成性能建议"""
        suggestions = []
        
        if 'for' in code and 'append' in code:
            suggestions.append("建议预分配向量大小，避免频繁append操作")
        if 'data.frame' in code and code.count('rbind') > 1:
            suggestions.append("考虑使用do.call(rbind, list)替代多次rbind")
        if 'apply' not in code and 'for' in code:
            suggestions.append("考虑使用apply族函数替代for循环")
        if 'library(data.table)' not in code and 'data.frame' in code:
            suggestions.append("对于大数据集，考虑使用data.table包")
        
        return suggestions
    
    def _calculate_maintainability_score(self, code: str) -> float:
        """计算可维护性分数"""
        lines = code.split('\n')
        total_lines = len([line for line in lines if line.strip()])
        
        if total_lines == 0:
            return 0.0
        
        # 基于多个因素计算可维护性
        factors = {
            'comment_ratio': len([line for line in lines if line.strip().startswith('#')]) / total_lines,
            'function_ratio': code.count('function') / max(1, total_lines / 10),
            'complexity_penalty': max(0, 1 - (self._calculate_complexity_metrics(code)['cyclomatic_complexity'] / 20))
        }
        
        maintainability = (factors['comment_ratio'] * 0.3 + 
                          factors['function_ratio'] * 0.3 + 
                          factors['complexity_penalty'] * 0.4)
        
        return round(min(1.0, maintainability), 2)

    @PerformanceMonitor.measure_async_time('generate_test_cases')
    async def generate_test_cases(self, code: str) -> dict:
        """生成代码测试用例"""
        try:
            prompt = f"""
            为以下R语言代码生成完整的测试用例：

            ```r
            {code}
            ```

            请提供：
            1. 使用testthat包的完整测试代码
            2. 测试框架说明
            3. 测试类别（单元测试、集成测试等）
            4. 边界条件测试
            5. 错误处理测试

            返回格式化的JSON结构。
            """
            
            response = await self.deepseek_service.get_completion(prompt)
            
            # 解析和结构化测试用例
            test_cases = {
                'test_code': response,
                'testing_framework': 'testthat',
                'test_categories': ['单元测试', '边界测试', '错误处理'],
                'description': '自动生成的R语言测试用例'
            }
            
            return test_cases
            
        except Exception as e:
            await ErrorTracker.track_error('generate_test_cases', e)
            return {
                'test_code': '# 生成测试用例时发生错误',
                'testing_framework': 'testthat',
                'test_categories': [],
                'error': str(e)
            }

    @PerformanceMonitor.measure_async_time('optimization_suggestions')
    async def get_optimization_suggestions(self, code: str) -> dict:
        """获取代码优化建议"""
        try:
            prompt = f"""
            分析以下R语言代码并提供优化建议：

            ```r
            {code}
            ```

            请从以下角度提供建议：
            1. 性能优化（循环优化、向量化等）
            2. 内存使用优化
            3. 代码可读性改进
            4. 错误处理增强
            5. R语言最佳实践

            为每个建议提供具体的代码示例。
            """
            
            response = await self.deepseek_service.get_completion(prompt)
            
            suggestions = {
                'performance_suggestions': [
                    '使用向量化操作替代循环',
                    '预分配内存空间',
                    '使用data.table提高数据处理速度'
                ],
                'readability_suggestions': [
                    '使用更描述性的变量名',
                    '添加适当的注释',
                    '拆分复杂函数'
                ],
                'best_practices': [
                    '使用一致的代码风格',
                    '添加错误处理',
                    '使用适当的包命名空间'
                ],
                'detailed_analysis': response
            }
            
            return suggestions
            
        except Exception as e:
            await ErrorTracker.track_error('optimization_suggestions', e)
            return {
                'error': str(e),
                'suggestions': []
            }

    @PerformanceMonitor.measure_async_time('health_check')
    async def health_check(self) -> bool:
        """AI服务健康检查"""
        try:
            test_prompt = "测试连接"
            response = await self.deepseek_service.get_completion(test_prompt)
            return len(response.strip()) > 0
        except Exception:
            return False


# 创建全局实例
enhanced_ai_service = EnhancedAIService()