import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: "⌂",
      end: true,
    },
    {
      to: "/dashboard",
      label: "Projects",
      icon: "▦",
    },
  ];

  return (
    <aside className="sidebar">

      {/* BRAND / HEADER */}
      <div className="sidebar-header">
        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <div className="sidebar-workspace">
          <div className="sidebar-workspace-icon">
            SC
          </div>

          <div className="sidebar-workspace-info">
            <span>SyncCode</span>
            <small>Personal Workspace</small>
          </div>

          <span className="sidebar-workspace-status" />
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <div className="sidebar-content">

        <div className="sidebar-nav-label">
          NAVIGATION
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="sidebar-nav-icon">
                {item.icon}
              </span>

              <span className="sidebar-nav-text">
                {item.label}
              </span>

              {item.label === "Projects" && (
                <span className="sidebar-nav-count">
                  •
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* COLLABORATION */}
        <div className="sidebar-nav-label collaboration-label">
          COLLABORATION
        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/create-project"
            className={({ isActive }) =>
              `sidebar-nav-item create-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-nav-icon action-icon">
              +
            </span>

            <span className="sidebar-nav-text">
              Create Project
            </span>
          </NavLink>

          <NavLink
            to="/join-room"
            className={({ isActive }) =>
              `sidebar-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-nav-icon">
              ↗
            </span>

            <span className="sidebar-nav-text">
              Join Room
            </span>
          </NavLink>

        </nav>

      </div>

      {/* BOTTOM */}
      <div className="sidebar-bottom">

        <div className="sidebar-status-card">
          <div className="sidebar-status-top">
            <span className="sidebar-status-dot" />
            <span>SYSTEM ONLINE</span>
          </div>

          <div className="sidebar-status-text">
            Real-time collaboration active
          </div>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item settings-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-nav-icon">
            ⚙
          </span>

          <span className="sidebar-nav-text">
            Settings
          </span>
        </NavLink>

        <div className="sidebar-footer">
          <span>SyncCode NextGen</span>
          <span>v1.0</span>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
