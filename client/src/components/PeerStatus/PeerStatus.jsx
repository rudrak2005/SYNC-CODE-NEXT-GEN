function PeerStatus({
  peerStatuses
}) {

  const statuses =
    Object.entries(
      peerStatuses
    );

  return (
    <div className="peer-status">

      <span>
        P2P
      </span>

      {statuses.length === 0 ? (

        <span className="peer-status-muted">
          No peers
        </span>

      ) : (

        statuses.map(
          ([peerId, status]) => (

            <span
              key={peerId}
              className={
                status === "connected"
                  ? "peer-online"
                  : "peer-connecting"
              }
            >
              ●
              {status}
            </span>

          )
        )

      )}

    </div>
  );
}

export default PeerStatus;