import React, {
  useState,
} from "react";

import {
  createAgentWorkflow,
  validateAgentWorkflow,
  runAgentWorkflow,
} from "../../services/aiApi";

import "./AIAgentWorkflow.css";

export default function AIAgentWorkflow({
  code = "",
  language = "javascript",
}) {
  const [task, setTask] =
    useState("");

  const [workflow, setWorkflow] =
    useState(null);

  const [validation, setValidation] =
    useState("");

  const [execution, setExecution] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const createWorkflow =
    async () => {
      if (!task.trim()) {
        setError(
          "Describe your task."
        );

        return;
      }

      setLoading(true);

      setError("");

      setWorkflow(null);
      setValidation("");
      setExecution(null);

      try {
        const response =
          await createAgentWorkflow({
            task,

            code,

            language,

            projectContext:
              `Current file language: ${language}`,
          });

        setWorkflow(
          response?.data || null
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Workflow creation failed."
        );
      } finally {
        setLoading(false);
      }
    };

  const validate =
    async () => {
      if (!workflow?.plan) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await validateAgentWorkflow({
            task,

            plan:
              workflow.plan,

            language,
          });

        setValidation(
          response?.data?.text ||
          ""
        );
      } catch (err) {
        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Validation failed."
        );
      } finally {
        setLoading(false);
      }
    };

  const run =
    async () => {
      if (
        !workflow?.plan
      ) {
        return;
      }

      const steps =
        workflow.plan
          .split("\n")
          .filter(
            (line) =>
              /^\s*\d+\./.test(
                line
              )
          )
          .map(
            (line) =>
              line
                .replace(
                  /^\s*\d+\.\s*/,
                  ""
                )
                .trim()
          );

      if (!steps.length) {
        setError(
          "No executable workflow steps found."
        );

        return;
      }

      setLoading(true);

      try {
        const response =
          await runAgentWorkflow({
            task,

            steps,

            code,

            language,
          });

        setExecution(
          response?.data || null
        );
      } catch (err) {
        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Workflow execution failed."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <section className="agent-workflow">

      <div className="agent-workflow-header">
        <div>
          <h3>
            AI Agent Workflow
          </h3>

          <p>
            Plan → Validate → Propose
          </p>
        </div>

        <span>
          Gemini
        </span>
      </div>

      <textarea
        value={task}
        onChange={(event) =>
          setTask(
            event.target.value
          )
        }
        placeholder="Example: Add input validation to the login form"
        disabled={loading}
      />

      <div className="agent-workflow-actions">

        <button
          type="button"
          onClick={createWorkflow}
          disabled={loading}
        >
          {loading
            ? "Working..."
            : "Create Workflow"}
        </button>

        <button
          type="button"
          onClick={validate}
          disabled={
            loading ||
            !workflow
          }
        >
          Validate
        </button>

        <button
          type="button"
          onClick={run}
          disabled={
            loading ||
            !workflow
          }
        >
          Generate Proposals
        </button>

      </div>

      {error && (
        <div className="agent-workflow-error">
          {error}
        </div>
      )}

      {workflow && (
        <div className="agent-workflow-box">

          <h4>
            Workflow
          </h4>

          <p>
            Status:{" "}
            <strong>
              {workflow.status}
            </strong>
          </p>

          <pre>
            {workflow.plan}
          </pre>

        </div>
      )}

      {validation && (
        <div className="agent-workflow-box">

          <h4>
            Validation
          </h4>

          <pre>
            {validation}
          </pre>

        </div>
      )}

      {execution && (
        <div className="agent-workflow-box">

          <h4>
            Step Proposals
          </h4>

          {execution.results?.map(
            (item) => (
              <div
                key={
                  item.stepNumber
                }
                className="agent-step"
              >
                <strong>
                  Step{" "}
                  {item.stepNumber}
                </strong>

                <span>
                  {item.status}
                </span>

                <pre>
                  {item.proposal ||
                    item.error}
                </pre>
              </div>
            )
          )}

        </div>
      )}

    </section>
  );
}