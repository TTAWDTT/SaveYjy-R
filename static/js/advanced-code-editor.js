/**
 * Advanced Code Editor - VSCode-style 代码编辑器
 * 解决行号匹配、符号显示等问题，并提供增强的编辑体验
 */

class AdvancedCodeEditor {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.options = {
            language: 'r',
            theme: 'vs-dark',
            lineNumbers: true,
            wordWrap: true,
            minimap: false,
            fontSize: 14,
            fontFamily: 'Monaco, "Cascadia Code", "SF Mono", Consolas, "Liberation Mono", Menlo, Courier, monospace',
            insertSpaces: true,
            tabSize: 2,
            detectIndentation: true,
            renderWhitespace: 'selection',
            renderControlCharacters: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'advanced',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: 'active', indentation: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: false, strings: false },
            ...options
        };
        
        this.editor = null;
        this.model = null;
        this.selectedLines = new Set();
        this.symbolMap = this.initializeSymbolMap();
        
        this.init();
    }
    
    initializeSymbolMap() {
        // R语言特殊符号映射表，解决符号显示问题
        return {
            // 赋值操作符
            '<-': '←',
            '->': '→',
            '<<-': '⟸',
            '->>': '⟹',
            
            // 逻辑操作符
            '<=': '≤',
            '>=': '≥',
            '!=': '≠',
            '==': '≡',
            '%in%': '∈',
            '%!in%': '∉',
            
            // 管道操作符
            '%>%': '▷',
            '|>': '▶',
            
            // 数学符号
            'Inf': '∞',
            '-Inf': '-∞',
            'pi': 'π',
            'alpha': 'α',
            'beta': 'β',
            'gamma': 'γ',
            'delta': 'δ',
            'epsilon': 'ε',
            'lambda': 'λ',
            'mu': 'μ',
            'sigma': 'σ',
            'theta': 'θ',
            
            // 统计符号
            'mean': 'x̄',
            'sum': '∑',
            'sqrt': '√',
            
            // 其他常用符号
            '...': '…',
            'NULL': '∅',
            'NA': '⊘',
            'NaN': '⌀'
        };
    }
    
    async init() {
        try {
            // 检查 Monaco Editor 是否可用
            if (typeof monaco === 'undefined') {
                await this.loadMonacoEditor();
            }
            
            this.setupContainer();
            this.createEditor();
            this.setupEventListeners();
            this.setupSymbolReplacement();
            this.setupLineSelection();
            this.setupErrorHandling();
            
        } catch (error) {
            console.warn('Monaco Editor 不可用，使用增强的 textarea 编辑器');
            this.createFallbackEditor();
        }
    }
    
    async loadMonacoEditor() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs/loader.js';
            script.onload = () => {
                require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' }});
                require(['vs/editor/editor.main'], resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupContainer() {
        this.container.innerHTML = '';
        this.container.className = 'advanced-code-editor';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            height: 400px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            overflow: hidden;
            background: #1e1e1e;
            font-family: ${this.options.fontFamily};
        `;
    }
    
    createEditor() {
        // 配置 R 语言支持
        monaco.languages.register({ id: 'r' });
        
        // 设置 R 语言语法高亮
        monaco.languages.setMonarchTokensProvider('r', this.getRSyntaxDefinition());
        
        // 设置自动补全
        monaco.languages.registerCompletionItemProvider('r', this.getRCompletionProvider());
        
        // 创建编辑器
        this.editor = monaco.editor.create(this.container, {
            value: '',
            language: 'r',
            theme: this.options.theme,
            fontSize: this.options.fontSize,
            fontFamily: this.options.fontFamily,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 10,
            lineHighlightBackground: 'rgba(255, 255, 255, 0.04)',
            renderLineHighlight: 'all',
            wordWrap: this.options.wordWrap ? 'on' : 'off',
            minimap: { enabled: this.options.minimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderWhitespace: this.options.renderWhitespace,
            renderControlCharacters: this.options.renderControlCharacters,
            formatOnPaste: this.options.formatOnPaste,
            formatOnType: this.options.formatOnType,
            autoIndent: this.options.autoIndent,
            bracketPairColorization: this.options.bracketPairColorization,
            guides: this.options.guides,
            suggestOnTriggerCharacters: this.options.suggestOnTriggerCharacters,
            quickSuggestions: this.options.quickSuggestions,
            tabSize: this.options.tabSize,
            insertSpaces: this.options.insertSpaces,
            detectIndentation: this.options.detectIndentation
        });
        
        this.model = this.editor.getModel();
    }
    
    createFallbackEditor() {
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'fallback-code-editor';
        fallbackContainer.innerHTML = `
            <div class="editor-toolbar">
                <div class="toolbar-left">
                    <button type="button" class="btn-tool" onclick="this.parentNode.parentNode.parentNode.querySelector('textarea').value = ''">
                        <i class="fas fa-trash"></i> 清空
                    </button>
                    <button type="button" class="btn-tool" onclick="this.toggleSymbolMode()" id="symbol-toggle">
                        <i class="fas fa-font"></i> 符号显示
                    </button>
                    <button type="button" class="btn-tool" onclick="this.formatCode()">
                        <i class="fas fa-indent"></i> 格式化
                    </button>
                </div>
                <div class="toolbar-right">
                    <span class="editor-info">R Language</span>
                </div>
            </div>
            <div class="editor-content">
                <div class="line-numbers-container">
                    <div class="line-numbers" id="line-numbers"></div>
                </div>
                <div class="code-input-container">
                    <textarea 
                        class="code-textarea" 
                        id="code-textarea"
                        spellcheck="false"
                        placeholder="在此粘贴您的R语言代码..."
                        data-gramm="false"
                    ></textarea>
                    <div class="symbol-overlay" id="symbol-overlay"></div>
                </div>
            </div>
            <div class="editor-status">
                <div class="status-left">
                    <span id="cursor-position">Ln 1, Col 1</span>
                    <span id="selection-info"></span>
                </div>
                <div class="status-right">
                    <span id="line-count">1 line</span>
                    <span id="encoding">UTF-8</span>
                </div>
            </div>
        `;
        
        this.container.appendChild(fallbackContainer);
        this.setupFallbackEditor();
    }
    
    setupFallbackEditor() {
        const textarea = this.container.querySelector('#code-textarea');
        const lineNumbers = this.container.querySelector('#line-numbers');
        const symbolOverlay = this.container.querySelector('#symbol-overlay');
        const cursorPosition = this.container.querySelector('#cursor-position');
        const selectionInfo = this.container.querySelector('#selection-info');
        const lineCount = this.container.querySelector('#line-count');
        
        let symbolMode = false;
        
        // 创建样式
        const style = document.createElement('style');
        style.textContent = `
            .fallback-code-editor {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #1e1e1e;
                color: #d4d4d4;
                font-family: ${this.options.fontFamily};
                border-radius: 8px;
                overflow: hidden;
            }
            
            .editor-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #2d2d30;
                border-bottom: 1px solid #3e3e42;
            }
            
            .toolbar-left, .toolbar-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-tool {
                background: none;
                border: 1px solid #464647;
                color: #cccccc;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .btn-tool:hover {
                background: #464647;
                border-color: #6c6c6c;
            }
            
            .editor-info {
                font-size: 12px;
                color: #cccccc;
                background: #0e639c;
                padding: 2px 8px;
                border-radius: 12px;
            }
            
            .editor-content {
                flex: 1;
                display: flex;
                position: relative;
                overflow: hidden;
            }
            
            .line-numbers-container {
                background: #1e1e1e;
                border-right: 1px solid #3e3e42;
                user-select: none;
                min-width: 50px;
            }
            
            .line-numbers {
                font-family: ${this.options.fontFamily};
                font-size: 14px;
                line-height: 20px;
                color: #858585;
                text-align: right;
                padding: 10px 8px;
                white-space: pre;
                position: relative;
            }
            
            .line-number {
                display: block;
                height: 20px;
                cursor: pointer;
                padding: 0 4px;
                border-radius: 2px;
                transition: all 0.2s ease;
            }
            
            .line-number:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            
            .line-number.selected {
                background: #094771;
                color: #ffffff;
            }
            
            .code-input-container {
                flex: 1;
                position: relative;
            }
            
            .code-textarea {
                width: 100%;
                height: 100%;
                background: transparent;
                border: none;
                outline: none;
                resize: none;
                font-family: ${this.options.fontFamily};
                font-size: 14px;
                line-height: 20px;
                color: #d4d4d4;
                padding: 10px;
                white-space: pre;
                overflow-wrap: normal;
                overflow-x: auto;
                z-index: 1;
                position: relative;
            }
            
            .symbol-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                font-family: ${this.options.fontFamily};
                font-size: 14px;
                line-height: 20px;
                color: #569cd6;
                padding: 10px;
                white-space: pre;
                z-index: 2;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .symbol-overlay.active {
                opacity: 1;
            }
            
            .editor-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 12px;
                background: #007acc;
                color: white;
                font-size: 12px;
            }
            
            .status-left, .status-right {
                display: flex;
                gap: 16px;
            }
            
            /* 语法高亮样式 */
            .syntax-keyword { color: #569cd6; }
            .syntax-string { color: #ce9178; }
            .syntax-number { color: #b5cea8; }
            .syntax-comment { color: #6a9955; font-style: italic; }
            .syntax-operator { color: #d4d4d4; }
            .syntax-function { color: #dcdcaa; }
            .syntax-variable { color: #9cdcfe; }
        `;
        document.head.appendChild(style);
        
        // 更新行号
        function updateLineNumbers() {
            const lines = textarea.value.split('\n');
            const lineNumbersHtml = lines.map((_, index) => {
                const lineNum = index + 1;
                const isSelected = this.selectedLines?.has(lineNum);
                return `<span class="line-number ${isSelected ? 'selected' : ''}" data-line="${lineNum}">${lineNum}</span>`;
            }).join('\n');
            lineNumbers.innerHTML = lineNumbersHtml;
            
            // 更新状态栏
            lineCount.textContent = `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`;
        }
        
        // 更新光标位置
        function updateCursorPosition() {
            const selectionStart = textarea.selectionStart;
            const selectionEnd = textarea.selectionEnd;
            const text = textarea.value;
            
            const beforeCursor = text.substring(0, selectionStart);
            const lines = beforeCursor.split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            
            cursorPosition.textContent = `Ln ${line}, Col ${column}`;
            
            if (selectionStart !== selectionEnd) {
                const selectedText = text.substring(selectionStart, selectionEnd);
                const selectedLines = selectedText.split('\n').length;
                const selectedChars = selectedText.length;
                selectionInfo.textContent = `(${selectedChars} selected)`;
            } else {
                selectionInfo.textContent = '';
            }
        }
        
        // 符号替换
        function updateSymbolOverlay() {
            if (!symbolMode) {
                symbolOverlay.classList.remove('active');
                return;
            }
            
            let content = textarea.value;
            for (const [original, replacement] of Object.entries(this.symbolMap)) {
                content = content.replace(new RegExp(escapeRegex(original), 'g'), replacement);
            }
            symbolOverlay.textContent = content;
            symbolOverlay.classList.add('active');
        }
        
        function escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        // 事件监听
        textarea.addEventListener('input', () => {
            updateLineNumbers.call(this);
            updateCursorPosition();
            updateSymbolOverlay.call(this);
        });
        
        textarea.addEventListener('selectionchange', updateCursorPosition);
        textarea.addEventListener('keyup', updateCursorPosition);
        textarea.addEventListener('mouseup', updateCursorPosition);
        
        // 行号点击
        lineNumbers.addEventListener('click', (e) => {
            if (e.target.classList.contains('line-number')) {
                const lineNum = parseInt(e.target.dataset.line);
                this.toggleLineSelection(lineNum);
                updateLineNumbers.call(this);
            }
        });
        
        // 滚动同步
        textarea.addEventListener('scroll', () => {
            lineNumbers.scrollTop = textarea.scrollTop;
        });
        
        // 工具栏功能
        this.container.querySelector('#symbol-toggle').onclick = () => {
            symbolMode = !symbolMode;
            const btn = this.container.querySelector('#symbol-toggle');
            btn.classList.toggle('active', symbolMode);
            updateSymbolOverlay.call(this);
        };
        
        // 初始化
        updateLineNumbers.call(this);
        updateCursorPosition();
        
        // 保存引用
        this.textarea = textarea;
        this.updateLineNumbers = updateLineNumbers.bind(this);
        this.updateSymbolOverlay = updateSymbolOverlay.bind(this);
    }
    
    getRSyntaxDefinition() {
        return {
            tokenizer: {
                root: [
                    // 注释
                    [/#.*$/, 'comment'],
                    
                    // 字符串
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/'/, 'string', '@string_single'],
                    
                    // 数字
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+[eE][\-+]?\d+/, 'number.float'],
                    [/\d+/, 'number'],
                    
                    // 关键字
                    [/\b(if|else|for|while|function|return|TRUE|FALSE|NULL|NA|NaN|Inf)\b/, 'keyword'],
                    
                    // 操作符
                    [/(<-|->|<<-|->>|%>%|%in%|%!in%|==|!=|<=|>=|&&|\|\|)/, 'operator'],
                    
                    // 函数名
                    [/[a-zA-Z_][a-zA-Z0-9_.]*(?=\s*\()/, 'entity.name.function'],
                    
                    // 变量名
                    [/[a-zA-Z_][a-zA-Z0-9_.]*/, 'variable'],
                    
                    // 分隔符
                    [/[{}()\[\]]/, '@brackets'],
                    [/[;,.]/, 'delimiter'],
                ],
                
                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ],
                
                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/'/, 'string', '@pop']
                ]
            }
        };
    }
    
    getRCompletionProvider() {
        const rKeywords = [
            'if', 'else', 'for', 'while', 'function', 'return', 'TRUE', 'FALSE', 
            'NULL', 'NA', 'NaN', 'Inf', 'library', 'require', 'data.frame',
            'list', 'vector', 'matrix', 'array', 'factor', 'character', 'numeric',
            'logical', 'integer', 'double', 'complex', 'raw'
        ];
        
        const rFunctions = [
            'abs', 'acos', 'asin', 'atan', 'ceiling', 'cos', 'exp', 'floor',
            'log', 'max', 'min', 'round', 'sin', 'sqrt', 'tan', 'mean', 'median',
            'sum', 'length', 'nrow', 'ncol', 'dim', 'names', 'colnames', 'rownames',
            'head', 'tail', 'summary', 'str', 'class', 'typeof', 'is.na', 'is.null',
            'paste', 'paste0', 'cat', 'print', 'sprintf', 'substr', 'nchar',
            'read.csv', 'write.csv', 'read.table', 'write.table'
        ];
        
        return {
            provideCompletionItems: (model, position) => {
                const suggestions = [];
                
                // 关键字建议
                rKeywords.forEach(keyword => {
                    suggestions.push({
                        label: keyword,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: keyword
                    });
                });
                
                // 函数建议
                rFunctions.forEach(func => {
                    suggestions.push({
                        label: func,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: func + '()',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                    });
                });
                
                return { suggestions };
            }
        };
    }
    
    setupEventListeners() {
        if (!this.editor) return;
        
        // 内容变化监听
        this.model.onDidChangeContent(() => {
            this.onContentChange();
        });
        
        // 选择变化监听
        this.editor.onDidChangeCursorSelection(() => {
            this.onSelectionChange();
        });
        
        // 键盘快捷键
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
            this.formatCode();
        });
        
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
            this.duplicateLine();
        });
    }
    
    setupSymbolReplacement() {
        // 实时符号替换 (可选功能)
        if (this.options.enableSymbolReplacement) {
            this.model.onDidChangeContent(() => {
                this.replaceSymbols();
            });
        }
    }
    
    setupLineSelection() {
        if (!this.editor) return;
        
        // 行号点击选择
        this.editor.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
                const lineNumber = e.target.position.lineNumber;
                this.toggleLineSelection(lineNumber);
            }
        });
    }
    
    setupErrorHandling() {
        // 语法错误检查
        this.model.onDidChangeContent(() => {
            this.checkSyntaxErrors();
        });
    }
    
    onContentChange() {
        // 触发自定义事件
        this.container.dispatchEvent(new CustomEvent('contentChange', {
            detail: { content: this.getValue() }
        }));
    }
    
    onSelectionChange() {
        // 触发选择变化事件
        const selection = this.editor?.getSelection();
        this.container.dispatchEvent(new CustomEvent('selectionChange', {
            detail: { selection }
        }));
    }
    
    toggleLineSelection(lineNumber) {
        if (this.selectedLines.has(lineNumber)) {
            this.selectedLines.delete(lineNumber);
        } else {
            this.selectedLines.add(lineNumber);
        }
        
        this.updateLineHighlights();
        this.onSelectionChange();
    }
    
    updateLineHighlights() {
        if (!this.editor) return;
        
        const decorations = Array.from(this.selectedLines).map(lineNumber => ({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'selected-line-highlight',
                marginClassName: 'selected-line-margin'
            }
        }));
        
        this.editor.deltaDecorations([], decorations);
    }
    
    formatCode() {
        if (this.editor) {
            this.editor.getAction('editor.action.formatDocument').run();
        } else if (this.textarea) {
            // 简单的格式化逻辑
            const content = this.textarea.value;
            const formatted = this.simpleFormatR(content);
            this.textarea.value = formatted;
            this.updateLineNumbers();
        }
    }
    
    simpleFormatR(code) {
        // 简单的R代码格式化
        return code
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
    
    duplicateLine() {
        if (!this.editor) return;
        
        const position = this.editor.getPosition();
        const lineContent = this.model.getLineContent(position.lineNumber);
        
        this.editor.executeEdits('duplicate-line', [{
            range: new monaco.Range(position.lineNumber, this.model.getLineMaxColumn(position.lineNumber), position.lineNumber, this.model.getLineMaxColumn(position.lineNumber)),
            text: '\n' + lineContent
        }]);
    }
    
    replaceSymbols() {
        if (!this.editor) return;
        
        const content = this.model.getValue();
        let newContent = content;
        
        for (const [original, replacement] of Object.entries(this.symbolMap)) {
            newContent = newContent.replace(new RegExp(escapeRegex(original), 'g'), replacement);
        }
        
        if (newContent !== content) {
            this.model.setValue(newContent);
        }
    }
    
    checkSyntaxErrors() {
        // R语法检查 (简化版)
        const content = this.getValue();
        const errors = this.validateRSyntax(content);
        
        if (this.editor && errors.length > 0) {
            const markers = errors.map(error => ({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: error.line,
                startColumn: error.column,
                endLineNumber: error.line,
                endColumn: error.column + error.length,
                message: error.message
            }));
            
            monaco.editor.setModelMarkers(this.model, 'r-syntax', markers);
        }
    }
    
    validateRSyntax(code) {
        const errors = [];
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
            // 简单的语法检查
            const brackets = this.checkBrackets(line);
            if (brackets.error) {
                errors.push({
                    line: index + 1,
                    column: brackets.position,
                    length: 1,
                    message: brackets.message
                });
            }
        });
        
        return errors;
    }
    
    checkBrackets(line) {
        const stack = [];
        const pairs = { '(': ')', '[': ']', '{': '}' };
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if ('([{'.includes(char)) {
                stack.push({ char, pos: i });
            } else if (')]}'.includes(char)) {
                if (stack.length === 0) {
                    return { error: true, position: i, message: 'Unexpected closing bracket' };
                }
                const last = stack.pop();
                if (pairs[last.char] !== char) {
                    return { error: true, position: i, message: 'Mismatched brackets' };
                }
            }
        }
        
        if (stack.length > 0) {
            return { error: true, position: stack[0].pos, message: 'Unclosed bracket' };
        }
        
        return { error: false };
    }
    
    // 公共接口方法
    getValue() {
        if (this.editor) {
            return this.model.getValue();
        } else if (this.textarea) {
            return this.textarea.value;
        }
        return '';
    }
    
    setValue(value) {
        if (this.editor) {
            this.model.setValue(value);
        } else if (this.textarea) {
            this.textarea.value = value;
            this.updateLineNumbers();
            this.updateSymbolOverlay();
        }
    }
    
    getSelectedLines() {
        return Array.from(this.selectedLines);
    }
    
    clearSelection() {
        this.selectedLines.clear();
        if (this.editor) {
            this.updateLineHighlights();
        } else if (this.updateLineNumbers) {
            this.updateLineNumbers();
        }
    }
    
    focus() {
        if (this.editor) {
            this.editor.focus();
        } else if (this.textarea) {
            this.textarea.focus();
        }
    }
    
    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}

// 工具函数
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 导出
window.AdvancedCodeEditor = AdvancedCodeEditor;