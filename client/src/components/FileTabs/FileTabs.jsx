function FileTabs({
  files,
  activeFile,
  onFileSelect
}) {
  return (
    <div className="file-tabs">

      {files.map((file) => (
        <button
          key={file.name}
          className={
            activeFile === file.name
              ? "file-tab active"
              : "file-tab"
          }
          onClick={() =>
            onFileSelect(file.name)
          }
        >
          {file.name}
        </button>
      ))}

    </div>
  );
}

export default FileTabs;