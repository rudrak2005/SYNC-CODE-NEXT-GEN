import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

function JoinRoom() {
  const [roomId, setRoomId] = useState("");

  return (
    <div className="form-page">

      <div className="form-card">

        <Link to="/dashboard">
          ← Dashboard
        </Link>

        <h1>Join Room</h1>

        <p>
          Enter the room ID shared by your teammate.
        </p>

        <label>
          Room ID
        </label>

        <Input
          placeholder="SC-XXXXXX"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <Button>
          Join Room
        </Button>

      </div>

    </div>
  );
}

export default JoinRoom;