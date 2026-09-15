import { useState } from "react";
import "./OutputConsole.css";

function OutputConsole({
  output,
  input,
  setInput,
}) {
  const [activeTab, setActiveTab] = useState("terminal");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = output || "";

    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch (error) {
      console.error("Failed to copy terminal output:", error);
    }
  };

  const hasOutput =
    typeof output === "string" &&
    output.trim().length > 0;

  return (
    <div className="output-console">
      {/* =========================================
          TERMINAL TOP BAR
      ========================================= */}

      <div className="terminal-topbar">
        <div className="terminal-tabs">
          <button
            type="button"
            className={`terminal-tab ${
              activeTab === "terminal"
                ? "terminal-tab-active"
                : ""
            }`}
            onClick={() => setActiveTab("terminal")}
          >
            <span className="terminal-tab-icon">
              &gt;_
            </span>

            <span>Terminal</span>
          </button>

          <button
            type="button"
            className={`terminal-tab ${
              activeTab === "output"
                ? "terminal-tab-active"
                : ""
            }`}
            onClick={() => setActiveTab("output")}
          >
            <span className="terminal-tab-icon">
              ◉
            </span>

            <span>Output</span>
          </button>
        </div>

        <div className="terminal-topbar-right">
          <span className="terminal-session">
            SyncCode Shell
          </span>

          <span className="terminal-status">
            <span className="terminal-status-dot" />
            Ready
          </span>

          <button
            type="button"
            className="terminal-icon-btn"
            onClick={handleCopy}
            disabled={!hasOutput}
            title="Copy output"
          >
            {copied ? "✓" : "⧉"}
          </button>

          <button
            type="button"
            className="terminal-icon-btn"
            title="Terminal menu"
          >
            ⋯
          </button>
        </div>
      </div>

      {/* =========================================
          TERMINAL BODY
      ========================================= */}

      <div className="terminal-body">
        {activeTab === "terminal" ? (
          <>
            <div className="terminal-input-header">
              <span className="terminal-section-label">
                INPUT
              </span>

              <span className="terminal-section-hint">
                stdin
              </span>
            </div>

            <div className="terminal-input-shell">
              <span className="terminal-prompt">
                $
              </span>

              <textarea
                className="console-input"
                placeholder="Enter program input..."
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <>
            <div className="terminal-output-header">
              <span className="terminal-section-label">
                OUTPUT
              </span>

              <span className="terminal-section-hint">
                stdout
              </span>
            </div>

            <div className="terminal-output-panel">
              {!hasOutput ? (
                <div className="terminal-empty">
                  <div className="terminal-empty-icon">
                    &gt;_
                  </div>

                  <div className="terminal-empty-title">
                    No output yet
                  </div>

                  <div className="terminal-empty-text">
                    Run your code to see the program output here.
                  </div>
                </div>
              ) : (
                <pre className="console-output">
                  {output}
                </pre>
              )}
            </div>
          </>
        )}
      </div>

      {/* =========================================
          BOTTOM STATUS BAR
      ========================================= */}

      <div className="terminal-footer">
        <div className="terminal-footer-left">
          <span className="terminal-branch">
            main
          </span>

          <span className="terminal-footer-separator">
            •
          </span>

          <span>
            UTF-8
          </span>

          <span className="terminal-footer-separator">
            •
          </span>

          <span>
            LF
          </span>
        </div>

        <div className="terminal-footer-right">
          <span>
            {hasOutput
              ? `${output.length} chars`
              : "Waiting for output"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OutputConsole;
