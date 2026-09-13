import React, {
  useState,
} from "react";

import {
  generateTests,
} from "../../services/aiApi";

import "./AITestGenerator.css";

export default function AITestGenerator({
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

  const handleGenerateTests =
    async () => {
      if (loading) return;

      if (!code.trim()) {
        setError(
          "There is no code to test."
        );

        return;
      }

      setLoading(true);
      setError("");
      setResult("");

      try {
        const response =
          await generateTests(
            code,
            language
          );

        console.log(
          "AI Test Response:",
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
          "AI Test Generation Error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Test generation failed."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <section className="ai-test-panel">

      <div className="ai-test-header">

        <div>
          <h3>
            AI Test Generator
          </h3>

          <p>
            Generate test cases and edge cases
          </p>
        </div>

        <span>
          Gemini
        </span>

      </div>

      <div className="ai-test-meta">

        <span>
          {language}
        </span>

        <span>
          {code.length} chars
        </span>

      </div>

      <button
        type="button"
        className="ai-test-button"
        onClick={
          handleGenerateTests
        }
        disabled={loading}
      >
        {loading
          ? "Generating..."
          : "Generate Tests"}
      </button>

      {error && (
        <div className="ai-test-error">

          <strong>
            Error
          </strong>

          <span>
            {error}
          </span>

        </div>
      )}

      {result && (
        <div className="ai-test-result">

          <div className="ai-test-result-header">

            <span>
              Generated Tests
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