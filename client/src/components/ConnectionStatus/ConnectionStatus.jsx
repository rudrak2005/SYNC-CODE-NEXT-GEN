function ConnectionStatus({
  status,
  queuedChanges
}) {

  let label =
    "Connected";

  let className =
    "connection-status connected";


  if (
    status ===
    "reconnecting"
  ) {

    label =
      "Reconnecting...";

    className =
      "connection-status reconnecting";

  } else if (
    status ===
    "disconnected"
  ) {

    label =
      "Offline";

    className =
      "connection-status disconnected";
  }


  return (
    <div
      className={
        className
      }
    >

      <span className="connection-dot">
        ●
      </span>

      <span>
        {label}
      </span>

      {queuedChanges >
        0 && (

        <span className="queue-count">
          {queuedChanges}
          {" "}queued
        </span>

      )}

    </div>
  );
}


export default ConnectionStatus;