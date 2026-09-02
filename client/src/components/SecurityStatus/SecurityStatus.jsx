function SecurityStatus({
  encrypted
}) {

  return (
    <div
      className={
        encrypted
          ? "security-status secure"
          : "security-status"
      }
    >
      <span className="security-icon">
        {encrypted
          ? "🔐"
          : "🔓"}
      </span>

      <span>
        {encrypted
          ? "Encrypted"
          : "Local Backup"}
      </span>
    </div>
  );
}

export default SecurityStatus;