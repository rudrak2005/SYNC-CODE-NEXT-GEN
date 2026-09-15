import "./VersionHistory.css";

function VersionHistory({
  versions = [],
  onRestore,
  onClose,
}) {
  return (
    <aside className="version-history-panel">
      {/* ================================
          HEADER
      ================================= */}
      <div className="version-history-header">
        <div className="version-history-title">
          <div className="version-history-title-icon">
            ↶
          </div>

          <div className="version-history-title-text">
            <h3>Version History</h3>

            <span>
              {versions.length}{" "}
              {versions.length === 1
                ? "revision"
                : "revisions"}
            </span>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="version-history-close"
          onClick={() => onClose?.()}
          title="Close Version History"
          aria-label="Close Version History"
        >
          ×
        </button>
      </div>

      {/* ================================
          BODY
      ================================= */}
      <div className="version-history-body">
        {versions.length === 0 ? (
          <div className="version-history-empty">
            <div className="version-empty-icon">
              ◫
            </div>

            <strong>No versions yet</strong>

            <span>
              Saved revisions will appear here
            </span>
          </div>
        ) : (
          <div className="version-timeline">
            {versions.map((version, index) => {
              const createdAt = new Date(
                version.createdAt
              );

              const author =
                version.author?.name ||
                "Unknown user";

              return (
                <div
                  key={
                    version._id ||
                    `${version.revision}-${index}`
                  }
                  className={`version-item ${
                    index === 0 ? "latest" : ""
                  }`}
                >
                  {/* TIMELINE */}
                  <div className="version-line">
                    <span className="version-dot" />
                  </div>

                  {/* CARD */}
                  <div className="version-card">
                    {/* TOP */}
                    <div className="version-card-top">
                      <div className="version-revision">
                        <span className="revision-hash">
                          #
                        </span>

                        <strong>
                          Revision {version.revision}
                        </strong>
                      </div>

                      {index === 0 && (
                        <span className="latest-badge">
                          LATEST
                        </span>
                      )}
                    </div>

                    {/* META */}
                    <div className="version-meta">
                      <span className="version-author">
                        <span className="author-dot" />
                        {author}
                      </span>

                      <span className="version-time">
                        {createdAt.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>

                    {/* DATE */}
                    <div className="version-date">
                      {createdAt.toLocaleDateString(
                        [],
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </div>

                    {/* RESTORE */}
                    <button
                      type="button"
                      className="version-restore-btn"
                      onClick={() =>
                        onRestore(version.revision)
                      }
                    >
                      <span className="restore-icon">
                        ↶
                      </span>

                      <span>
                        Restore this version
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================
          FOOTER
      ================================= */}
      <div className="version-history-footer">
        <div className="version-footer-status">
          <span className="footer-status-dot" />
          <span>Revision tracking active</span>
        </div>

        <span className="version-footer-tag">
          SYNC
        </span>
      </div>
    </aside>
  );
}

export default VersionHistory;
