const rooms = new Map();

function getRoomStats(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Set(),
      messages: 0,
      codeChanges: 0,
      syncLatencies: [],
      startedAt: Date.now(),
    });
  }

  return rooms.get(roomId);
}

export function addUser(roomId, socketId) {
  const stats = getRoomStats(roomId);

  stats.users.add(socketId);

  return stats;
}

export function removeUser(roomId, socketId) {
  const stats = rooms.get(roomId);

  if (!stats) return;

  stats.users.delete(socketId);

  if (stats.users.size === 0) {
    rooms.delete(roomId);
  }
}

export function recordMessage(roomId) {
  const stats = getRoomStats(roomId);

  stats.messages++;
}

export function recordCodeChange(roomId) {
  const stats = getRoomStats(roomId);

  stats.codeChanges++;
}

export function recordSyncLatency(roomId, latency) {
  const stats = getRoomStats(roomId);

  if (
    typeof latency === "number" &&
    latency >= 0
  ) {
    stats.syncLatencies.push(latency);
  }
}

function average(values) {
  if (!values.length) return 0;

  return (
    values.reduce((a, b) => a + b, 0) /
    values.length
  );
}

function p95(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);

  const index =
    Math.ceil(sorted.length * 0.95) - 1;

  return sorted[Math.max(0, index)];
}

export function getRoomPerformance(roomId) {
  const stats = rooms.get(roomId);

  if (!stats) {
    return {
      users: 0,
      messages: 0,
      codeChanges: 0,
      averageSyncLatency: 0,
      p95SyncLatency: 0,
    };
  }

  return {
    users: stats.users.size,

    messages: stats.messages,

    codeChanges: stats.codeChanges,

    averageSyncLatency:
      average(stats.syncLatencies),

    p95SyncLatency:
      p95(stats.syncLatencies),

    samples: stats.syncLatencies.length,

    runningTime:
      Date.now() - stats.startedAt,
  };
}

export function clearRoomPerformance(roomId) {
  rooms.delete(roomId);
}