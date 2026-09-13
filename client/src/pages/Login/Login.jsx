import { useState } from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const {
    setAuthenticatedUser
  } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/auth/login",
        {
          email: form.email.trim(),
          password: form.password
        }
      );

      const token =
        response.data?.token;

      const authenticatedUser =
        response.data?.user;

      if (!token || !authenticatedUser) {
        throw new Error(
          "Invalid login response from server."
        );
      }

      /*
       * IMPORTANT:
       * Context + localStorage both update.
       */
      setAuthenticatedUser(
        token,
        authenticatedUser
      );

      /*
       * Dashboard automatically opens.
       */
      navigate(
        "/dashboard",
        {
          replace: true
        }
      );

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-background-grid" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="auth-shell">

        {/* LEFT BRAND PANEL */}

        <div className="auth-brand-panel">

          <Link
            to="/"
            className="auth-brand"
          >
            <div className="auth-brand-icon">
              SC
            </div>

            <span>
              SyncCode
              <strong> NextGen</strong>
            </span>
          </Link>

          <div className="auth-brand-content">

            <div className="auth-badge">
              <span className="auth-badge-dot" />
              AI-Powered Collaborative IDE
            </div>

            <h1>
              Build.
              <br />
              Collaborate.
              <br />
              <span>Ship Faster.</span>
            </h1>

            <p>
              A next-generation development
              environment for real-time
              collaboration, browser execution,
              AI assistance and intelligent
              code workflows.
            </p>

            <div className="auth-feature-list">

              <div className="auth-feature">
                <span>✓</span>
                Real-time collaboration
              </div>

              <div className="auth-feature">
                <span>✓</span>
                Browser-native execution
              </div>

              <div className="auth-feature">
                <span>✓</span>
                AI-powered development
              </div>

            </div>

          </div>

          <div className="auth-brand-footer">
            SyncCode NextGen
            <span>•</span>
            Developer Platform
          </div>

        </div>

        {/* RIGHT LOGIN PANEL */}

        <div className="auth-form-panel">

          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">
              SC
            </div>

            <span>
              SyncCode
              <strong> NextGen</strong>
            </span>
          </div>

          <div className="auth-form-container">

            <div className="auth-heading">

              <div className="auth-heading-icon">
                →
              </div>

              <div>
                <span className="auth-eyebrow">
                  WELCOME BACK
                </span>

                <h2>
                  Sign in to SyncCode
                </h2>

                <p>
                  Continue building with your
                  team.
                </p>
              </div>

            </div>

            {error && (
              <div className="auth-alert auth-alert-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              <div className="auth-field">

                <label htmlFor="email">
                  Email address
                </label>

                <div className="auth-input-wrapper">

                  <span className="auth-input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                </div>

              </div>

              <div className="auth-field">

                <div className="auth-label-row">

                  <label htmlFor="password">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="auth-forgot"
                  >
                    Forgot password?
                  </Link>

                </div>

                <div className="auth-input-wrapper">

                  <span className="auth-input-icon">
                    •••
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <label className="auth-checkbox">

                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>

              </label>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span>→</span>
                  </>
                )}

              </button>

            </form>

            <div className="auth-divider">
              <span />
              <p>OR</p>
              <span />
            </div>

            <p className="auth-switch">
              Don't have an account?
              {" "}
              <Link to="/register">
                Create account
              </Link>
            </p>

            <Link
              to="/"
              className="auth-back-home"
            >
              ← Back to SyncCode
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;