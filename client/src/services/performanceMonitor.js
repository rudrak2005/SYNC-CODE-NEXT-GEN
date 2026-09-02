const performanceData = {
  sync: [],
  recovery: [],
  messages: 0,
  codeChanges: 0,
};

export function recordSyncLatency(latency) {
  if (typeof latency !== "number" || latency < 0) return;

  performanceData.sync.push({
    latency,
    timestamp: Date.now(),
  });
}

export function recordRecoveryTime(time) {
  if (typeof time !== "number" || time < 0) return;

  performanceData.recovery.push({
    time,
    timestamp: Date.now(),
  });
}

export function recordCodeChange() {
  performanceData.codeChanges += 1;
}

export function recordMessage() {
  performanceData.messages += 1;
}

export function getSyncLatencies() {
  return [...performanceData.sync];
}

export function getPerformanceData() {
  return {
    sync: [...performanceData.sync],
    recovery: [...performanceData.recovery],
    messages: performanceData.messages,
    codeChanges: performanceData.codeChanges,
  };
}

export function calculateAverage(values) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

export function calculateP95(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);

  const index = Math.ceil(sorted.length * 0.95) - 1;

  return sorted[Math.max(0, index)];
}

export function getPerformanceSummary() {
  const syncValues = performanceData.sync.map(
    item => item.latency
  );

  const recoveryValues = performanceData.recovery.map(
    item => item.time
  );

  return {
    totalSyncSamples: syncValues.length,

    averageSyncLatency: calculateAverage(syncValues),

    p95SyncLatency: calculateP95(syncValues),

    averageRecoveryTime: calculateAverage(
      recoveryValues
    ),

    messages: performanceData.messages,

    codeChanges: performanceData.codeChanges,
  };
}

export function resetPerformanceData() {
  performanceData.sync = [];
  performanceData.recovery = [];
  performanceData.messages = 0;
  performanceData.codeChanges = 0;
}