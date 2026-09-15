import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  const initials =
    user?.name
      ?.trim()
      ?.split(" ")
      ?.map((word) => word.charAt(0))
      ?.join("")
      ?.slice(0, 2)
      ?.toUpperCase() || "U";

  const isDashboard = location.pathname === "/dashboard";

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <span>SC</span>
          </div>

          <div className="navbar-brand-text">
            <span className="navbar-brand-name">
              SyncCode<span>.</span>
            </span>

            <span className="navbar-brand-version">
              NEXTGEN
            </span>
          </div>
        </Link>

        <div className="navbar-divider" />

        <div className="navbar-breadcrumb">
          <span className="breadcrumb-dot" />
          <span>
            {isDashboard ? "Dashboard" : "Workspace"}
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* LIVE STATUS */}
        <div className="navbar-online">
          <span className="online-pulse">
            <span />
          </span>

          <span className="online-text">
            Online
          </span>
        </div>

        <div className="navbar-divider navbar-divider-small" />

        {/* PROFILE */}
        <div className="navbar-profile-wrapper">
          <button
            type="button"
            className={`navbar-profile ${
              profileOpen ? "active" : ""
            }`}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div className="navbar-avatar">
              {initials}

              <span className="avatar-status" />
            </div>

            <div className="navbar-user-info">
              <span className="navbar-user-name">
                {user?.name || "Developer"}
              </span>

              <span className="navbar-user-role">
                Developer
              </span>
            </div>

            <span
              className={`navbar-chevron ${
                profileOpen ? "rotate" : ""
              }`}
            >
              ⌄
            </span>
          </button>

          {profileOpen && (
            <div className="navbar-dropdown">
              <div className="dropdown-user">
                <div className="dropdown-avatar">
                  {initials}
                </div>

                <div>
                  <strong>
                    {user?.name || "Developer"}
                  </strong>

                  <span>
                    {user?.email || "SyncCode user"}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <Link
                to="/dashboard"
                className="dropdown-item"
                onClick={() => setProfileOpen(false)}
              >
                <span className="dropdown-icon">⌂</span>
                Dashboard
              </Link>

              <div className="dropdown-item">
                <span className="dropdown-icon">◉</span>
                Workspace
                <span className="dropdown-live">
                  LIVE
                </span>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-logout"
                onClick={handleLogout}
              >
                <span>↪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
