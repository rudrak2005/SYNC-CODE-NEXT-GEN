import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "../../services/api";

import "./JoinRoom.css";

function JoinRoom() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedRoomId =
      roomId.trim().toUpperCase();

    if (!normalizedRoomId) {
      setError("Please enter a Room ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response = await api.post(
        `/rooms/${normalizedRoomId}/join`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const room =
        response.data?.room;

      if (!room?.roomId) {
        throw new Error(
          "Room joined but Room ID was not returned."
        );
      }

      navigate(
        `/room/${room.roomId}`
      );

    } catch (error) {
      console.error(
        "Join room error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to join room."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleRoomIdChange = (e) => {
    const value =
      e.target.value
        .toUpperCase()
        .replace(/\s/g, "");

    setRoomId(value);
    setError("");
  };

  return (
    <div className="join-room-page">

      <div className="join-room-grid" />

      <div className="join-room-glow join-room-glow-one" />
      <div className="join-room-glow join-room-glow-two" />

      <main className="join-room-shell">

        <div className="join-room-topbar">

          <Link
            to="/dashboard"
            className="join-room-back"
          >
            <span>←</span>
            Dashboard
          </Link>

          <div className="join-room-product">

            <div className="join-room-product-icon">
              SC
            </div>

            <span>
              SyncCode
              <strong> NextGen</strong>
            </span>

          </div>

        </div>


        <div className="join-room-center">

          <div className="join-room-card">

            <div className="join-room-icon">
              ↪
            </div>

            <div className="join-room-badge">
              TEAM COLLABORATION
            </div>

            <h1>
              Join a coding room
            </h1>

            <p>
              Enter the Room ID shared by
              your teammate and start
              collaborating in real time.
            </p>


            {error && (
              <div className="join-room-error">

                <span>!</span>

                <p>
                  {error}
                </p>

              </div>
            )}


            <form
              className="join-room-form"
              onSubmit={handleSubmit}
            >

              <label htmlFor="room-id">
                Room ID
              </label>

              <div className="join-room-input-wrap">

                <span className="join-room-input-icon">
                  #
                </span>

                <input
                  id="room-id"
                  type="text"
                  placeholder="SC-A72F9B31"
                  value={roomId}
                  onChange={handleRoomIdChange}
                  maxLength={30}
                  autoComplete="off"
                  autoFocus
                />

              </div>

              <small>
                Example: SC-A72F9B31
              </small>


              <button
                className="join-room-submit"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="join-room-spinner" />
                    Joining room...
                  </>
                ) : (
                  <>
                    Join Room
                    <span>→</span>
                  </>
                )}

              </button>

            </form>


            <div className="join-room-divider">
              <span />
              <p>SECURE COLLABORATION</p>
              <span />
            </div>


            <div className="join-room-features">

              <div>

                <div className="join-feature-icon purple">
                  👥
                </div>

                <strong>
                  Multi-user
                </strong>

                <span>
                  Code together
                </span>

              </div>


              <div>

                <div className="join-feature-icon cyan">
                  ⚡
                </div>

                <strong>
                  Real-time
                </strong>

                <span>
                  Instant sync
                </span>

              </div>


              <div>

                <div className="join-feature-icon green">
                  🔒
                </div>

                <strong>
                  Secure
                </strong>

                <span>
                  Protected room
                </span>

              </div>

            </div>

          </div>


          <div className="join-room-help">

            Don't have a Room ID?

            <Link to="/create-project">
              Create a new room →
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

export default JoinRoom;