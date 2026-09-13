import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "../../services/api";

import "./CreateProject.css";

function CreateProject() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a room name.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/rooms",
        {
          name: trimmedName
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const room = response.data.room;

      if (!room?.roomId) {
        throw new Error(
          "Room was created but Room ID was not returned."
        );
      }

      navigate(`/room/${room.roomId}`);
    } catch (error) {
      console.error(
        "Create room error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Failed to create room."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-room-page">

      <div className="create-room-grid" />

      <div className="create-room-glow create-room-glow-one" />
      <div className="create-room-glow create-room-glow-two" />

      <main className="create-room-shell">

        <div className="create-room-topbar">

          <Link
            to="/dashboard"
            className="create-room-back"
          >
            <span>←</span>
            Dashboard
          </Link>

          <div className="create-room-product">
            <div className="create-room-product-icon">
              SC
            </div>

            <span>
              SyncCode
              <strong> NextGen</strong>
            </span>
          </div>

        </div>

        <div className="create-room-content">

          <div className="create-room-side">

            <div className="create-room-badge">
              <span />
              COLLABORATIVE DEVELOPMENT
            </div>

            <h1>
              Create your
              <span>
                {" "}coding room.
              </span>
            </h1>

            <p>
              Start a real-time collaborative
              workspace and invite your team
              to code together.
            </p>

            <div className="create-room-features">

              <div className="create-room-feature">
                <div className="feature-icon purple">
                  ◈
                </div>

                <div>
                  <strong>
                    Real-time collaboration
                  </strong>

                  <span>
                    Edit code together instantly.
                  </span>
                </div>
              </div>

              <div className="create-room-feature">
                <div className="feature-icon cyan">
                  ⚡
                </div>

                <div>
                  <strong>
                    Browser execution
                  </strong>

                  <span>
                    Run supported code directly
                    from your workspace.
                  </span>
                </div>
              </div>

              <div className="create-room-feature">
                <div className="feature-icon green">
                  ✓
                </div>

                <div>
                  <strong>
                    Persistent workspace
                  </strong>

                  <span>
                    Your room state can be saved
                    and recovered.
                  </span>
                </div>
              </div>

            </div>

          </div>

          <section className="create-room-card">

            <div className="create-room-card-icon">
              +
            </div>

            <div className="create-room-card-heading">

              <span>
                NEW ROOM
              </span>

              <h2>
                Create Room
              </h2>

              <p>
                Give your collaboration room
                a name to get started.
              </p>

            </div>

            {error && (
              <div className="create-room-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <form
              className="create-room-form"
              onSubmit={handleSubmit}
            >

              <div className="create-room-field">

                <label htmlFor="room-name">
                  Room name
                </label>

                <div className="create-room-input-wrap">

                  <span>
                    ◇
                  </span>

                  <input
                    id="room-name"
                    type="text"
                    placeholder="e.g. DSA Practice"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    maxLength={80}
                    autoComplete="off"
                  />

                </div>

                <small>
                  Choose a simple name that your
                  collaborators can recognize.
                </small>

              </div>

              <button
                className="create-room-submit"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="create-room-spinner" />
                    Creating room...
                  </>
                ) : (
                  <>
                    Create Room
                    <span>→</span>
                  </>
                )}

              </button>

            </form>

            <div className="create-room-security">

              <div>
                <span>🔒</span>
                Secure room access
              </div>

              <div>
                <span>👥</span>
                Multi-user editing
              </div>

              <div>
                <span>⚡</span>
                Real-time sync
              </div>

            </div>

          </section>

        </div>

      </main>
    </div>
  );
}

export default CreateProject;