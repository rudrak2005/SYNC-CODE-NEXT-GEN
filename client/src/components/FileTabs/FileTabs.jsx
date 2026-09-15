import "./FileTabs.css";

function getFileIcon(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const icons = {
    js: "JS",
    jsx: "⚛",
    ts: "TS",
    tsx: "⚛",
    html: "‹›",
    css: "#",
    scss: "S",
    json: "{}",
    md: "M",
    py: "PY",
    cpp: "C+",
    c: "C",
    java: "J",
    rs: "RS",
    go: "GO",
    php: "PHP",
    txt: "TXT",
  };

  return icons[extension] || "FILE";
}

function getFileClass(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const classes = {
    js: "javascript",
    jsx: "react",
    ts: "typescript",
    tsx: "react",
    html: "html",
    css: "css",
    scss: "css",
    json: "json",
    md: "markdown",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    rs: "rust",
    go: "go",
    php: "php",
    txt: "text",
  };

  return classes[extension] || "default";
}

function FileTabs({
  files = [],
  activeFile,
  onFileSelect,
}) {
  return (
    <div className="file-tabs-shell">
      <div className="file-tabs-scroll">
        <div className="file-tabs">
          {files.map((file, index) => {
            const fileName =
              typeof file === "string"
                ? file
                : file?.name || `file-${index}`;

            const isActive = activeFile === fileName;
            const fileType = getFileClass(fileName);
            const fileIcon = getFileIcon(fileName);

            return (
              <button
                key={`${fileName}-${index}`}
                type="button"
                title={fileName}
                className={`file-tab ${
                  isActive ? "active" : ""
                }`}
                onClick={() => onFileSelect(fileName)}
              >
                <span
                  className={`file-tab-icon file-icon-${fileType}`}
                >
                  {fileIcon}
                </span>

                <span className="file-tab-name">
                  {fileName}
                </span>

                {file?.modified && (
                  <span
                    className="file-tab-modified"
                    title="Unsaved changes"
                  >
                    •
                  </span>
                )}

                <span
                  className={`file-tab-active-line ${
                    isActive ? "visible" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="file-tabs-end">
        <span className="file-tabs-count">
          {files.length}{" "}
          {files.length === 1 ? "file" : "files"}
        </span>
      </div>
    </div>
  );
}

export default FileTabs;
