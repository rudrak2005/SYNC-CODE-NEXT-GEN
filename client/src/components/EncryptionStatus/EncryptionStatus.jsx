function EncryptionStatus({
  enabled
}) {

  return (
    <div
      className={
        enabled
          ? "encryption-status enabled"
          : "encryption-status"
      }
    >

      <span>
        {enabled
          ? "🔐"
          : "🔓"}
      </span>

      <span>
        {enabled
          ? "Secure Sync"
          : "Normal Sync"}
      </span>

    </div>
  );
}

export default EncryptionStatus;