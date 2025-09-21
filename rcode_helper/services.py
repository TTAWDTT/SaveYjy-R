import json
import requests
import re
from django.conf import settings
from typing import List, Dict, Optional
from .prompts import PromptManager


class DeepSeekService:
    """DeepSeek Chat API服务类"""
    
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, prompt: str, request_type: str = 'chat') -> Optional[str]:
        """向DeepSeek API发送请求"""
        try:
            # 获取模型配置
            config = PromptManager.get_model_config(request_type)
            
            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": config["max_tokens"],
                "temperature": config["temperature"],
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('choices', [{}])[0].get('message', {}).get('content', '')
            else:
                print(f"API请求失败: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"API请求异常: {str(e)}")
            return None
    
    def generate_homework_solutions(self, homework_question: str) -> List[Dict[str, str]]:
        """为R语言作业题生成三种解决方案"""
        prompt = PromptManager.get_homework_prompt(homework_question)
        response = self._make_request(prompt, 'homework')
        
        if not response:
            return self._get_fallback_solutions()
        
        try:
            # 尝试从响应中提取JSON
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                return data.get('solutions', self._get_fallback_solutions())
            else:
                return self._parse_text_response(response)
        except json.JSONDecodeError:
            return self._parse_text_response(response)
    
    def explain_r_code(self, r_code: str) -> str:
        """解释R语言代码"""
        prompt = PromptManager.get_explanation_prompt(r_code)
        response = self._make_request(prompt, 'explanation')
        
        if not response:
            return PromptManager.get_system_prompts()["fallback_messages"]["explanation"]
        
        return response
    
    def explain_r_code_enhanced(self, r_code: str, user_query: str = '', selected_lines: List[int] = None) -> str:
        """增强的R语言代码解释，支持用户查询和行选择"""
        if selected_lines is None:
            selected_lines = []
        
        # 构建增强的prompt
        prompt_parts = []
        
        # 基础代码解释请求
        prompt_parts.append(f"请详细解释以下R语言代码：\n\n```r\n{r_code}\n```\n")
        
        # 如果用户有特定查询
        if user_query and user_query.strip():
            prompt_parts.append(f"\n用户特别想了解：{user_query.strip()}")
        
        # 如果用户选择了特定行
        if selected_lines:
            code_lines = r_code.split('\n')
            selected_code_parts = []
            
            for line_num in selected_lines:
                if 1 <= line_num <= len(code_lines):
                    selected_code_parts.append(f"第{line_num}行: {code_lines[line_num-1]}")
            
            if selected_code_parts:
                prompt_parts.append(f"\n请特别关注以下选中的代码行：\n" + "\n".join(selected_code_parts))
        
        # 添加解释要求
        prompt_parts.append("""
        
请按以下要求进行解释：
1. 首先概述代码的整体功能和目的
2. 逐行或逐段详细解释关键代码
3. 解释用到的R函数和语法
4. 如果有选中的特定行，请重点解释这些行的作用
5. 如果用户有特定问题，请针对性地回答
6. 提供实际应用场景和使用建议
7. 用通俗易懂的语言，避免过于技术化的表达

请用Markdown格式组织回答，使结构清晰易读。
        """)
        
        full_prompt = "".join(prompt_parts)
        response = self._make_request(full_prompt, 'explanation')
        
        if not response:
            return PromptManager.get_system_prompts()["fallback_messages"]["explanation"]
        
        return response
    
    def chat_with_user(self, user_message: str) -> str:
        """与用户进行普通聊天"""
        prompt = PromptManager.get_chat_prompt(user_message)
        response = self._make_request(prompt, 'chat')
        
        if not response:
            return PromptManager.get_system_prompts()["fallback_messages"]["chat"]
        
        return response
    
    def _get_fallback_solutions(self) -> List[Dict[str, str]]:
        """当API调用失败时的备用方案"""
        return [
            {
                "name": "基础方法",
                "code": "# 请提供具体的作业题目以获得详细的解决方案\n# 这里是示例代码结构\ndata <- data.frame()\nresult <- summary(data)",
                "description": "使用R语言基础函数解决问题的方法"
            },
            {
                "name": "进阶方法", 
                "code": "# 使用tidyverse包的解决方案\nlibrary(tidyverse)\n# 具体代码需要根据题目要求编写",
                "description": "使用现代R语言工具包的解决方法"
            },
            {
                "name": "可视化方法",
                "code": "# 结合数据可视化的解决方案\nlibrary(ggplot2)\n# 根据具体需求添加绘图代码",
                "description": "结合图表展示结果的综合方法"
            }
        ]
    
    def _parse_text_response(self, response: str) -> List[Dict[str, str]]:
        """解析非JSON格式的响应"""
        solutions = []
        
        # 尝试从文本中提取方案信息
        # 这里可以根据实际API响应格式进行调整
        lines = response.split('\n')
        current_solution = {"name": "", "code": "", "description": ""}
        
        for line in lines:
            if "方案" in line and ("一" in line or "二" in line or "三" in line or "1" in line or "2" in line or "3" in line):
                if current_solution["name"]:
                    solutions.append(current_solution.copy())
                current_solution = {"name": line.strip(), "code": "", "description": ""}
            elif line.strip().startswith("#") or line.strip().startswith("```"):
                current_solution["code"] += line + "\n"
            elif current_solution["name"] and not current_solution["description"]:
                current_solution["description"] += line + " "
        
        if current_solution["name"]:
            solutions.append(current_solution)
        
        # 如果解析失败，返回备用方案
        if len(solutions) < 3:
            return self._get_fallback_solutions()
        
        return solutions[:3]  # 只返回前三个方案