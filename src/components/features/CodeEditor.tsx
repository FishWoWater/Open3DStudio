/**
 * Code Editor Component using Monaco Editor
 * Provides a full IDE experience with syntax highlighting, autocomplete, and error checking
 */

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';

const EditorContainer = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 8px;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
`;

const EditorTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const EditorActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface CodeEditorProps {
  code: string;
  language?: 'javascript' | 'typescript' | 'json' | 'html' | 'css';
  onChange?: (code: string | undefined) => void;
  onSave?: (code: string) => void;
  onRun?: (code: string) => void;
  readOnly?: boolean;
  fileName?: string;
  height?: string;
}

/**
 * Game Code Editor Component
 * Provides Monaco Editor integration with game-specific autocompletion
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = 'javascript',
  onChange,
  onSave,
  onRun,
  readOnly = false,
  fileName = 'script.js',
  height = '500px',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco for game development
    setupGameAutocompletion(monaco);

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun(editor.getValue());
      }
    });
  };

  const setupGameAutocompletion = (monaco: Monaco) => {
    // Add game API type definitions
    const gameApiDefs = `
      /**
       * Game API - Available in all game scripts
       */
      declare const game: {
        /** Player object */
        player: {
          x: number;
          y: number;
          speed: number;
          health: number;
          score: number;
          jump(): void;
          moveLeft(): void;
          moveRight(): void;
        };
        
        /** Game state */
        score: number;
        level: number;
        isPaused: boolean;
        
        /** Game methods */
        addScore(points: number): void;
        spawnEnemy(type: string, x: number, y: number): void;
        playSound(sound: string): void;
        showMessage(text: string): void;
        gameOver(): void;
        nextLevel(): void;
        
        /** Input handling */
        input: {
          isKeyPressed(key: string): boolean;
          getMouseX(): number;
          getMouseY(): number;
          isMouseDown(): boolean;
        };
        
        /** Scene management */
        scene: {
          width: number;
          height: number;
          backgroundColor: string;
          addObject(obj: any): void;
          removeObject(obj: any): void;
        };
      };
      
      /**
       * Three.js types (for 3D games)
       */
      declare const THREE: any;
    `;

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    // Add game API declarations
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      gameApiDefs,
      'game.d.ts'
    );

    // Add Three.js basic types
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `declare const THREE: any;`,
      'three.d.ts'
    );
  };

  const handleSave = () => {
    if (editorRef.current && onSave) {
      onSave(editorRef.current.getValue());
    }
  };

  const handleRun = () => {
    if (editorRef.current && onRun) {
      onRun(editorRef.current.getValue());
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>{fileName}</EditorTitle>
        <EditorActions>
          <ActionButton onClick={handleFormat} disabled={readOnly}>
            Format
          </ActionButton>
          {onSave && (
            <ActionButton onClick={handleSave} disabled={readOnly}>
              💾 Save (Ctrl+S)
            </ActionButton>
          )}
          {onRun && (
            <ActionButton onClick={handleRun}>
              ▶️ Run (Ctrl+Enter)
            </ActionButton>
          )}
        </EditorActions>
      </EditorHeader>
      <Editor
        height={height}
        language={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          readOnly,
          formatOnPaste: true,
          formatOnType: true,
          suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          parameterHints: {
            enabled: true,
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          accessibilitySupport: 'auto',
        }}
      />
    </EditorContainer>
  );
};

export default CodeEditor;
