import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

function CreateProject() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/rooms",
        {
          name
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const room = response.data.room;

      navigate(`/room/${room.roomId}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to create room"
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

        <h1>Create Room</h1>

        <p>
          Create a collaborative coding room.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <label>
            Room Name
          </label>

          <input
            className="input-field"
            type="text"
            placeholder="My Coding Room"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Room"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default CreateProject;