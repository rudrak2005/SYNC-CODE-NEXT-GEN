import React, {
  useState,
} from "react";

import {
  reviewCode,
} from "../../services/aiApi";

import "./AIReviewPanel.css";

export default function AIReviewPanel({
  code = "",
  language = "javascript",
}) {
  const [
    result,
    setResult,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const handleReview = async () => {
    if (loading) return;

    if (!code.trim()) {
      setError(
        "There is no code to review."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const response =
        await reviewCode(
          code,
          language
        );

      console.log(
        "AI Review Response:",
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
          "AI returned an empty review."
        );
      }
    } catch (err) {
      console.error(
        "AI Review Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Code review failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-review-panel">

      <div className="ai-review-header">
        <div>
          <h3>
            AI Code Review
          </h3>

          <p>
            Find bugs, security and quality issues
          </p>
        </div>

        <span>
          Gemini
        </span>
      </div>

      <div className="ai-review-meta">
        <span>
          {language}
        </span>

        <span>
          {code.length} chars
        </span>
      </div>

      <button
        type="button"
        className="ai-review-button"
        onClick={handleReview}
        disabled={loading}
      >
        {loading
          ? "Reviewing..."
          : "Review Code"}
      </button>

      {error && (
        <div className="ai-review-error">
          {error}
        </div>
      )}

      {result && (
        <div className="ai-review-result">
          <div className="ai-review-result-title">
            <span>
              Review Result
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