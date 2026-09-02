import React from "react";
import "./RecoveryStatus.css";

export default function RecoveryStatus({
  status,
  hasRecovery,
  onRecover,
  onDiscard,
}) {
  if (!hasRecovery && status !== "recovering") {
    return null;
  }

  if (status === "recovering") {
    return (
      <div className="recovery-status recovering">
        Recovering project...
      </div>
    );
  }

  return (
    <div className="recovery-status">
      <span className="recovery-text">
        Unsaved recovery data available
      </span>

      <button onClick={onRecover}>
        Recover
      </button>

      <button
        className="discard-btn"
        onClick={onDiscard}
      >
        Discard
      </button>
    </div>
  );
}