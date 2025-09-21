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
    """作业题输入表单"""
    homework_question = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 5,
            'placeholder': '请输入您的R语言作业题，尽量描述清楚题目要求...',
            'maxlength': 2000
        }),
        label='R语言作业题',
        help_text='请详细描述您的作业要求，包括数据处理、分析目标等信息',
        max_length=2000
    )


class CodeExplanationForm(forms.Form):
    """代码解释表单"""
    r_code = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control code-input',
            'rows': 10,
            'placeholder': '请粘贴您需要解释的R语言代码...',
            'maxlength': 5000,
            'style': 'font-family: monospace;'
        }),
        label='R语言代码',
        help_text='请粘贴您想要理解的R语言代码，我会用通俗易懂的语言为您解释',
        max_length=5000
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