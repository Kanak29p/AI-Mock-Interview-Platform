"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Editor to prevent Next.js SSR document/window issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[350px] flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs rounded-xl border border-slate-800">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
      <span>Loading Monaco Editor Environment...</span>
    </div>
  ),
});

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

const mapLanguageToMonaco = (lang: string): string => {
  const map: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
  };
  return map[lang.toLowerCase()] || "javascript";
};

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  onChange,
  language,
  height = "380px",
  readOnly = false,
}) => {
  const monacoLanguage = mapLanguageToMonaco(language);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#1e1e1e] shadow-xl">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, 'Courier New', monospace",
          lineNumbers: "on",
          lineHeight: 20,
          tabSize: 2,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          cursorBlinking: "smooth",
          smoothScrolling: true,
          renderLineHighlight: "all",
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
};

export default MonacoCodeEditor;
