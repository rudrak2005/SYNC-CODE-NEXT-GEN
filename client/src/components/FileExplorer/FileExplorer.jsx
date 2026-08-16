function FileExplorer({
  files,
  activeFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}) {
  const handleCreateFile = () => {
    const fileName = window.prompt(
      "Enter file name:"
    );

    if (!fileName) {
      return;
    }

    onCreateFile(fileName);
  };


  const handleRenameFile = (
    event,
    fileName
  ) => {
    event.stopPropagation();

    const newFileName =
      window.prompt(
        "Rename file:",
        fileName
      );

    if (!newFileName) {
      return;
    }

    onRenameFile(
      fileName,
      newFileName
    );
  };


  const handleDeleteFile = (
    event,
    fileName
  ) => {
    event.stopPropagation();

    const confirmed =
      window.confirm(
        `Delete ${fileName}?`
      );

    if (!confirmed) {
      return;
    }

    onDeleteFile(fileName);
  };


  return (
    <aside className="file-explorer">

      <div className="explorer-header">

        <span>
          EXPLORER
        </span>

        <button
          type="button"
          className="new-file-button"
          onClick={handleCreateFile}
          title="New File"
        >
          +
        </button>

      </div>


      <div className="file-list">

        {files.length === 0 ? (

          <div className="empty-files">
            No files
          </div>

        ) : (

          files.map((file) => (

            <div
              key={file.name}
              className={
                activeFile === file.name
                  ? "file-item-wrapper active"
                  : "file-item-wrapper"
              }
            >

              <button
                type="button"
                className={
                  activeFile === file.name
                    ? "file-item active"
                    : "file-item"
                }
                onClick={() =>
                  onFileSelect(file.name)
                }
              >

                <span className="file-icon">
                  {file.icon}
                </span>

                <span className="file-name">
                  {file.name}
                </span>

              </button>


              <div className="file-actions">

                <button
                  type="button"
                  onClick={(event) =>
                    handleRenameFile(
                      event,
                      file.name
                    )
                  }
                  title="Rename"
                >
                  ✎
                </button>


                <button
                  type="button"
                  onClick={(event) =>
                    handleDeleteFile(
                      event,
                      file.name
                    )
                  }
                  title="Delete"
                >
                  ×
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </aside>
  );
}


export default FileExplorer;