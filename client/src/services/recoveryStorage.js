const STORAGE_PREFIX = "synccode_recovery_";

export function getRecoveryKey(roomId) {
  return `${STORAGE_PREFIX}${roomId}`;
}

export function saveRecoverySnapshot(roomId, snapshot) {
  if (!roomId || !snapshot) return false;

  try {
    const data = {
      ...snapshot,
      roomId,
      savedAt: Date.now(),
    };

    localStorage.setItem(
      getRecoveryKey(roomId),
      JSON.stringify(data)
    );

    return true;
  } catch (error) {
    console.error("Recovery save failed:", error);
    return false;
  }
}

export function getRecoverySnapshot(roomId) {
  if (!roomId) return null;

  try {
    const raw = localStorage.getItem(getRecoveryKey(roomId));

    if (!raw) return null;

    return JSON.parse(raw);
  } catch (error) {
    console.error("Recovery read failed:", error);
    return null;
  }
}

export function hasRecoverySnapshot(roomId) {
  return !!getRecoverySnapshot(roomId);
}

export function clearRecoverySnapshot(roomId) {
  if (!roomId) return false;

  try {
    localStorage.removeItem(getRecoveryKey(roomId));
    return true;
  } catch (error) {
    console.error("Recovery clear failed:", error);
    return false;
  }
}