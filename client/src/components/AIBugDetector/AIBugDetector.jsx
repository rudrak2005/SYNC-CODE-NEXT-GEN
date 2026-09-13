import React, {
  useState,
} from "react";

import {
  detectBugs,
} from "../../services/aiApi";

import "./AIBugDetector.css";

export default function AIBugDetector({
  code = "",
  language = "javascript",
}) {
  const [result, setResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleDetectBugs =
    async () => {
      if (loading) return;

      if (!code.trim()) {
        setError(
          "There is no code to analyze."
        );

        return;
      }

      setLoading(true);
      setError("");
      setResult("");

      try {
        const response =
          await detectBugs(
            code,
            language
          );

        console.log(
          "Bug Detection Response:",
          response
        );

        if (
          response?.success &&
          response?.data?.text
        ) {
          setResult(
            response.data.text
          );
        } else {
          setError(
            "AI returned an empty result."
          );
        }
      } catch (err) {
        console.error(
          "Bug detection error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Bug detection failed."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <section className="ai-bug-panel">

      <div className="ai-bug-header">

        <div>
          <h3>
            AI Bug Detector
          </h3>

          <p>
            Detect logic and runtime risks
          </p>
        </div>

        <span>
          Gemini
        </span>

      </div>

      <div className="ai-bug-meta">
        <span>
          {language}
        </span>

        <span>
          {code.length} chars
        </span>
      </div>

      <button
        type="button"
        className="ai-bug-button"
        onClick={
          handleDetectBugs
        }
        disabled={loading}
      >
        {loading
          ? "Detecting..."
          : "Detect Bugs"}
      </button>

      {error && (
        <div className="ai-bug-error">
          <strong>Error</strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {result && (
        <div className="ai-bug-result">

          <div className="ai-bug-result-header">

            <span>
              Bug Report
            </span>

            <button
              type="button"
              onClick={() =>
                setResult("")
              }
            >
              Clear
            </button>

          </div>

          <pre>
            {result}
          </pre>

        </div>
      )}

    </section>
  );
}