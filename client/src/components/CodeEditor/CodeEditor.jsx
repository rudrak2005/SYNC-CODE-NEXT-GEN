import { useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

import {
  sendCursorPosition,
} from "../../lib/collaboration/cursor/cursorService";

import {
  registerCursorListener,
} from "../../lib/collaboration/cursor/cursorListener";

import {
  renderRemoteCursor,
  removeRemoteCursor,
} from "../../lib/collaboration/cursor/remoteCursorManager";

import "../../lib/collaboration/cursor/cursor.css";
import "./CodeEditor.css";

function CodeEditor({
  value,
  language,
  onChange,
  socket,
  user,
  fileName,
  themeMode = "dark",
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  /*
   * Keep latest props available to socket/cursor callbacks.
   * This prevents stale closure problems when the active file
   * or authenticated user changes.
   */
  const socketRef = useRef(socket);
  const userRef = useRef(user);
  const fileNameRef = useRef(fileName);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  /*
   * Track remote users rendered in the current Monaco instance.
   * This allows us to remove stale cursors safely.
   */
  const remoteUsersRef = useRef(new Set());

  /*
   * ========================================
   * GET CURRENT USER ID
   * ========================================
   */
  const getCurrentUserId = useCallback(() => {
    const currentUser = userRef.current;

    return currentUser?.id || currentUser?._id || null;
  }, []);

  /*
   * ========================================
   * SEND LOCAL CURSOR
   * ========================================
   */
  const handleCursorChange = useCallback(
    (event) => {
      const currentSocket = socketRef.current;
      const currentUser = userRef.current;
      const currentFileName = fileNameRef.current;

      if (!currentSocket || !currentUser || !currentFileName) {
        return;
      }

      const position = event?.position;

      if (!position) {
        return;
      }

      sendCursorPosition({
        socket: currentSocket,
        user: currentUser,
        fileName: currentFileName,
        lineNumber: position.lineNumber,
        column: position.column,
      });
    },
    []
  );

  /*
   * ========================================
   * MONACO MOUNT
   * ========================================
   */
  const handleEditorMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      /*
       * LOCAL CURSOR
       */
      const cursorDisposable =
        editor.onDidChangeCursorPosition(handleCursorChange);

      /*
       * REMOTE CURSOR
       */
      let cleanupRemoteListener = null;

      const currentSocket = socketRef.current;

      if (currentSocket) {
        cleanupRemoteListener = registerCursorListener(
          currentSocket,
          (cursor) => {
            const currentFileName = fileNameRef.current;
            const currentUserId = getCurrentUserId();

            /*
             * Ignore another file
             */
            if (
              !currentFileName ||
              cursor?.fileName !== currentFileName
            ) {
              return;
            }

            /*
             * Ignore own cursor
             */
            if (
              cursor?.userId &&
              currentUserId &&
              cursor.userId === currentUserId
            ) {
              return;
            }

            if (!cursor?.userId) {
              return;
            }

            renderRemoteCursor(editor, cursor);

            remoteUsersRef.current.add(cursor.userId);
          }
        );
      }

      /*
       * USER LEFT
       */
      const handleUserLeft = ({ socketId, user: leftUser } = {}) => {
        const userId =
          leftUser?.id ||
          leftUser?._id ||
          socketId;

        if (!userId) {
          return;
        }

        removeRemoteCursor(editor, userId);

        remoteUsersRef.current.delete(userId);
      };

      if (currentSocket) {
        currentSocket.on("user:left", handleUserLeft);
      }

      /*
       * Store cleanup on editor instance.
       */
      editor.__syncCodeCleanup = () => {
        try {
          cursorDisposable?.dispose();
        } catch (error) {
          console.warn(
            "Failed to dispose cursor listener:",
            error
          );
        }

        try {
          if (typeof cleanupRemoteListener === "function") {
            cleanupRemoteListener();
          }
        } catch (error) {
          console.warn(
            "Failed to cleanup remote cursor listener:",
            error
          );
        }

        if (currentSocket) {
          currentSocket.off(
            "user:left",
            handleUserLeft
          );
        }

        /*
         * Remove all known remote cursors.
         */
        remoteUsersRef.current.forEach((userId) => {
          try {
            removeRemoteCursor(editor, userId);
          } catch (error) {
            console.warn(
              "Failed to remove remote cursor:",
              error
            );
          }
        });

        remoteUsersRef.current.clear();

        editorRef.current = null;
      };
    },
    [getCurrentUserId, handleCursorChange]
  );

  /*
   * ========================================
   * CLEANUP ON UNMOUNT
   * ========================================
   */
  useEffect(() => {
    return () => {
      const editor = editorRef.current;

      if (
        editor &&
        typeof editor.__syncCodeCleanup === "function"
      ) {
        editor.__syncCodeCleanup();
      }
    };
  }, []);

  /*
   * ========================================
   * FILE CHANGE
   * ========================================
   *
   * When changing tabs/files, remove previously
   * rendered remote cursors from the old model.
   */
  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    remoteUsersRef.current.forEach((userId) => {
      try {
        removeRemoteCursor(editor, userId);
      } catch (error) {
        console.warn(
          "Failed to clear remote cursor:",
          error
        );
      }
    });

    remoteUsersRef.current.clear();
  }, [fileName]);

  /*
   * ========================================
   * CODE CHANGE
   * ========================================
   */
  const handleEditorChange = useCallback(
    (newValue) => {
      onChange?.(newValue ?? "");
    },
    [onChange]
  );

  /*
   * ========================================
   * MONACO BEFORE MOUNT
   * ========================================
   */
  const handleBeforeMount = useCallback((monaco) => {
    monacoRef.current = monaco;

    /*
     * Disable default word based suggestions in places
     * where they become noisy. Language services still work.
     */
    monaco.editor.defineTheme("syncCodeDark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "C084FC" },
        { token: "string", foreground: "86EFAC" },
        { token: "number", foreground: "67E8F9" },
      ],
      colors: {
        "editor.background": "#0B1020",
        "editor.foreground": "#E2E8F0",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#CBD5E1",
        "editorCursor.foreground": "#A78BFA",
        "editor.selectionBackground": "#4338CA55",
        "editor.inactiveSelectionBackground": "#312E8133",
        "editor.lineHighlightBackground": "#7C3AED0D",
        "editorLineNumber.border": "#00000000",
        "editorGutter.background": "#0B1020",
        "editorIndentGuide.background": "#1E293B",
        "editorIndentGuide.activeBackground": "#475569",
        "editorWhitespace.foreground": "#334155",
        "editorBracketMatch.background": "#7C3AED1A",
        "editorBracketMatch.border": "#8B5CF644",
        "editorSuggestWidget.background": "#121826",
        "editorSuggestWidget.border": "#2A3248",
        "editorSuggestWidget.foreground": "#E2E8F0",
        "editorSuggestWidget.selectedBackground": "#7C3AED33",
        "editorHoverWidget.background": "#121826",
        "editorHoverWidget.border": "#2A3248",
        "editorWidget.background": "#121826",
        "editorWidget.border": "#2A3248",
        "editorScrollbarSlider.background": "#33415588",
        "editorScrollbarSlider.hoverBackground": "#475569AA",
        "editorScrollbarSlider.activeBackground": "#64748BAA",
        "minimap.background": "#090E1A",
        "minimap.selectionHighlight": "#7C3AED55",
        "minimapSlider.background": "#47556944",
        "minimapSlider.hoverBackground": "#64748B66",
        "minimapSlider.activeBackground": "#94A3B866",
      },
    });

    monaco.editor.defineTheme("syncCodeLight", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "6D28D9" },
        { token: "string", foreground: "15803D" },
        { token: "number", foreground: "0369A1" },
      ],
      colors: {
        "editor.background": "#F8FAFC",
        "editor.foreground": "#1E293B",
        "editorLineNumber.foreground": "#94A3B8",
        "editorLineNumber.activeForeground": "#475569",
        "editorCursor.foreground": "#7C3AED",
        "editor.selectionBackground": "#DDD6FEAA",
        "editor.inactiveSelectionBackground": "#EDE9FE99",
        "editor.lineHighlightBackground": "#F1F5F9",
        "editorLineNumber.border": "#00000000",
        "editorGutter.background": "#F8FAFC",
        "editorIndentGuide.background": "#E2E8F0",
        "editorIndentGuide.activeBackground": "#CBD5E1",
        "editorWhitespace.foreground": "#CBD5E1",
        "editorBracketMatch.background": "#EDE9FE",
        "editorBracketMatch.border": "#A78BFA",
        "editorSuggestWidget.background": "#FFFFFF",
        "editorSuggestWidget.border": "#E2E8F0",
        "editorSuggestWidget.foreground": "#1E293B",
        "editorSuggestWidget.selectedBackground": "#EDE9FE",
        "editorHoverWidget.background": "#FFFFFF",
        "editorHoverWidget.border": "#E2E8F0",
        "editorWidget.background": "#FFFFFF",
        "editorWidget.border": "#E2E8F0",
        "editorScrollbarSlider.background": "#CBD5E188",
        "editorScrollbarSlider.hoverBackground": "#94A3B888",
        "editorScrollbarSlider.activeBackground": "#64748BAA",
        "minimap.background": "#F1F5F9",
        "minimap.selectionHighlight": "#C4B5FD88",
        "minimapSlider.background": "#94A3B855",
        "minimapSlider.hoverBackground": "#64748B66",
        "minimapSlider.activeBackground": "#47556977",
      },
    });  }, []);

  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.editor.setTheme(
      themeMode === "light" ? "syncCodeLight" : "syncCodeDark"
    );
  }, [themeMode]);

  const displayLanguage =
    language || "plaintext";

  return (
    <div className="code-editor-wrapper">
      {/* ========================================
          EDITOR HEADER
      ======================================== */}
      <div className="code-editor-toolbar">
        <div className="code-editor-file">
          <div className="code-editor-file-icon">
            <span className="code-editor-file-icon-dot" />
          </div>

          <div className="code-editor-file-meta">
            <span className="code-editor-file-name">
              {fileName || "Untitled"}
            </span>

            <span className="code-editor-file-type">
              {displayLanguage}
            </span>
          </div>
        </div>

        <div className="code-editor-toolbar-right">
          <div className="code-editor-live">
            <span className="code-editor-live-pulse" />
            <span>Live Sync</span>
          </div>

          <div className="code-editor-divider" />

          <div className="code-editor-status-text">
            <span className="code-editor-status-icon">
              ✓
            </span>
            Synced
          </div>
        </div>
      </div>

      {/* ========================================
          MONACO
      ======================================== */}
      <div className="code-editor-monaco">
        <Editor
          height="100%"
          width="100%"
          theme={themeMode === "light" ? "syncCodeLight" : "syncCodeDark"}
          language={displayLanguage}
          value={value ?? ""}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          loading={
            <div className="code-editor-loading">
              <div className="code-editor-loading-spinner" />

              <span>
                Loading editor...
              </span>
            </div>
          }
          options={{
            automaticLayout: true,

            /*
             * Typography
             */
            fontSize: 14,
            lineHeight: 23,
            fontFamily:
              '"JetBrains Mono", "Fira Code", Consolas, monospace',
            fontLigatures: true,
            fontWeight: "400",

            /*
             * Cursor
             */
            cursorStyle: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",

            /*
             * Spacing
             */
            tabSize: 2,
            insertSpaces: true,

            /*
             * Wrapping
             */
            wordWrap: "on",
            wordWrapColumn: 100,
            wrappingIndent: "indent",

            /*
             * Padding
             */
            padding: {
              top: 16,
              bottom: 18,
            },

            /*
             * Selection / highlight
             */
            selectionHighlight: true,
            occurrencesHighlight: "singleFile",
            renderLineHighlight: "line",
            renderLineHighlightOnlyWhenFocus: false,

            /*
             * Brackets
             */
            bracketPairColorization: {
              enabled: true,
              independentColorPoolPerBracketType: true,
            },

            matchBrackets: "always",

            guides: {
              bracketPairs: true,
              bracketPairsHorizontal: true,
              highlightActiveBracketPair: true,
              indentation: true,
              highlightActiveIndentation: true,
            },

            /*
             * Code folding
             */
            folding: true,
            foldingHighlight: true,
            showFoldingControls: "mouseover",
            foldingStrategy: "auto",

            /*
             * Minimap
             */
            minimap: {
              enabled: true,
              side: "right",
              size: "fit",
              showSlider: "mouseover",
              renderCharacters: false,
              scale: 1,
              maxColumn: 100,
            },

            /*
             * Scrolling
             */
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            mouseWheelScrollSensitivity: 1,
            fastScrollSensitivity: 5,
            alwaysConsumeMouseWheel: false,

            scrollbar: {
              verticalScrollbarSize: 9,
              horizontalScrollbarSize: 9,
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              alwaysConsumeMouseWheel: false,
            },

            /*
             * Whitespace
             */
            renderWhitespace: "selection",

            /*
             * Overview ruler
             */
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,

            /*
             * Suggestions
             */
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showVariables: true,
              showClasses: true,
              showModules: true,
              showProperties: true,
              showKeywords: true,
              showSnippets: true,
            },

            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },

            suggestOnTriggerCharacters: true,

            /*
             * Hover
             */
            hover: {
              enabled: true,
              delay: 200,
              above: false,
            },

            /*
             * Context
             */
            contextmenu: true,
            links: true,

            /*
             * Editing
             */
            formatOnPaste: false,
            formatOnType: false,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoSurround: "languageDefined",

            /*
             * Accessibility
             */
            accessibilitySupport: "auto",

            /*
             * Find
             */
            find: {
              addExtraSpaceOnTop: true,
              autoFindInSelection: "multiline",
              seedSearchStringFromSelection: "always",
            },

            /*
             * Performance
             */
            largeFileOptimizations: true,

            /*
             * Editor chrome
             */
            overviewRulerLanes: 2,
            glyphMargin: true,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            foldingMaximumRegions: 5000,

            /*
             * Focus
             */
            tabFocusMode: false,
            stickyScroll: {
              enabled: true,
              maxLineCount: 3,
            },
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
