import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p>Join SyncCode Next-Gen</p>

        <form>
          <input
            type="text"
            placeholder="Name"
          />

          <input
            type="email"
            placeholder="Email"
          />

          <input
            type="password"
            placeholder="Password"
          />

          <button type="submit">
            Create Account
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;