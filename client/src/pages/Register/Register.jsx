import { useState } from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";
import "../Login/Auth.css";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const {
    setAuthenticatedUser
  } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
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

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/auth/register",
        {
          name: form.name.trim(),
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
          "Registration succeeded but session data was not returned."
        );
      }

      setAuthenticatedUser(
        token,
        authenticatedUser
      );

      navigate(
        "/dashboard",
        {
          replace: true
        }
      );

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again."
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

        {/* LEFT */}

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
              Start Your Developer Journey
            </div>

            <h1>
              Your
              <br />
              workspace.
              <br />
              <span>Your team.</span>
            </h1>

            <p>
              Create your workspace and
              experience collaborative coding
              powered by real-time sync and AI.
            </p>

            <div className="auth-feature-list">

              <div className="auth-feature">
                <span>✓</span>
                Multi-user coding workspace
              </div>

              <div className="auth-feature">
                <span>✓</span>
                Version history & recovery
              </div>

              <div className="auth-feature">
                <span>✓</span>
                AI-assisted development
              </div>

            </div>

          </div>

          <div className="auth-brand-footer">
            Built for modern developers
          </div>

        </div>

        {/* RIGHT */}

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
                +
              </div>

              <div>

                <span className="auth-eyebrow">
                  CREATE ACCOUNT
                </span>

                <h2>
                  Join SyncCode
                </h2>

                <p>
                  Create your developer workspace.
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

                <label htmlFor="name">
                  Full name
                </label>

                <div className="auth-input-wrapper">

                  <span className="auth-input-icon">
                    ◉
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />

                </div>

              </div>

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

                <label htmlFor="password">
                  Password
                </label>

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
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <div className="auth-field">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="auth-input-wrapper">

                  <span className="auth-input-icon">
                    •••
                  </span>

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
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
              Already have an account?
              {" "}
              <Link to="/login">
                Sign in
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

export default Register;