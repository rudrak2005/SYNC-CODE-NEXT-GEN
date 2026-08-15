import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

function JoinRoom() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const normalizedRoomId = roomId
        .trim()
        .toUpperCase();

      const response = await api.post(
        `/rooms/${normalizedRoomId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate(`/room/${response.data.room.roomId}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to join room"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">

      <div className="form-card">

        <Link to="/dashboard">
          ← Dashboard
        </Link>

        <h1>Join Room</h1>

        <p>
          Enter the Room ID shared by your teammate.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <label>
            Room ID
          </label>

          <input
            className="input-field"
            type="text"
            placeholder="SC-A72F9B31"
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value)
            }
            required
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Joining..."
              : "Join Room"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default JoinRoom;