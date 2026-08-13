import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">

      <h3>Workspace</h3>

      <NavLink to="/dashboard">
        Dashboard
      </NavLink>

      <NavLink to="/dashboard">
        Projects
      </NavLink>

      <NavLink to="/create-project">
        Create Project
      </NavLink>

      <NavLink to="/join-room">
        Join Room
      </NavLink>

      <div className="sidebar-bottom">
        <NavLink to="/settings">
          Settings
        </NavLink>
      </div>

    </aside>
  );
}

export default Sidebar;