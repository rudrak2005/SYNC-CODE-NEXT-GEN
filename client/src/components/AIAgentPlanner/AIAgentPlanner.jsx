import React, {
  useState,
} from "react";

import {
  createAgentPlan,
} from "../../services/aiApi";

import "./AIAgentPlanner.css";

export default function AIAgentPlanner({
  code = "",
  language = "javascript",
}) {
  const [task, setTask] =
    useState("");

  const [projectContext, setProjectContext] =
    useState("");

  const [result, setResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handlePlan = async () => {
    if (loading) return;

    if (!task.trim()) {
      setError(
        "Describe the task first."
      );

      return;
    }

    setLoading(true);

    setError("");
    setResult("");

    try {
      const response =
        await createAgentPlan({
          task,

          code,

          language,

          projectContext,
        });

      console.log(
        "Agent Planner Response:",
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
          "AI returned an empty plan."
        );
      }
    } catch (err) {
      console.error(
        "Agent Planner Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Agent planning failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="agent-planner">

      <div className="agent-planner-header">

        <div>
          <h3>
            AI Agent Planner
          </h3>

          <p>
            Convert your task into implementation steps
          </p>
        </div>

        <span>
          Gemini
        </span>

      </div>

      <label>
        Task
      </label>

      <textarea
        className="agent-planner-task"
        value={task}
        onChange={(event) =>
          setTask(
            event.target.value
          )
        }
        placeholder="Example: Add dark mode to this React project"
        disabled={loading}
      />

      <label>
        Project Context
      </label>

      <textarea
        className="agent-planner-context"
        value={projectContext}
        onChange={(event) =>
          setProjectContext(
            event.target.value
          )
        }
        placeholder="Optional: describe project structure, requirements, constraints..."
        disabled={loading}
      />

      <div className="agent-planner-code-info">
        <span>
          Current file: {code
            ? `${code.length} chars`
            : "No code"}
        </span>

        <span>
          {language}
        </span>
      </div>

      <button
        type="button"
        className="agent-planner-button"
        onClick={handlePlan}
        disabled={loading}
      >
        {loading
          ? "Planning..."
          : "Create Plan"}
      </button>

      {error && (
        <div className="agent-planner-error">
          <strong>
            Error
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {result && (
        <div className="agent-planner-result">

          <div className="agent-planner-result-header">

            <span>
              Implementation Plan
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