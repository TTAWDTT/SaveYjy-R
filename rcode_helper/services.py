import json
import requests
import re
from django.conf import settings
from typing import List, Dict, Optional


class DeepSeekService:
    """DeepSeek Chat API服务类"""
    
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, prompt: str, max_tokens: int = 4000) -> Optional[str]:
        """向DeepSeek API发送请求"""
        try:
            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": 0.7,
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
        prompt = f"""
你是一位专业的R语言教师，请为以下作业题提供三种不同的R语言解决方案。

作业题目：{homework_question}

请按照以下格式返回，每种方案都要包含：
1. 方案名称（简洁明了，体现解决思路）
2. 完整的R语言代码（包含详细的中文注释）
3. 方法说明（解释这种方法的特点和适用场景）

请严格按照以下JSON格式返回：
{{
    "solutions": [
        {{
            "name": "方案一名称",
            "code": "# 这里是带中文注释的R代码\\n# 注释要详细解释每一步\\ndata <- read.csv('file.csv')\\n# 更多代码...",
            "description": "这种方法的特点和说明"
        }},
        {{
            "name": "方案二名称", 
            "code": "# 第二种方法的R代码\\n# 详细注释...",
            "description": "第二种方法的说明"
        }},
        {{
            "name": "方案三名称",
            "code": "# 第三种方法的R代码\\n# 详细注释...",
            "description": "第三种方法的说明"
        }}
    ]
}}

要求：
1. 三种方案要体现不同的解决思路或使用不同的R包/函数
2. 代码注释必须用中文，要详细解释每一步的作用
3. 确保代码的正确性和实用性
4. 方案名称要简洁有意义，体现各自特点
"""
        
        response = self._make_request(prompt, max_tokens=3000)
        
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
        prompt = f"""
你是一位亲切的R语言老师，请用平易近人、形象具体的语气来解释以下R语言代码。

R代码：
```r
{r_code}
```

请按照以下要求解释：
1. 用通俗易懂的语言，就像对朋友讲解一样
2. 逐步分析代码的功能和作用
3. 对于复杂的概念，用生活中的比喻来说明
4. 指出代码中的关键部分和注意事项
5. 如果代码有问题，友好地指出并给出建议

请用温暖、耐心的语气，让初学者也能理解。
"""
        
        response = self._make_request(prompt, max_tokens=2000)
        
        if not response:
            return "抱歉，暂时无法为您解释这段代码。请稍后再试或检查您的代码格式。"
        
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