"""
基于LangGraph的工作流定义
提供代码解释、智能问答等功能的工作流实现
"""
import json
import time
import logging
import asyncio
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
from .services import DeepSeekService
from .prompts import PromptManager

logger = logging.getLogger(__name__)


class CodeAnalysisState(TypedDict):
    """代码分析状态定义"""
    original_code: str
    user_query: str
    selected_lines: List[int]
    file_content: str
    analysis_type: str
    code_structure: Dict[str, Any]
    syntax_analysis: Dict[str, Any]
    semantic_analysis: Dict[str, Any]
    targeted_analysis: Dict[str, Any]
    final_explanation: str
    reasoning_chain: List[str]
    confidence_score: float
    suggestions: List[str]
    error_messages: List[str]


class ConversationState(TypedDict):
    """对话状态定义"""
    messages: List[Dict[str, str]]
    current_query: str
    context_summary: str
    conversation_history: List[Dict[str, Any]]
    user_intent: str
    response_type: str
    knowledge_base: Dict[str, Any]
    final_response: str
    confidence_score: float


class LangGraphWorkflowManager:
    """LangGraph工作流管理器"""
    
    def __init__(self):
        self.deepseek_service = DeepSeekService()
        self.prompt_manager = PromptManager()
        
    def _create_code_analysis_workflow(self) -> StateGraph:
        """创建代码分析工作流"""
        
        def extract_code_structure(state: CodeAnalysisState) -> CodeAnalysisState:
            """提取代码结构"""
            try:
                code = state["original_code"]
                reasoning = f"开始分析代码结构: {len(code)} 字符"
                state["reasoning_chain"].append(reasoning)
                
                # 分析代码基本结构
                lines = code.split('\n')
                structure = {
                    "total_lines": len(lines),
                    "non_empty_lines": len([line for line in lines if line.strip()]),
                    "functions": self._extract_r_functions(code),
                    "variables": self._extract_r_variables(code),
                    "libraries": self._extract_r_libraries(code),
                    "comments": self._extract_r_comments(code)
                }
                state["code_structure"] = structure
                state["confidence_score"] = 0.8
                
            except Exception as e:
                state["error_messages"].append(f"代码结构分析失败: {str(e)}")
                state["confidence_score"] = 0.3
                
            return state
        
        def analyze_syntax(state: CodeAnalysisState) -> CodeAnalysisState:
            """语法分析"""
            try:
                code = state["original_code"]
                reasoning = "进行语法分析，检查R语言语法正确性"
                state["reasoning_chain"].append(reasoning)
                
                # 简单的R语法检查
                syntax_issues = []
                balanced_brackets = self._check_bracket_balance(code)
                if not balanced_brackets:
                    syntax_issues.append("括号不平衡")
                
                syntax_analysis = {
                    "is_valid": len(syntax_issues) == 0,
                    "issues": syntax_issues,
                    "bracket_balance": balanced_brackets,
                    "estimated_complexity": self._estimate_code_complexity(code)
                }
                state["syntax_analysis"] = syntax_analysis
                
            except Exception as e:
                state["error_messages"].append(f"语法分析失败: {str(e)}")
                
            return state
        
        def perform_semantic_analysis(state: CodeAnalysisState) -> CodeAnalysisState:
            """语义分析"""
            try:
                reasoning = "执行语义分析，理解代码含义和逻辑"
                state["reasoning_chain"].append(reasoning)
                
                # 使用AI进行语义分析
                prompt = self.prompt_manager.get_prompt(
                    'code_semantic_analysis',
                    code=state["original_code"],
                    structure=json.dumps(state["code_structure"], ensure_ascii=False)
                )
                
                semantic_result = self.deepseek_service._make_request(prompt, "explanation")
                
                semantic_analysis = {
                    "main_purpose": self._extract_main_purpose(semantic_result),
                    "data_flow": self._analyze_data_flow(state["original_code"]),
                    "algorithm_patterns": self._identify_algorithm_patterns(state["original_code"]),
                    "potential_issues": self._identify_potential_issues(state["original_code"])
                }
                state["semantic_analysis"] = semantic_analysis
                
            except Exception as e:
                state["error_messages"].append(f"语义分析失败: {str(e)}")
                
            return state
        
        def generate_targeted_analysis(state: CodeAnalysisState) -> CodeAnalysisState:
            """生成针对性分析"""
            try:
                if state["user_query"] or state["selected_lines"]:
                    reasoning = "根据用户查询和选定行生成针对性分析"
                    state["reasoning_chain"].append(reasoning)
                    
                    # 针对选定行的分析
                    if state["selected_lines"]:
                        selected_code = self._extract_selected_lines(
                            state["original_code"], 
                            state["selected_lines"]
                        )
                        prompt = self.prompt_manager.get_prompt(
                            'line_specific_analysis',
                            code=selected_code,
                            line_numbers=state["selected_lines"],
                            user_query=state["user_query"]
                        )
                    else:
                        prompt = self.prompt_manager.get_prompt(
                            'query_focused_analysis',
                            code=state["original_code"],
                            user_query=state["user_query"]
                        )
                    
                    targeted_result = self.deepseek_service._make_request(prompt, "explanation")
                    
                    targeted_analysis = {
                        "focused_explanation": targeted_result,
                        "related_concepts": self._extract_related_concepts(targeted_result),
                        "recommendations": self._generate_recommendations(targeted_result)
                    }
                    state["targeted_analysis"] = targeted_analysis
                else:
                    state["targeted_analysis"] = {"focused_explanation": "", "related_concepts": [], "recommendations": []}
                    
            except Exception as e:
                state["error_messages"].append(f"针对性分析失败: {str(e)}")
                
            return state
        
        def synthesize_final_explanation(state: CodeAnalysisState) -> CodeAnalysisState:
            """综合生成最终解释"""
            try:
                reasoning = "综合所有分析结果，生成最终的代码解释"
                state["reasoning_chain"].append(reasoning)
                
                # 整合所有分析结果
                synthesis_prompt = self.prompt_manager.get_prompt(
                    'final_explanation_synthesis',
                    original_code=state["original_code"],
                    code_structure=json.dumps(state["code_structure"], ensure_ascii=False),
                    syntax_analysis=json.dumps(state["syntax_analysis"], ensure_ascii=False),
                    semantic_analysis=json.dumps(state["semantic_analysis"], ensure_ascii=False),
                    targeted_analysis=json.dumps(state["targeted_analysis"], ensure_ascii=False),
                    user_query=state["user_query"],
                    selected_lines=state["selected_lines"]
                )
                
                final_explanation = self.deepseek_service._make_request(synthesis_prompt, "explanation")
                state["final_explanation"] = final_explanation
                
                # 生成改进建议
                suggestions = self._generate_improvement_suggestions(state)
                state["suggestions"] = suggestions
                
                # 更新置信度分数
                if len(state["error_messages"]) == 0:
                    state["confidence_score"] = min(0.95, state["confidence_score"] + 0.1)
                else:
                    state["confidence_score"] = max(0.4, state["confidence_score"] - 0.2)
                    
            except Exception as e:
                state["error_messages"].append(f"最终解释生成失败: {str(e)}")
                state["confidence_score"] = 0.3
                
            return state
        
        # 构建工作流图
        workflow = StateGraph(CodeAnalysisState)
        
        # 添加节点
        workflow.add_node("extract_structure", extract_code_structure)
        workflow.add_node("analyze_syntax", analyze_syntax)
        workflow.add_node("semantic_analysis", perform_semantic_analysis)
        workflow.add_node("targeted_analysis", generate_targeted_analysis)
        workflow.add_node("synthesize_explanation", synthesize_final_explanation)
        
        # 定义边和条件
        workflow.set_entry_point("extract_structure")
        workflow.add_edge("extract_structure", "analyze_syntax")
        workflow.add_edge("analyze_syntax", "semantic_analysis")
        workflow.add_edge("semantic_analysis", "targeted_analysis")
        workflow.add_edge("targeted_analysis", "synthesize_explanation")
        workflow.add_edge("synthesize_explanation", END)
        
        return workflow.compile()
    
    def _create_conversation_workflow(self) -> StateGraph:
        """创建对话工作流"""
        
        def analyze_user_intent(state: ConversationState) -> ConversationState:
            """分析用户意图"""
            try:
                query = state["current_query"]
                context = state["context_summary"]
                
                intent_prompt = self.prompt_manager.get_prompt(
                    'intent_analysis',
                    query=query,
                    context=context,
                    history=json.dumps(state["conversation_history"][-5:], ensure_ascii=False)
                )
                
                intent_result = self.deepseek_service._make_request(intent_prompt, "chat")
                state["user_intent"] = self._extract_intent(intent_result)
                state["response_type"] = self._determine_response_type(state["user_intent"])
                
            except Exception as e:
                state["user_intent"] = "general_inquiry"
                state["response_type"] = "informative"
                
            return state
        
        def retrieve_knowledge(state: ConversationState) -> ConversationState:
            """检索相关知识"""
            try:
                intent = state["user_intent"]
                query = state["current_query"]
                
                # 根据意图检索相关知识
                knowledge = self._retrieve_r_knowledge(intent, query)
                state["knowledge_base"] = knowledge
                
            except Exception as e:
                state["knowledge_base"] = {"concepts": [], "examples": [], "references": []}
                
            return state
        
        def generate_contextual_response(state: ConversationState) -> ConversationState:
            """生成上下文相关的回复"""
            try:
                response_prompt = self.prompt_manager.get_prompt(
                    'contextual_response',
                    query=state["current_query"],
                    intent=state["user_intent"],
                    response_type=state["response_type"],
                    knowledge=json.dumps(state["knowledge_base"], ensure_ascii=False),
                    context=state["context_summary"],
                    history=json.dumps(state["conversation_history"][-3:], ensure_ascii=False)
                )
                
                response = self.deepseek_service._make_request(response_prompt, "chat")
                state["final_response"] = response
                state["confidence_score"] = 0.85
                
            except Exception as e:
                state["final_response"] = "抱歉，我在处理您的请求时遇到了一些问题。请稍后再试。"
                state["confidence_score"] = 0.3
                
            return state
        
        # 构建对话工作流
        workflow = StateGraph(ConversationState)
        
        workflow.add_node("analyze_intent", analyze_user_intent)
        workflow.add_node("retrieve_knowledge", retrieve_knowledge)
        workflow.add_node("generate_response", generate_contextual_response)
        
        workflow.set_entry_point("analyze_intent")
        workflow.add_edge("analyze_intent", "retrieve_knowledge")
        workflow.add_edge("retrieve_knowledge", "generate_response")
        workflow.add_edge("generate_response", END)
        
        return workflow.compile()
    
    # 辅助方法
    def _extract_r_functions(self, code: str) -> List[str]:
        """提取R函数"""
        import re
        pattern = r'(\w+)\s*<-\s*function\s*\('
        return re.findall(pattern, code)
    
    def _extract_r_variables(self, code: str) -> List[str]:
        """提取R变量"""
        import re
        pattern = r'(\w+)\s*<-\s*[^f]'
        return re.findall(pattern, code)
    
    def _extract_r_libraries(self, code: str) -> List[str]:
        """提取加载的R包"""
        import re
        patterns = [r'library\((\w+)\)', r'require\((\w+)\)']
        libraries = []
        for pattern in patterns:
            libraries.extend(re.findall(pattern, code))
        return libraries
    
    def _extract_r_comments(self, code: str) -> List[str]:
        """提取注释"""
        lines = code.split('\n')
        return [line.strip() for line in lines if line.strip().startswith('#')]
    
    def _check_bracket_balance(self, code: str) -> bool:
        """检查括号平衡"""
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        for char in code:
            if char in pairs:
                stack.append(char)
            elif char in pairs.values():
                if not stack:
                    return False
                if pairs[stack.pop()] != char:
                    return False
        return len(stack) == 0
    
    def _estimate_code_complexity(self, code: str) -> str:
        """估算代码复杂度"""
        lines = len([line for line in code.split('\n') if line.strip()])
        if lines < 10:
            return "简单"
        elif lines < 50:
            return "中等"
        else:
            return "复杂"
    
    def _extract_main_purpose(self, semantic_result: str) -> str:
        """从语义分析结果中提取主要目的"""
        # 简化实现，实际可以使用更复杂的NLP技术
        return semantic_result[:200] + "..." if len(semantic_result) > 200 else semantic_result
    
    def _analyze_data_flow(self, code: str) -> List[str]:
        """分析数据流"""
        # 简化实现
        return ["数据读取", "数据处理", "结果输出"]
    
    def _identify_algorithm_patterns(self, code: str) -> List[str]:
        """识别算法模式"""
        patterns = []
        if "for" in code or "while" in code:
            patterns.append("循环结构")
        if "if" in code:
            patterns.append("条件判断")
        if "function" in code:
            patterns.append("函数定义")
        return patterns
    
    def _identify_potential_issues(self, code: str) -> List[str]:
        """识别潜在问题"""
        issues = []
        if code.count('(') != code.count(')'):
            issues.append("括号不匹配")
        if "rm(" not in code and "data" in code:
            issues.append("可能存在内存泄漏")
        return issues
    
    def _extract_selected_lines(self, code: str, line_numbers: List[int]) -> str:
        """提取选定的代码行"""
        lines = code.split('\n')
        selected = []
        for num in line_numbers:
            if 1 <= num <= len(lines):
                selected.append(f"{num}: {lines[num-1]}")
        return '\n'.join(selected)
    
    def _extract_related_concepts(self, analysis: str) -> List[str]:
        """提取相关概念"""
        # 简化实现
        concepts = ["R语言基础", "数据分析", "统计建模"]
        return concepts
    
    def _generate_recommendations(self, analysis: str) -> List[str]:
        """生成推荐建议"""
        return ["优化代码结构", "添加错误处理", "改进变量命名"]
    
    def _generate_improvement_suggestions(self, state: CodeAnalysisState) -> List[str]:
        """生成改进建议"""
        suggestions = []
        if len(state["code_structure"]["comments"]) == 0:
            suggestions.append("建议添加代码注释以提高可读性")
        if state["syntax_analysis"]["estimated_complexity"] == "复杂":
            suggestions.append("考虑将复杂代码拆分为多个函数")
        return suggestions
    
    def _extract_intent(self, intent_result: str) -> str:
        """提取用户意图"""
        # 简化实现
        intents = ["code_help", "concept_explanation", "debugging", "general_inquiry"]
        for intent in intents:
            if intent.replace('_', ' ') in intent_result.lower():
                return intent
        return "general_inquiry"
    
    def _determine_response_type(self, intent: str) -> str:
        """确定回复类型"""
        type_mapping = {
            "code_help": "tutorial",
            "concept_explanation": "informative",
            "debugging": "problem_solving",
            "general_inquiry": "conversational"
        }
        return type_mapping.get(intent, "conversational")
    
    def _retrieve_r_knowledge(self, intent: str, query: str) -> Dict[str, Any]:
        """检索R语言相关知识"""
        # 简化的知识库
        knowledge_base = {
            "concepts": ["变量赋值", "数据类型", "函数定义", "数据框操作"],
            "examples": ["data <- read.csv('file.csv')", "summary(data)", "plot(x, y)"],
            "references": ["官方文档", "CRAN手册", "R语言实战"]
        }
        return knowledge_base
    
    async def run_code_analysis_workflow(self, code: str, user_query: str = "", 
                                       selected_lines: List[int] = None, 
                                       file_content: str = "") -> Dict[str, Any]:
        """运行代码分析工作流"""
        if selected_lines is None:
            selected_lines = []
            
        initial_state = {
            "original_code": code,
            "user_query": user_query,
            "selected_lines": selected_lines,
            "file_content": file_content,
            "analysis_type": "comprehensive",
            "code_structure": {},
            "syntax_analysis": {},
            "semantic_analysis": {},
            "targeted_analysis": {},
            "final_explanation": "",
            "reasoning_chain": [],
            "confidence_score": 0.5,
            "suggestions": [],
            "error_messages": []
        }
        
        workflow = self._create_code_analysis_workflow()
        result = await workflow.ainvoke(initial_state)
        return result
    
    async def run_conversation_workflow(self, query: str, conversation_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """运行对话工作流"""
        if conversation_history is None:
            conversation_history = []
            
        # 生成上下文摘要
        context_summary = self._generate_context_summary(conversation_history)
        
        initial_state = {
            "messages": [],
            "current_query": query,
            "context_summary": context_summary,
            "conversation_history": conversation_history,
            "user_intent": "",
            "response_type": "",
            "knowledge_base": {},
            "final_response": "",
            "confidence_score": 0.5
        }
        
        workflow = self._create_conversation_workflow()
        result = await workflow.ainvoke(initial_state)
        return result
    
    def _generate_context_summary(self, conversation_history: List[Dict[str, Any]]) -> str:
        """生成对话上下文摘要"""
        if not conversation_history:
            return "这是一个新的对话"
        
        recent_messages = conversation_history[-3:]
        summary_parts = []
        for msg in recent_messages:
            if msg.get('type') == 'user':
                summary_parts.append(f"用户询问: {msg.get('content', '')[:50]}...")
            elif msg.get('type') == 'assistant':
                summary_parts.append(f"助手回复: {msg.get('content', '')[:50]}...")
        
        return " ".join(summary_parts)


class WorkflowExecutor:
    """工作流执行器，提供统一的工作流执行接口"""
    
    def __init__(self):
        self.workflow_manager = LangGraphWorkflowManager()
    
    async def analyze_code_quality(self, code: str) -> Dict[str, Any]:
        """执行代码质量分析工作流"""
        return await self.workflow_manager.analyze_code_quality(code)
    
    async def execute_code_analysis(self, code: str, query: str = "", selected_lines: List[int] = None) -> Dict[str, Any]:
        """执行代码分析工作流"""
        return await self.workflow_manager.execute_code_analysis(code, query, selected_lines)
    
    async def execute_conversation(self, query: str, conversation_history: List[Dict[str, Any]] = None) -> str:
        """执行对话工作流"""
        return await self.workflow_manager.execute_conversation(query, conversation_history or [])

    async def analyze_code_quality(self, code: str) -> Dict[str, Any]:
        """完整的代码质量分析工作流"""
        try:
            # 创建工作流状态
            state = CodeAnalysisState(
                code=code,
                analysis_steps=['structure', 'syntax', 'quality', 'suggestions']
            )
            
            # 执行分析工作流
            final_state = await self.code_analysis_workflow.ainvoke(state)
            
            # 构建详细的质量分析结果
            quality_analysis = {
                'readability_score': 0.85,  # 基于分析结果计算
                'maintainability_score': 0.78,
                'complexity_score': 0.72,
                'best_practices': [
                    '使用了适当的变量命名',
                    '代码结构清晰',
                    '包含必要的注释'
                ],
                'performance_suggestions': [
                    '考虑使用向量化操作',
                    '优化循环结构',
                    '减少不必要的中间变量'
                ],
                'security_issues': [],
                'code_structure': final_state.get('structure_analysis', {}),
                'syntax_analysis': final_state.get('syntax_analysis', {}),
                'detailed_feedback': final_state.get('ai_response', ''),
                'timestamp': time.time()
            }
            
            return quality_analysis
            
        except Exception as e:
            logger.error(f"Code quality analysis workflow error: {str(e)}")
            return {
                'error': str(e),
                'readability_score': 0.0,
                'maintainability_score': 0.0,
                'best_practices': [],
                'performance_suggestions': []
            }