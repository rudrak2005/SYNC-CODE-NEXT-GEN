function FileExplorer({
  files,
  activeFile,
  onFileSelect
}) {
  return (
    <aside className="file-explorer">

      <div className="explorer-header">
        <span>EXPLORER</span>
      </div>

      <div className="file-list">

        {files.map((file) => (
          <button
            key={file.name}
            className={
              activeFile === file.name
                ? "file-item active"
                : "file-item"
            }
            onClick={() => onFileSelect(file.name)}
          >
            <span className="file-icon">
              {file.icon}
            </span>

            <span>
              {file.name}
            </span>
          </button>
        ))}

      </div>

    </aside>
  );
}

export default FileExplorer;