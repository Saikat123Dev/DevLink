// Monaco Editor Custom Themes
import type monaco from 'monaco-editor';

export const customThemes: Record<string, monaco.editor.IStandaloneThemeData> = {
  'monokai': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'type', foreground: '66d9ef' },
      { token: 'class', foreground: 'a6e22e' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ae81ff' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editor.selectionBackground': '#49483e',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#3b3a32',
    },
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'class', foreground: '7ee787' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'ffa657' },
      { token: 'constant', foreground: '79c0ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#58a6ff',
      'editorWhitespace.foreground': '#484f58',
    },
  },
  'solarized-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586e75' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'keyword', foreground: '859900' },
      { token: 'type', foreground: 'b58900' },
      { token: 'class', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
      { token: 'variable', foreground: '268bd2' },
      { token: 'constant', foreground: 'd33682' },
    ],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#073642',
      'editor.selectionBackground': '#073642',
      'editorCursor.foreground': '#839496',
      'editorWhitespace.foreground': '#073642',
    },
  },
  'dracula': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'class', foreground: '50fa7b' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'bd93f9' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#44475a',
    },
  },
  'nord': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '616e88' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'class', foreground: '88c0d0' },
      { token: 'function', foreground: '88c0d0' },
      { token: 'variable', foreground: 'd8dee9' },
      { token: 'constant', foreground: 'b48ead' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editor.lineHighlightBackground': '#3b4252',
      'editor.selectionBackground': '#434c5e',
      'editorCursor.foreground': '#d8dee9',
      'editorWhitespace.foreground': '#434c5e',
    },
  },
  'one-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'class', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' },
      { token: 'constant', foreground: 'd19a66' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313c',
      'editor.selectionBackground': '#3e4451',
      'editorCursor.foreground': '#528bff',
      'editorWhitespace.foreground': '#3e4451',
    },
  },
  'night-owl': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '637777' },
      { token: 'string', foreground: 'ecc48d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'type', foreground: 'ffcb8b' },
      { token: 'class', foreground: 'addb67' },
      { token: 'function', foreground: '82aaff' },
      { token: 'variable', foreground: 'd6deeb' },
      { token: 'constant', foreground: 'f78c6c' },
    ],
    colors: {
      'editor.background': '#011627',
      'editor.foreground': '#d6deeb',
      'editor.lineHighlightBackground': '#010e1a',
      'editor.selectionBackground': '#1d3b53',
      'editorCursor.foreground': '#80a4c2',
      'editorWhitespace.foreground': '#1d3b53',
    },
  },
  'cappuccino': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9b8b7e' },
      { token: 'string', foreground: '7a5c3a' },
      { token: 'number', foreground: 'a67b5b' },
      { token: 'keyword', foreground: '8b4513' },
      { token: 'type', foreground: 'cd853f' },
      { token: 'class', foreground: 'd2691e' },
      { token: 'function', foreground: 'a0522d' },
      { token: 'variable', foreground: '5c4033' },
      { token: 'constant', foreground: 'a67b5b' },
    ],
    colors: {
      'editor.background': '#f5f0e8',
      'editor.foreground': '#4a3c2e',
      'editor.lineHighlightBackground': '#ebe5dc',
      'editor.selectionBackground': '#d7cfc5',
      'editorCursor.foreground': '#6f4e37',
      'editorWhitespace.foreground': '#d7cfc5',
    },
  },
  'espresso': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7a5c3a' },
      { token: 'string', foreground: 'ffcc99' },
      { token: 'number', foreground: 'ff9966' },
      { token: 'keyword', foreground: 'ff6633' },
      { token: 'type', foreground: 'cc9966' },
      { token: 'class', foreground: 'ffcc66' },
      { token: 'function', foreground: 'cc9933' },
      { token: 'variable', foreground: 'e6d5b8' },
      { token: 'constant', foreground: 'ff9966' },
    ],
    colors: {
      'editor.background': '#2c1810',
      'editor.foreground': '#e6d5b8',
      'editor.lineHighlightBackground': '#3d2416',
      'editor.selectionBackground': '#4a2f1c',
      'editorCursor.foreground': '#ffcc99',
      'editorWhitespace.foreground': '#4a2f1c',
    },
  },
};

export type ThemeName =
  | 'vs-dark'
  | 'vs-light'
  | 'hc-black'
  | 'hc-light'
  | 'monokai'
  | 'github-dark'
  | 'solarized-dark'
  | 'dracula'
  | 'nord'
  | 'one-dark'
  | 'night-owl'
  | 'cappuccino'
  | 'espresso';

export const themeDisplayNames: Record<ThemeName, string> = {
  'vs-dark': 'Dark (Default)',
  'vs-light': 'Light',
  'hc-black': 'High Contrast Dark',
  'hc-light': 'High Contrast Light',
  'monokai': 'Monokai',
  'github-dark': 'GitHub Dark',
  'solarized-dark': 'Solarized Dark',
  'dracula': 'Dracula',
  'nord': 'Nord',
  'one-dark': 'One Dark',
  'night-owl': 'Night Owl',
  'cappuccino': 'Cappuccino ☕',
  'espresso': 'Espresso ☕',
};
