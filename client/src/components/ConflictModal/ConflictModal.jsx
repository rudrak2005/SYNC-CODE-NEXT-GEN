import "./ConflictModal.css";

function ConflictModal({
  conflict,
  onReload,
  onClose
}) {
  if (!conflict) return null;

  return (
    <div className="conflict-overlay">
      <div className="conflict-modal">
        <h2>⚠ Conflict Detected</h2>

        <p>
          Someone updated this project before you.
        </p>

        <div className="revision-box">
          <span>Latest Revision</span>
          <strong>#{conflict.revision}</strong>
        </div>

        <div className="conflict-actions">
          <button
            className="reload-btn"
            onClick={onReload}
          >
            Reload Latest
          </button>

          <button
            className="close-btn"
            onClick={onClose}
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictModal;