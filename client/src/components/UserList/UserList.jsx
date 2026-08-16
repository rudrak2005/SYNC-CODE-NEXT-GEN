function UserList({ users }) {
  return (
    <aside className="user-list">
      <div className="user-list-header">
        <h3>Collaborators</h3>

        <span>
          {users.length} online
        </span>
      </div>

      <div className="user-list-items">
        {users.map((user) => (
          <div
            key={user.socketId}
            className="user-item"
          >
            <span className="presence-dot" />

            <span className="user-name">
              {user.name}
            </span>

            <span className="user-status">
              Online
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default UserList;