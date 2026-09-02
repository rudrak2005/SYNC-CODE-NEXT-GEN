import { useCallback, useEffect, useRef, useState } from "react";

import {
  saveRecoverySnapshot as saveLocalRecovery,
  getRecoverySnapshot,
  clearRecoverySnapshot,
} from "../services/recoveryStorage";

export default function useProjectRecovery({
  roomId,
  files,
  activeFile,
  projectRevision,
  socket,
  onProjectRecovered,
}) {
  const [recoveryStatus, setRecoveryStatus] = useState("idle");
  const [hasUnsavedRecovery, setHasUnsavedRecovery] = useState(false);

  const saveTimerRef = useRef(null);
  const lastSavedDataRef = useRef("");

  // Check existing recovery when room opens
  useEffect(() => {
    if (!roomId) return;

    const snapshot = getRecoverySnapshot(roomId);

    if (snapshot) {
      setHasUnsavedRecovery(true);
      setRecoveryStatus("available");
    } else {
      setHasUnsavedRecovery(false);
      setRecoveryStatus("idle");
    }
  }, [roomId]);

  // Automatically create recovery snapshot
  useEffect(() => {
    if (!roomId || !files || files.length === 0) return;

    clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      try {
        const snapshot = {
          files,
          activeFile,
          projectRevision,
        };

        const serialized = JSON.stringify(snapshot);

        // Avoid writing identical snapshots
        if (serialized === lastSavedDataRef.current) {
          return;
        }

        const saved = saveLocalRecovery(roomId, snapshot);

        if (saved) {
          lastSavedDataRef.current = serialized;
          setHasUnsavedRecovery(true);
          setRecoveryStatus("available");
        }
      } catch (error) {
        console.error("Auto recovery snapshot failed:", error);
        setRecoveryStatus("error");
      }
    }, 1000);

    return () => {
      clearTimeout(saveTimerRef.current);
    };
  }, [roomId, files, activeFile, projectRevision]);

  // Recover from local snapshot
  const recoverLocalSnapshot = useCallback(() => {
    if (!roomId) return false;

    const snapshot = getRecoverySnapshot(roomId);

    if (!snapshot) {
      setRecoveryStatus("idle");
      setHasUnsavedRecovery(false);
      return false;
    }

    try {
      if (onProjectRecovered) {
        onProjectRecovered(snapshot);
      }

      setHasUnsavedRecovery(false);
      setRecoveryStatus("recovered");

      return true;
    } catch (error) {
      console.error("Local recovery failed:", error);
      setRecoveryStatus("error");

      return false;
    }
  }, [roomId, onProjectRecovered]);

  // Ask server for latest project state
  const recoverFromServer = useCallback(() => {
    if (!socket || !socket.connected || !roomId) {
      return false;
    }

    setRecoveryStatus("recovering");

    socket.emit(
      "project:recover",
      {
        roomId,
      },
      (response) => {
        if (!response?.success) {
          setRecoveryStatus("error");
          return;
        }

        if (onProjectRecovered && response.project) {
          onProjectRecovered(response.project);
        }

        setRecoveryStatus("recovered");
        setHasUnsavedRecovery(false);
      }
    );

    return true;
  }, [socket, roomId, onProjectRecovered]);

  const saveRecovery = useCallback(() => {
    if (!roomId || !files || files.length === 0) {
      return false;
    }

    const snapshot = {
      files,
      activeFile,
      projectRevision,
    };

    const saved = saveLocalRecovery(roomId, snapshot);

    if (saved) {
      setHasUnsavedRecovery(true);
      setRecoveryStatus("available");
    }

    return saved;
  }, [roomId, files, activeFile, projectRevision]);

  const discardLocalRecovery = useCallback(() => {
    if (!roomId) return;

    clearRecoverySnapshot(roomId);

    setHasUnsavedRecovery(false);
    setRecoveryStatus("idle");
    lastSavedDataRef.current = "";
  }, [roomId]);

  // Re-check recovery after socket reconnect
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleReconnect = () => {
      const snapshot = getRecoverySnapshot(roomId);

      if (snapshot) {
        setHasUnsavedRecovery(true);
        setRecoveryStatus("available");
      }
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [socket, roomId]);

  return {
    recoveryStatus,
    hasUnsavedRecovery,
    saveRecovery,
    recoverLocalSnapshot,
    recoverFromServer,
    discardLocalRecovery,
  };
}