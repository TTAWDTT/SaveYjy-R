"""
智能问答系统
基于LangGraph的高级问答工作流
"""
import json
import asyncio
import time
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from .enhanced_services import enhanced_ai_service
from .services import DeepSeekService
from .prompts import PromptManager


class IntelligentQAState(TypedDict):
    """智能问答状态"""
    original_query: str
    query_type: str
    context_requirements: List[str]
    knowledge_retrieval_results: Dict[str, Any]
    reasoning_steps: List[str]
    sub_questions: List[str]
    partial_answers: List[Dict[str, Any]]
    synthesized_answer: str
    confidence_score: float
    sources: List[str]
    follow_up_questions: List[str]
    complexity_level: str
    processing_time: float


class IntelligentQASystem:
    """智能问答系统"""
    
    def __init__(self):
        self.deepseek_service = DeepSeekService()
        self.prompt_manager = PromptManager()
    
    def _create_qa_workflow(self) -> StateGraph:
        """创建问答工作流"""
        
        def analyze_query_complexity(state: IntelligentQAState) -> IntelligentQAState:
            """分析查询复杂度"""
            query = state["original_query"]
            
            # 检测查询复杂度的关键词
            complexity_indicators = {
                "简单": ["什么是", "如何", "为什么", "解释"],
                "中等": ["比较", "分析", "评估", "讨论", "实现"],
                "复杂": ["设计", "优化", "深入分析", "全面评估", "架构"]
            }
            
            complexity = "简单"
            for level, indicators in complexity_indicators.items():
                if any(indicator in query for indicator in indicators):
                    complexity = level
            
            state["complexity_level"] = complexity
            state["reasoning_steps"].append(f"查询复杂度分析: {complexity}")
            
            return state
        
        def determine_query_type(state: IntelligentQAState) -> IntelligentQAState:
            """确定查询类型"""
            query = state["original_query"]
            
            query_types = {
                "概念解释": ["什么是", "定义", "概念", "解释"],
                "操作指导": ["如何", "怎么", "步骤", "方法"],
                "问题解决": ["错误", "问题", "调试", "解决"],
                "代码分析": ["代码", "函数", "算法", "语法"],
                "最佳实践": ["最佳", "推荐", "建议", "优化"],
                "比较分析": ["比较", "差异", "区别", "对比"]
            }
            
            detected_type = "通用查询"
            for qtype, keywords in query_types.items():
                if any(keyword in query for keyword in keywords):
                    detected_type = qtype
                    break
            
            state["query_type"] = detected_type
            state["reasoning_steps"].append(f"查询类型确定: {detected_type}")
            
            return state
        
        def decompose_complex_query(state: IntelligentQAState) -> IntelligentQAState:
            """分解复杂查询"""
            if state["complexity_level"] in ["中等", "复杂"]:
                decomposition_prompt = f"""
分解以下复杂查询为多个子问题：

原始查询: {state["original_query"]}
查询类型: {state["query_type"]}

请将查询分解为3-5个具体的子问题，每个子问题应该：
1. 相对独立
2. 可以具体回答
3. 有助于回答原始问题

返回JSON格式的子问题列表。
"""
                
                try:
                    decomposition_result = self.deepseek_service._make_request(
                        decomposition_prompt, "analysis"
                    )
                    
                    # 尝试解析JSON，如果失败则使用简单分割
                    try:
                        sub_questions = json.loads(decomposition_result).get("sub_questions", [])
                    except:
                        # 简单的文本分割方法
                        sub_questions = [q.strip() for q in decomposition_result.split('\n') if q.strip()]
                    
                    state["sub_questions"] = sub_questions[:5]  # 最多5个子问题
                    state["reasoning_steps"].append(f"查询分解完成，生成{len(sub_questions)}个子问题")
                    
                except Exception as e:
                    state["sub_questions"] = [state["original_query"]]
                    state["reasoning_steps"].append(f"查询分解失败，使用原始查询: {str(e)}")
            else:
                state["sub_questions"] = [state["original_query"]]
                state["reasoning_steps"].append("简单查询，无需分解")
            
            return state
        
        def retrieve_knowledge(state: IntelligentQAState) -> IntelligentQAState:
            """检索相关知识"""
            try:
                # R语言知识库
                r_knowledge_base = {
                    "基础概念": {
                        "数据类型": ["numeric", "character", "logical", "factor"],
                        "数据结构": ["vector", "matrix", "data.frame", "list"],
                        "基本操作": ["赋值", "索引", "函数调用", "包加载"]
                    },
                    "高级功能": {
                        "数据处理": ["dplyr", "tidyr", "data.table"],
                        "可视化": ["ggplot2", "plotly", "lattice"],
                        "统计分析": ["回归分析", "假设检验", "方差分析"],
                        "机器学习": ["caret", "randomForest", "e1071"]
                    },
                    "最佳实践": {
                        "代码风格": ["变量命名", "注释规范", "函数设计"],
                        "性能优化": ["向量化", "内存管理", "并行计算"],
                        "错误处理": ["异常捕获", "输入验证", "调试技巧"]
                    }
                }
                
                # 根据查询类型和内容检索相关知识
                relevant_knowledge = {}
                query_lower = state["original_query"].lower()
                
                for category, subcategories in r_knowledge_base.items():
                    for subcategory, items in subcategories.items():
                        if any(item.lower() in query_lower for item in items):
                            if category not in relevant_knowledge:
                                relevant_knowledge[category] = {}
                            relevant_knowledge[category][subcategory] = items
                
                state["knowledge_retrieval_results"] = relevant_knowledge
                state["reasoning_steps"].append(f"知识检索完成，找到{len(relevant_knowledge)}个相关类别")
                
            except Exception as e:
                state["knowledge_retrieval_results"] = {}
                state["reasoning_steps"].append(f"知识检索失败: {str(e)}")
            
            return state
        
        def answer_sub_questions(state: IntelligentQAState) -> IntelligentQAState:
            """回答子问题"""
            partial_answers = []
            
            for i, sub_question in enumerate(state["sub_questions"]):
                try:
                    answer_prompt = f"""
基于以下信息回答子问题：

子问题: {sub_question}
相关知识: {json.dumps(state["knowledge_retrieval_results"], ensure_ascii=False)}
查询类型: {state["query_type"]}

请提供详细、准确的回答。
"""
                    
                    answer = self.deepseek_service._make_request(answer_prompt, "explanation")
                    
                    partial_answers.append({
                        "question": sub_question,
                        "answer": answer,
                        "confidence": 0.8,
                        "sources": ["R官方文档", "专业知识库"]
                    })
                    
                    state["reasoning_steps"].append(f"子问题{i+1}回答完成")
                    
                except Exception as e:
                    partial_answers.append({
                        "question": sub_question,
                        "answer": f"回答生成失败: {str(e)}",
                        "confidence": 0.1,
                        "sources": []
                    })
            
            state["partial_answers"] = partial_answers
            return state
        
        def synthesize_final_answer(state: IntelligentQAState) -> IntelligentQAState:
            """综合最终答案"""
            try:
                synthesis_prompt = f"""
基于以下信息，为原始查询提供综合性的最终答案：

原始查询: {state["original_query"]}
查询类型: {state["query_type"]}
复杂度: {state["complexity_level"]}

子问题及答案:
{json.dumps(state["partial_answers"], ensure_ascii=False, indent=2)}

检索到的知识:
{json.dumps(state["knowledge_retrieval_results"], ensure_ascii=False, indent=2)}

请提供一个完整、连贯、准确的最终答案，包括：
1. 直接回答原始问题
2. 提供相关背景信息
3. 给出实用建议或示例
4. 总结关键点
"""
                
                final_answer = self.deepseek_service._make_request(synthesis_prompt, "explanation")
                
                # 计算综合置信度
                partial_confidences = [pa["confidence"] for pa in state["partial_answers"]]
                avg_confidence = sum(partial_confidences) / len(partial_confidences) if partial_confidences else 0.5
                
                state["synthesized_answer"] = final_answer
                state["confidence_score"] = avg_confidence
                state["sources"] = ["R官方文档", "专业教程", "最佳实践指南"]
                
                # 生成后续问题
                follow_up_questions = self._generate_follow_up_questions(
                    state["original_query"], 
                    state["query_type"]
                )
                state["follow_up_questions"] = follow_up_questions
                
                state["reasoning_steps"].append("最终答案综合完成")
                
            except Exception as e:
                state["synthesized_answer"] = f"答案综合失败: {str(e)}"
                state["confidence_score"] = 0.2
                state["sources"] = []
                state["follow_up_questions"] = []
            
            return state
        
        # 构建工作流
        workflow = StateGraph(IntelligentQAState)
        
        workflow.add_node("analyze_complexity", analyze_query_complexity)
        workflow.add_node("determine_type", determine_query_type)
        workflow.add_node("decompose_query", decompose_complex_query)
        workflow.add_node("retrieve_knowledge", retrieve_knowledge)
        workflow.add_node("answer_subquestions", answer_sub_questions)
        workflow.add_node("synthesize_answer", synthesize_final_answer)
        
        workflow.set_entry_point("analyze_complexity")
        workflow.add_edge("analyze_complexity", "determine_type")
        workflow.add_edge("determine_type", "decompose_query")
        workflow.add_edge("decompose_query", "retrieve_knowledge")
        workflow.add_edge("retrieve_knowledge", "answer_subquestions")
        workflow.add_edge("answer_subquestions", "synthesize_answer")
        workflow.add_edge("synthesize_answer", END)
        
        return workflow.compile()
    
    def _generate_follow_up_questions(self, original_query: str, query_type: str) -> List[str]:
        """生成后续问题"""
        follow_up_templates = {
            "概念解释": [
                f"如何在实际项目中应用{original_query}？",
                f"与{original_query}相关的常见错误有哪些？",
                f"有没有更高级的{original_query}用法？"
            ],
            "操作指导": [
                f"执行{original_query}时可能遇到什么问题？",
                f"有没有{original_query}的替代方法？",
                f"如何优化{original_query}的性能？"
            ],
            "问题解决": [
                f"如何预防类似的问题？",
                f"这个问题的根本原因是什么？",
                f"有没有自动化解决方案？"
            ]
        }
        
        return follow_up_templates.get(query_type, [
            "这个主题还有什么需要了解的？",
            "如何深入学习相关知识？",
            "有什么实际应用案例？"
        ])[:3]
    
    async def process_intelligent_query(self, query: str) -> Dict[str, Any]:
        """处理智能查询"""
        start_time = time.time()
        
        initial_state = {
            "original_query": query,
            "query_type": "",
            "context_requirements": [],
            "knowledge_retrieval_results": {},
            "reasoning_steps": [],
            "sub_questions": [],
            "partial_answers": [],
            "synthesized_answer": "",
            "confidence_score": 0.0,
            "sources": [],
            "follow_up_questions": [],
            "complexity_level": "",
            "processing_time": 0.0
        }
        
        try:
            workflow = self._create_qa_workflow()
            result = await workflow.ainvoke(initial_state)
            result["processing_time"] = time.time() - start_time
            
            return result
            
        except Exception as e:
            return {
                "original_query": query,
                "synthesized_answer": f"智能问答处理失败: {str(e)}",
                "confidence_score": 0.1,
                "processing_time": time.time() - start_time,
                "error": str(e)
            }


# 创建全局实例
intelligent_qa_system = IntelligentQASystem()