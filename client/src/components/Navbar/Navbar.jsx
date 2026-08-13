import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/dashboard" className="logo">
        SyncCode
      </Link>

      <div className="navbar-right">
        <span className="online-status">
          ● Online
        </span>

        <div className="profile">
          <div className="avatar">
            R
          </div>

          <span>Rudraksh</span>
        </div>
      </div>

    </nav>
  );
}

export default Navbar;