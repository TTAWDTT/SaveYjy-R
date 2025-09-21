"""
文件处理工具模块
支持多种文件格式的内容提取和处理
"""

import os
import re
import tempfile
from typing import Tuple, Optional
from django.core.files.uploadedfile import UploadedFile

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class FileProcessor:
    """文件处理器类"""
    
    # 支持的文件格式
    SUPPORTED_EXTENSIONS = {
        '.txt': 'text',
        '.r': 'text',
        '.R': 'text',
        '.py': 'text',
        '.md': 'text',
        '.doc': 'document',
        '.docx': 'document',
        '.pdf': 'pdf'
    }
    
    # 最大文件大小（10MB）
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    @classmethod
    def process_file(cls, uploaded_file: UploadedFile) -> Tuple[bool, str]:
        """
        处理上传的文件，提取内容
        
        Args:
            uploaded_file: Django上传的文件对象
            
        Returns:
            Tuple[bool, str]: (是否成功, 提取的内容或错误信息)
        """
        try:
            # 检查文件大小
            if uploaded_file.size > cls.MAX_FILE_SIZE:
                return False, f"文件大小超过限制（最大{cls.MAX_FILE_SIZE // (1024*1024)}MB）"
            
            # 获取文件扩展名
            file_name = uploaded_file.name.lower()
            file_extension = '.' + file_name.split('.')[-1] if '.' in file_name else ''
            
            if file_extension not in cls.SUPPORTED_EXTENSIONS:
                return False, f"不支持的文件格式：{file_extension}"
            
            # 根据文件类型选择处理方法
            file_type = cls.SUPPORTED_EXTENSIONS[file_extension]
            
            if file_type == 'text':
                return cls._process_text_file(uploaded_file)
            elif file_type == 'document':
                return cls._process_document_file(uploaded_file, file_extension)
            elif file_type == 'pdf':
                return cls._process_pdf_file(uploaded_file)
            else:
                return False, f"未知的文件类型：{file_type}"
                
        except Exception as e:
            return False, f"文件处理出错：{str(e)}"
    
    @classmethod
    def _process_text_file(cls, uploaded_file: UploadedFile) -> Tuple[bool, str]:
        """处理纯文本文件"""
        try:
            # 尝试多种编码格式
            encodings = ['utf-8', 'gbk', 'gb2312', 'latin-1']
            
            for encoding in encodings:
                try:
                    content = uploaded_file.read().decode(encoding)
                    uploaded_file.seek(0)  # 重置文件指针
                    
                    # 清理内容
                    content = cls._clean_text_content(content)
                    
                    if content.strip():
                        return True, content
                    else:
                        return False, "文件内容为空"
                        
                except UnicodeDecodeError:
                    continue
            
            return False, "无法解码文件内容，请检查文件编码格式"
            
        except Exception as e:
            return False, f"读取文本文件出错：{str(e)}"
    
    @classmethod
    def _process_document_file(cls, uploaded_file: UploadedFile, file_extension: str) -> Tuple[bool, str]:
        """处理Word文档文件"""
        if not DOCX_AVAILABLE:
            return False, "系统不支持Word文档处理，请安装python-docx库"
        
        try:
            if file_extension == '.docx':
                # 处理docx文件
                with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_file.flush()
                    
                    doc = docx.Document(temp_file.name)
                    content = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
                    
                    # 清理临时文件
                    os.unlink(temp_file.name)
                    
                    content = cls._clean_text_content(content)
                    
                    if content.strip():
                        return True, content
                    else:
                        return False, "文档内容为空"
            else:
                return False, f"暂不支持{file_extension}格式，请转换为.docx格式"
                
        except Exception as e:
            return False, f"读取Word文档出错：{str(e)}"
    
    @classmethod
    def _process_pdf_file(cls, uploaded_file: UploadedFile) -> Tuple[bool, str]:
        """处理PDF文件"""
        if not PYPDF2_AVAILABLE:
            return False, "系统不支持PDF处理，请安装PyPDF2库"
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file.flush()
                
                with open(temp_file.name, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    content = ''
                    
                    for page in pdf_reader.pages:
                        content += page.extract_text() + '\n'
                
                # 清理临时文件
                os.unlink(temp_file.name)
                
                content = cls._clean_text_content(content)
                
                if content.strip():
                    return True, content
                else:
                    return False, "PDF内容为空或无法提取文本"
                    
        except Exception as e:
            return False, f"读取PDF文件出错：{str(e)}"
    
    @classmethod
    def _clean_text_content(cls, content: str) -> str:
        """清理文本内容"""
        if not content:
            return ""
        
        # 移除多余的空白字符
        content = re.sub(r'\r\n', '\n', content)
        content = re.sub(r'\r', '\n', content)
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'[ \t]{2,}', ' ', content)
        
        # 移除首尾空白
        content = content.strip()
        
        # 限制最大长度
        max_length = 5000
        if len(content) > max_length:
            content = content[:max_length] + '\n\n...(内容过长，已截取前5000字符)'
        
        return content
    
    @classmethod
    def get_file_info(cls, uploaded_file: UploadedFile) -> dict:
        """获取文件基本信息"""
        file_extension = '.' + uploaded_file.name.lower().split('.')[-1] if '.' in uploaded_file.name else ''
        
        return {
            'name': uploaded_file.name,
            'size': uploaded_file.size,
            'size_mb': round(uploaded_file.size / (1024 * 1024), 2),
            'extension': file_extension,
            'content_type': uploaded_file.content_type,
            'is_supported': file_extension in cls.SUPPORTED_EXTENSIONS
        }


def format_file_content_for_ai(content: str, file_name: str) -> str:
    """
    为AI处理格式化文件内容
    
    Args:
        content: 文件内容
        file_name: 文件名
        
    Returns:
        格式化后的内容字符串
    """
    formatted_content = f"""
=== 文件名：{file_name} ===

{content}

=== 以上是从文件中提取的内容，请根据这些内容来解答作业问题 ===
"""
    return formatted_content.strip()