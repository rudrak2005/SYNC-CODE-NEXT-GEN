import React, { useState } from "react";
import { explainCode } from "../../services/aiApi";
import "./AIPanel.css";

export default function AIPanel({
  code = "",
  language = "javascript",
}) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExplain = async () => {
    if (loading) return;

    if (!code.trim()) {
      setError("There is no code to explain.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const result = await explainCode(code, language);

      console.log("AI response:", result);

      if (result?.success && result?.data?.text) {
        setResponse(result.data.text);
      } else {
        setError("AI returned an empty response.");
      }
    } catch (err) {
      console.error("AI Explain Error:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to explain code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="synccode-ai-panel">
      <div className="synccode-ai-header">
        <div className="synccode-ai-title-wrap">
          <div className="synccode-ai-icon">✦</div>

          <div>
            <h3>AI Code Explainer</h3>
            <p>Powered by Gemini</p>
          </div>
        </div>

        <span className="synccode-ai-badge">
          Gemini
        </span>
      </div>

      <div className="synccode-ai-info">
        <span>Language: {language}</span>
        <span>
          {code.length} characters
        </span>
      </div>

      <button
        type="button"
        className="synccode-ai-button"
        onClick={handleExplain}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="synccode-ai-spinner" />
            Analyzing...
          </>
        ) : (
          <>
            ✨ Explain Code
          </>
        )}
      </button>

      {error && (
        <div className="synccode-ai-error">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="synccode-ai-result">
          <div className="synccode-ai-result-header">
            <span>AI Explanation</span>

            <button
              type="button"
              className="synccode-ai-clear"
              onClick={() => setResponse("")}
            >
              Clear
            </button>
          </div>

          <div className="synccode-ai-result-content">
            <pre>{response}</pre>
          </div>
        </div>
      )}
    </div>
  );
}