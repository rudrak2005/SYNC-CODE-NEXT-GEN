import json
from pathlib import Path

import matplotlib.pyplot as plt


RESULT_FILE = (
    Path(__file__).parent.parent
    / "results"
    / "performance-results.json"
)

GRAPH_FILE = (
    Path(__file__).parent.parent
    / "results"
    / "sync-latency.png"
)


def load_results():
    try:
        with open(RESULT_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        print("performance-results.json not found")
        return None
    except json.JSONDecodeError:
        print("Invalid JSON in performance-results.json")
        return None


def main():
    data = load_results()

    if not data:
        return

    users = []
    latency = []

    for result in data.get("results", []):
        user_count = result.get("concurrentUsers")
        avg_latency = result.get("averageSyncLatencyMs")

        if (
            isinstance(user_count, int)
            and isinstance(avg_latency, (int, float))
        ):
            users.append(user_count)
            latency.append(avg_latency)

    if not users:
        print("No actual latency data available.")
        return

    plt.figure(figsize=(8, 5))

    plt.plot(
        users,
        latency,
        marker="o"
    )

    plt.xlabel("Concurrent Users")
    plt.ylabel("Average Sync Latency (ms)")
    plt.title("SyncCode NextGen - Sync Latency")

    plt.grid(True)
    plt.tight_layout()

    plt.savefig(GRAPH_FILE, dpi=150)

    print(f"Graph saved to: {GRAPH_FILE}")


if __name__ == "__main__":
    main()