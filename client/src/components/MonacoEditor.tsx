'use client';

import { customThemes, ThemeName } from '@/lib/monaco-themes';
import Editor, { OnMount } from '@monaco-editor/react';
import { Check, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
  showCopyButton?: boolean;
  theme?: ThemeName;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
];

export function MonacoEditor({
  value = '',
  onChange,
  language = 'javascript',
  height = '400px',
  readOnly = false,
  showLanguageSelector = true,
  showCopyButton = true,
  theme,
}: MonacoEditorProps) {
  const { theme: systemTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);

  const editorTheme = theme || (systemTheme === 'dark' ? 'vs-dark' : 'vs-light');

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Register custom themes
    Object.entries(customThemes).forEach(([themeName, themeData]) => {
      monaco.editor.defineTheme(themeName, themeData);
    });
    
    // Apply the current theme
    monaco.editor.setTheme(editorTheme);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
  };

  const hasToolbar = showLanguageSelector || showCopyButton;

  const editorComponent = (
    <>
      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            {showLanguageSelector && (
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!showLanguageSelector && (
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {selectedLanguage}
              </span>
            )}
          </div>

          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="relative h-full">
        <Editor
          height={height}
          language={selectedLanguage}
          value={value}
          onChange={onChange}
          theme={editorTheme}
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [],
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            fontLigatures: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        />
      </div>
    </>
  );

  return hasToolbar ? (
    <Card className="overflow-hidden h-full">
      {editorComponent}
    </Card>
  ) : (
    <div className="h-full w-full">
      {editorComponent}
    </div>
  );
}
