import React, {
  useState,
} from "react";

import {
  generateCodeDiff,
} from "../../services/aiApi";

import "./AIDiffViewer.css";

function createSimpleDiff(
  original,
  proposed
) {
  const oldLines =
    original.split("\n");

  const newLines =
    proposed.split("\n");

  const maxLength =
    Math.max(
      oldLines.length,
      newLines.length
    );

  const result = [];

  for (
    let i = 0;
    i < maxLength;
    i++
  ) {
    const oldLine =
      oldLines[i];

    const newLine =
      newLines[i];

    if (
      oldLine === newLine
    ) {
      result.push({
        type: "same",

        line:
          oldLine ?? "",
      });

      continue;
    }

    if (
      oldLine !== undefined
    ) {
      result.push({
        type: "remove",

        line: oldLine,
      });
    }

    if (
      newLine !== undefined
    ) {
      result.push({
        type: "add",

        line: newLine,
      });
    }
  }

  return result;
}

export default function AIDiffViewer({
  code = "",
  language = "javascript",
  onApply,
}) {
  const [
    instruction,
    setInstruction,
  ] = useState("");

  const [
    diff,
    setDiff,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const handleGenerate =
    async () => {
      if (
        !instruction.trim()
      ) {
        setError(
          "Describe the change first."
        );

        return;
      }

      if (!code.trim()) {
        setError(
          "There is no code to modify."
        );

        return;
      }

      setLoading(true);

      setError("");

      try {
        const response =
          await generateCodeDiff({
            originalCode:
              code,

            instruction:
              instruction.trim(),

            language,
          });

        setDiff(
          response?.data ||
          null
        );
      } catch (err) {
        console.error(
          "AI diff error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Diff generation failed."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleApply =
    () => {
      if (
        !diff?.proposedCode
      ) {
        return;
      }

      if (
        typeof onApply ===
        "function"
      ) {
        onApply(
          diff.proposedCode
        );
      }

      setDiff(null);
      setInstruction("");
    };

  const rows = diff
    ? createSimpleDiff(
        diff.originalCode,
        diff.proposedCode
      )
    : [];

  return (
    <section className="ai-diff">

      <div className="ai-diff-header">

        <div>
          <h3>
            AI Shared Diff
          </h3>

          <p>
            Review AI changes before applying
          </p>
        </div>

        <span>
          {language}
        </span>

      </div>

      <textarea
        value={
          instruction
        }
        onChange={(event) =>
          setInstruction(
            event.target.value
          )
        }
        placeholder="Example: Add input validation to this function"
        disabled={loading}
      />

      <button
        type="button"
        className="ai-diff-generate"
        onClick={
          handleGenerate
        }
        disabled={loading}
      >
        {loading
          ? "Generating..."
          : "Generate Diff"}
      </button>

      {error && (
        <div className="ai-diff-error">
          {error}
        </div>
      )}

      {diff && (
        <div className="ai-diff-result">

          <div className="ai-diff-result-header">
            <span>
              Proposed Changes
            </span>

            <span>
              Approval Required
            </span>
          </div>

          <div className="ai-diff-code">

            {rows.map(
              (row, index) => (
                <div
                  key={index}
                  className={
                    `ai-diff-line ${row.type}`
                  }
                >
                  <span className="ai-diff-marker">
                    {row.type ===
                    "add"
                      ? "+"
                      : row.type ===
                        "remove"
                      ? "-"
                      : " "}
                  </span>

                  <pre>
                    {row.line}
                  </pre>
                </div>
              )
            )}

          </div>

          <div className="ai-diff-actions">

            <button
              type="button"
              className="ai-diff-reject"
              onClick={() =>
                setDiff(null)
              }
            >
              Reject
            </button>

            <button
              type="button"
              className="ai-diff-apply"
              onClick={
                handleApply
              }
            >
              Approve & Apply
            </button>

          </div>

        </div>
      )}

    </section>
  );
}