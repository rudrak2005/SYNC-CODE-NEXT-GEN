import { useMemo, useState } from "react";
import "./FileExplorer.css";

function getFileMeta(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const metadata = {
    js: { icon: "JS", type: "javascript" },
    jsx: { icon: "⚛", type: "react" },
    ts: { icon: "TS", type: "typescript" },
    tsx: { icon: "⚛", type: "react" },
    html: { icon: "‹›", type: "html" },
    css: { icon: "#", type: "css" },
    scss: { icon: "S", type: "css" },
    json: { icon: "{}", type: "json" },
    md: { icon: "M", type: "markdown" },
    py: { icon: "PY", type: "python" },
    cpp: { icon: "C+", type: "cpp" },
    c: { icon: "C", type: "c" },
    java: { icon: "J", type: "java" },
    rs: { icon: "RS", type: "rust" },
    go: { icon: "GO", type: "go" },
    php: { icon: "PHP", type: "php" },
    txt: { icon: "TXT", type: "text" },
    env: { icon: "ENV", type: "env" },
    gitignore: { icon: "G", type: "git" },
  };

  return (
    metadata[extension] || {
      icon: "FILE",
      type: "default",
    }
  );
}

function FileExplorer({
  files = [],
  activeFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateFile = () => {
    const fileName = window.prompt("Enter file name:");

    if (!fileName?.trim()) return;

    onCreateFile(fileName.trim());
  };

  const handleRenameFile = (event, fileName) => {
    event.stopPropagation();

    const newFileName = window.prompt(
      "Rename file:",
      fileName
    );

    if (!newFileName?.trim() || newFileName.trim() === fileName) {
      return;
    }

    onRenameFile(
      fileName,
      newFileName.trim()
    );
  };

  const handleDeleteFile = (event, fileName) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${fileName}"?`
    );

    if (!confirmed) return;

    onDeleteFile(fileName);
  };

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return files;

    return files.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }, [files, search]);

  return (
    <aside className="file-explorer">
      {/* HEADER */}
      <div className="explorer-header">
        <div className="explorer-title-group">
          <span className="explorer-title">
            EXPLORER
          </span>

          <span className="explorer-count">
            {files.length}
          </span>
        </div>

        <div className="explorer-header-actions">
          <button
            type="button"
            className="explorer-header-button"
            onClick={handleCreateFile}
            title="New File"
          >
            +
          </button>

          <button
            type="button"
            className="explorer-header-button"
            onClick={() => setCreating((prev) => !prev)}
            title="Search Files"
          >
            ⌕
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="explorer-search">
        <span className="explorer-search-icon">
          ⌕
        </span>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Filter files..."
          aria-label="Filter files"
        />

        {search && (
          <button
            type="button"
            className="explorer-search-clear"
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </div>

      {/* SECTION */}
      <div className="explorer-section-header">
        <div className="explorer-section-left">
          <span className="explorer-chevron">
            ⌄
          </span>

          <span>WORKSPACE</span>
        </div>

        <span className="explorer-section-count">
          {filteredFiles.length}
        </span>
      </div>

      {/* FILE LIST */}
      <div className="file-list">
        {filteredFiles.length === 0 ? (
          <div className="empty-files">
            <div className="empty-files-icon">
              {search ? "⌕" : "◇"}
            </div>

            <span>
              {search
                ? "No matching files"
                : "No files yet"}
            </span>

            {!search && (
              <button
                type="button"
                onClick={handleCreateFile}
              >
                Create a file
              </button>
            )}
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive =
              activeFile === file.name;

            const meta = getFileMeta(file.name);

            return (
              <div
                key={file.name}
                className={`file-item-wrapper ${
                  isActive ? "active" : ""
                }`}
              >
                <button
                  type="button"
                  className={`file-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    onFileSelect(file.name)
                  }
                  title={file.name}
                >
                  <span
                    className={`file-icon file-icon-${meta.type}`}
                  >
                    {meta.icon}
                  </span>

                  <span className="file-name">
                    {file.name}
                  </span>

                  {file.modified && (
                    <span
                      className="file-modified"
                      title="Unsaved changes"
                    >
                      •
                    </span>
                  )}
                </button>

                <div className="file-actions">
                  <button
                    type="button"
                    className="file-action rename"
                    onClick={(event) =>
                      handleRenameFile(
                        event,
                        file.name
                      )
                    }
                    title={`Rename ${file.name}`}
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    className="file-action delete"
                    onClick={(event) =>
                      handleDeleteFile(
                        event,
                        file.name
                      )
                    }
                    title={`Delete ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="explorer-footer">
        <div className="explorer-footer-status">
          <span className="explorer-status-dot" />
          <span>Workspace Ready</span>
        </div>

        <span className="explorer-footer-count">
          {files.length}{" "}
          {files.length === 1 ? "file" : "files"}
        </span>
      </div>
    </aside>
  );
}

export default FileExplorer;
