import React, { useEffect, useState } from "react";

import {
  getPerformanceSummary,
} from "../../services/performanceMonitor";

export default function PerformancePanel() {
  const [stats, setStats] = useState(
    getPerformanceSummary()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(
        getPerformanceSummary()
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #333",
        marginTop: "10px",
      }}
    >
      <h3>Performance</h3>

      <p>
        Sync Samples:{" "}
        {stats.totalSyncSamples}
      </p>

      <p>
        Avg Sync Latency:{" "}
        {stats.averageSyncLatency.toFixed(2)} ms
      </p>

      <p>
        P95 Latency:{" "}
        {stats.p95SyncLatency.toFixed(2)} ms
      </p>

      <p>
        Avg Recovery Time:{" "}
        {stats.averageRecoveryTime.toFixed(2)} ms
      </p>

      <p>
        Messages: {stats.messages}
      </p>

      <p>
        Code Changes: {stats.codeChanges}
      </p>
    </div>
  );
}