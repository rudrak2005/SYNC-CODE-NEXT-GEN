import { Link } from "react-router-dom";

function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>

        <p>
          Enter your email to reset your password.
        </p>

        <form>
          <input
            type="email"
            placeholder="Email"
          />

          <button type="submit">
            Send Reset Link
          </button>
        </form>

        <Link to="/login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;