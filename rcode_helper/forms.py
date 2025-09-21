from django import forms


class LoginForm(forms.Form):
    """用户登录表单"""
    username = forms.CharField(
        label="用户名",
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '请输入用户名',
            'autocomplete': 'username'
        })
    )
    password = forms.CharField(
        label="密码",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '请输入密码',
            'autocomplete': 'current-password'
        })
    )


class HomeworkForm(forms.Form):
    """作业题输入表单 - 支持文本输入和文件上传"""
    input_method = forms.ChoiceField(
        choices=[
            ('text', '文本输入'),
            ('file', '文件上传')
        ],
        widget=forms.RadioSelect(attrs={
            'class': 'form-check-input',
            'onchange': 'toggleInputMethod()'
        }),
        label='输入方式',
        initial='text'
    )
    
    homework_question = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 5,
            'placeholder': '请输入您的R语言作业题，尽量描述清楚题目要求...',
            'maxlength': 2000,
            'id': 'homework_text_input'
        }),
        label='R语言作业题',
        help_text='请详细描述您的作业要求，包括数据处理、分析目标等信息',
        max_length=2000,
        required=False
    )
    
    homework_file = forms.FileField(
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': '.txt,.r,.R,.py,.md,.doc,.docx,.pdf',
            'id': 'homework_file_input',
            'style': 'display: none;'
        }),
        label='作业文件',
        help_text='支持的文件格式：.txt, .r, .R, .py, .md, .doc, .docx, .pdf（最大10MB）',
        required=False
    )
    
    def clean(self):
        cleaned_data = super().clean()
        input_method = cleaned_data.get('input_method')
        homework_question = cleaned_data.get('homework_question')
        homework_file = cleaned_data.get('homework_file')
        
        if input_method == 'text':
            if not homework_question or not homework_question.strip():
                raise forms.ValidationError('请输入作业题内容')
        elif input_method == 'file':
            if not homework_file:
                raise forms.ValidationError('请选择要上传的文件')
            
            # 检查文件大小（最大10MB）
            if homework_file.size > 10 * 1024 * 1024:
                raise forms.ValidationError('文件大小不能超过10MB')
            
            # 检查文件类型
            allowed_extensions = ['.txt', '.r', '.R', '.py', '.md', '.doc', '.docx', '.pdf']
            file_extension = homework_file.name.lower().split('.')[-1]
            if f'.{file_extension}' not in allowed_extensions:
                raise forms.ValidationError('不支持的文件格式')
        
        return cleaned_data


class CodeExplanationForm(forms.Form):
    """代码解释表单"""
    r_code = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control code-input',
            'rows': 10,
            'placeholder': '请粘贴您需要解释的R语言代码...',
            'maxlength': 5000,
            'style': 'font-family: monospace;',
            'id': 'r_code_input'
        }),
        label='R语言代码',
        help_text='请粘贴您想要理解的R语言代码，我会用通俗易懂的语言为您解释',
        max_length=5000
    )
    
    user_query = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': '您想了解这段代码的什么？（可选）例如：这段代码的核心逻辑是什么？为什么要这样写？某个函数是干什么的？',
            'maxlength': 500,
            'id': 'user_query_input'
        }),
        label='具体问题',
        help_text='描述您想了解的具体内容，这将帮助AI提供更精准的解答',
        max_length=500,
        required=False
    )
    
    selected_lines = forms.CharField(
        widget=forms.HiddenInput(attrs={
            'id': 'selected_lines_input'
        }),
        required=False
    )


class ChatForm(forms.Form):
    """普通聊天表单"""
    message = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': '有什么R语言或数据分析相关的问题想要聊聊吗？我很乐意为您解答...',
            'maxlength': 1000
        }),
        label='您想说什么',
        help_text='您可以问我任何关于R语言、数据分析、统计学的问题，或者只是想聊聊学习心得',
        max_length=1000
    )