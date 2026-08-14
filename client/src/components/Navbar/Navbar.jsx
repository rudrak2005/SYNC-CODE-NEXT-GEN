import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">

      <Link
        to="/dashboard"
        className="logo"
      >
        SyncCode
      </Link>

      <div className="navbar-right">

        <span className="online-status">
          ● Online
        </span>

        <div className="profile">

          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <span>
            {user?.name}
          </span>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </nav>
  );
}

export default Navbar;