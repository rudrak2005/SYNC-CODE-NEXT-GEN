import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

import {
  sendCursorPosition
} from "../../lib/collaboration/cursor/cursorService";

import {
  registerCursorListener
} from "../../lib/collaboration/cursor/cursorListener";

import {
  renderRemoteCursor,
  removeRemoteCursor
} from "../../lib/collaboration/cursor/remoteCursorManager";

import "../../lib/collaboration/cursor/cursor.css";


function CodeEditor({
  value,
  language,
  onChange,
  socket,
  user,
  fileName
}) {
  const editorRef = useRef(null);

  /*
   * MONACO MOUNT
   */
  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    /*
     * LOCAL CURSOR
     */
    const cursorDisposable =
      editor.onDidChangeCursorPosition((event) => {
        const position = event.position;

        sendCursorPosition({
          socket,
          user,
          fileName,
          lineNumber: position.lineNumber,
          column: position.column
        });
      });

    /*
     * REMOTE CURSOR
     */
    const cleanupRemoteListener =
      registerCursorListener(
        socket,
        (cursor) => {
          // Ignore cursors from another file
          if (cursor.fileName !== fileName) {
            return;
          }

          // Ignore our own cursor
          const currentUserId =
            user?.id || user?._id;

          if (
            cursor.userId === currentUserId
          ) {
            return;
          }

          renderRemoteCursor(
            editor,
            cursor
          );
        }
      );

    /*
     * USER LEFT
     */
    const handleUserLeft = ({
      socketId,
      user: leftUser
    }) => {
      const userId =
        leftUser?.id ||
        leftUser?._id;

      if (userId) {
        removeRemoteCursor(
          editor,
          userId
        );
      }
    };

    socket?.on(
      "user:left",
      handleUserLeft
    );

    /*
     * CLEANUP
     */
    editor.__syncCodeCleanup = () => {
      cursorDisposable.dispose();

      cleanupRemoteListener();

      socket?.off(
        "user:left",
        handleUserLeft
      );

      editorRef.current = null;
    };
  };


  /*
   * CLEANUP ON UNMOUNT
   */
  useEffect(() => {
    return () => {
      if (
        editorRef.current &&
        editorRef.current.__syncCodeCleanup
      ) {
        editorRef.current.__syncCodeCleanup();
      }
    };
  }, []);


  /*
   * CODE CHANGE
   */
  const handleEditorChange = (newValue) => {
    onChange(newValue || "");
  };


  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={{
        automaticLayout: true,

        minimap: {
          enabled: true
        },

        fontSize: 14,

        tabSize: 2,

        wordWrap: "on",

        padding: {
          top: 15
        },

        scrollBeyondLastLine: false,

        smoothScrolling: true
      }}
    />
  );
}


export default CodeEditor;