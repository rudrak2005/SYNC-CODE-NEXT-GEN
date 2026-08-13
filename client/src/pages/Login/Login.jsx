import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>SyncCode</h1>

        <p>Welcome back</p>

        <form>
          <input
            type="email"
            placeholder="Email"
          />

          <input
            type="password"
            placeholder="Password"
          />

          <button type="submit">
            Login
          </button>
        </form>

        <Link to="/forgot-password">
          Forgot Password?
        </Link>

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;