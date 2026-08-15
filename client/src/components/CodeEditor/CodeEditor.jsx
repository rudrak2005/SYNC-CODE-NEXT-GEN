import Editor from "@monaco-editor/react";

function CodeEditor({
  value,
  language,
  onChange
}) {
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