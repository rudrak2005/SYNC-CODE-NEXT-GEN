function UserList({ users = [] }) {
  return (
    <aside className="user-list">

      <div className="user-list-header">
        ONLINE — {users.length}
      </div>

      {users.map((user) => (
        <div
          key={user.socketId}
          className="user-item"
        >
          <div className="avatar">
            {(user.name || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <span>
            {user.name || "Anonymous"}
          </span>

          <span className="online-dot">
            ●
          </span>
        </div>
      ))}

    </aside>
  );
}

export default UserList;