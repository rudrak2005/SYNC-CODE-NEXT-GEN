import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import CodeEditor from "../../components/CodeEditor/CodeEditor";
import FileExplorer from "../../components/FileExplorer/FileExplorer";
import FileTabs from "../../components/FileTabs/FileTabs";

const initialFiles = {
  "main.js": {
    language: "javascript",
    content: `function hello() {
  console.log("Hello from SyncCode!");
}

hello();`
  },

  "index.html": {
    language: "html",
    content: `<!DOCTYPE html>
<html>
  <head>
    <title>SyncCode</title>
  </head>

  <body>
    <h1>Hello SyncCode</h1>
  </body>
</html>`
  },

  "style.css": {
    language: "css",
    content: `body {
  margin: 0;
  font-family: sans-serif;
}

h1 {
  color: #ffffff;
}`
  }
};

function Editor() {
  const { roomId } = useParams();

  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState(
    "main.js"
  );

  const currentFile = files[activeFile];

  const fileList = useMemo(() => {
    return Object.keys(files).map((name) => ({
      name,
      icon:
        name.endsWith(".js")
          ? "JS"
          : name.endsWith(".html")
          ? "HT"
          : "CS"
    }));
  }, [files]);

  const handleCodeChange = (value) => {
    setFiles((previousFiles) => ({
      ...previousFiles,

      [activeFile]: {
        ...previousFiles[activeFile],
        content: value
      }
    }));
  };

  const handleSave = () => {
    console.log(
      "Saved:",
      activeFile
    );

    localStorage.setItem(
      `synccode-${roomId}-${activeFile}`,
      currentFile.content
    );
  };

  return (
    <div className="editor-page">

      <header className="editor-header">

        <Link
          to={`/room/${roomId}`}
          className="editor-back"
        >
          ← Room
        </Link>

        <div className="editor-room-info">
          <strong>SyncCode</strong>
          <span>{roomId}</span>
        </div>

        <button
          className="save-button"
          onClick={handleSave}
        >
          Save
        </button>

      </header>

      <div className="editor-layout">

        <FileExplorer
          files={fileList}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
        />

        <section className="editor-main">

          <FileTabs
            files={fileList}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
          />

          <div className="editor-container">

            <CodeEditor
              value={currentFile.content}
              language={currentFile.language}
              onChange={handleCodeChange}
            />

          </div>

        </section>

      </div>

    </div>
  );
}

export default Editor;