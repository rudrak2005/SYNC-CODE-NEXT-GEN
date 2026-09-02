import "./VersionHistory.css";

function VersionHistory({
  versions,
  onRestore
}) {

  return (
    <aside className="history-panel">

      <h3>Version History</h3>

      {versions.map((version) => (

        <div
          className="history-card"
          key={version._id}
        >
          <div className="history-top">
            <strong>
              Revision #{version.revision}
            </strong>

            <span>
              {new Date(
                version.createdAt
              ).toLocaleTimeString()}
            </span>
          </div>

          <p>{version.author?.name}</p>

          <button
            onClick={() =>
              onRestore(version.revision)
            }
          >
            Restore
          </button>

        </div>

      ))}

    </aside>
  );
}

export default VersionHistory;