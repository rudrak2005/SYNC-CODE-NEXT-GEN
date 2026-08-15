import { useParams, Link } from "react-router-dom";

function Room() {
  const { roomId } = useParams();

  return (
    <div className="room-page">

      <header className="room-header">

        <Link to="/dashboard">
          ← Dashboard
        </Link>
        <Link
  to={`/room/${roomId}/editor`}
  className="primary-btn"
>
  Open Code Editor
</Link>

        <div>
          <strong>Room</strong>

          <span className="room-id">
            {roomId}
          </span>
        </div>

        <span className="online-status">
          ● Online
        </span>

      </header>

      <main className="room-lobby">

        <section className="room-welcome">

          <h1>
            Collaborative Room
          </h1>

          <p>
            Your team workspace is ready.
          </p>

          <div className="room-id-box">
            {roomId}
          </div>

        </section>

        <section className="room-info">

          <h2>Room Members</h2>

          <div className="member-card">
            <div className="avatar">
              R
            </div>

            <div>
              <strong>
                You
              </strong>

              <span>
                Owner
              </span>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Room;