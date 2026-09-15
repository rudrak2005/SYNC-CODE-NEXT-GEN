import "./UserList.css";

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getAvatarClass(index) {
  const variants = [
    "avatar-purple",
    "avatar-cyan",
    "avatar-green",
    "avatar-orange",
    "avatar-pink",
  ];

  return variants[index % variants.length];
}

function UserList({ users = [] }) {
  return (
    <aside className="user-list">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="user-list-header">
        <div className="user-list-title-wrap">
          <div className="user-list-title">
            <span className="user-list-title-icon">◉</span>
            <h3>Collaborators</h3>
          </div>

          <span className="user-list-subtitle">
            Live workspace
          </span>
        </div>

        <div className="user-list-online-count">
          <span className="online-count-dot" />
          <span>{users.length}</span>
        </div>
      </div>

      {/* =========================================
          USER LIST
      ========================================= */}

      <div className="user-list-items">
        {users.length === 0 ? (
          <div className="user-list-empty">
            <div className="user-list-empty-icon">
              ◌
            </div>

            <div className="user-list-empty-title">
              No collaborators yet
            </div>

            <div className="user-list-empty-text">
              Invite someone to start coding together.
            </div>
          </div>
        ) : (
          users.map((user, index) => {
            const name =
              user?.name ||
              user?.username ||
              "Anonymous";

            const initials = getInitials(name);

            return (
              <div
                key={
                  user?.socketId ||
                  user?.id ||
                  `${name}-${index}`
                }
                className="user-item"
              >
                <div
                  className={`user-avatar ${getAvatarClass(
                    index
                  )}`}
                >
                  <span>{initials}</span>

                  <span className="user-avatar-status" />
                </div>

                <div className="user-info">
                  <div className="user-name-row">
                    <span className="user-name">
                      {name}
                    </span>

                    {index === 0 && (
                      <span className="user-owner-badge">
                        Host
                      </span>
                    )}
                  </div>

                  <span className="user-status">
                    <span className="user-status-dot" />
                    Editing now
                  </span>
                </div>

                <div className="user-presence">
                  <span className="user-presence-ring">
                    {index === 0 ? "⌁" : "●"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================
          FOOTER
      ========================================= */}

      {users.length > 0 && (
        <div className="user-list-footer">
          <span>
            {users.length === 1
              ? "1 collaborator online"
              : `${users.length} collaborators online`}
          </span>

          <span className="user-list-live-label">
            LIVE
          </span>
        </div>
      )}
    </aside>
  );
}

export default UserList;
