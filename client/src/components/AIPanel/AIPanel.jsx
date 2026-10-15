import { useMemo, useState } from "react";
import api from "../../services/api";
import {
  explainCode,
  detectBugs,
  createAgentPlan,
  createAgentWorkflow,
  validateAgentWorkflow,
  runAgentWorkflow,
  generateCodeDiff,
} from "../../services/aiApi";
import "./AIPanel.css";

const AI_TOOLS = [
  { value: "explain", label: "Explain Code", description: "Understand the current file", icon: "✦" },
  { value: "review", label: "Code Review", description: "Quality, readability and risks", icon: "◈" },
  { value: "bugs", label: "Bug Detector", description: "Find likely logic/runtime issues", icon: "⌁" },
  { value: "tests", label: "Test Generator", description: "Generate tests for current code", icon: "✓" },
  { value: "planner", label: "Agent Planner", description: "Turn a task into implementation steps", icon: "☷" },
  { value: "workflow", label: "Agent Workflow", description: "Create, validate and propose steps", icon: "⇢" },
  { value: "diff", label: "AI Code Diff", description: "Review a proposed code change", icon: "±" },
];

function extractText(value) {
  if (typeof value === "string") return value;
  const candidates = [
    value?.data?.text,
    value?.data?.result,
    value?.data?.analysis,
    value?.data?.output,
    value?.text,
    value?.result,
    value?.analysis,
    value?.output,
    value?.message,
  ];
  return candidates.find((item) => typeof item === "string" && item.trim()) || "";
}

function extractPayload(value) {
  if (value?.data && typeof value.data === "object") return value.data;
  return value?.data ?? value;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function AIPanel({
  code = "",
  language = "javascript",
  onApply,
}) {
  const [tool, setTool] = useState("explain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [task, setTask] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [validation, setValidation] = useState("");
  const [proposals, setProposals] = useState(null);
  const [diff, setDiff] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [lastAction, setLastAction] = useState("");

  const selectedTool = useMemo(
    () => AI_TOOLS.find((item) => item.value === tool) || AI_TOOLS[0],
    [tool]
  );

  const resetOutput = () => {
    setError("");
    setResult("");
    setWorkflow(null);
    setValidation("");
    setProposals(null);
    setDiff(null);
    setLastAction("");
  };

  const changeTool = (event) => {
    setTool(event.target.value);
    resetOutput();
  };

  const requireCode = () => {
    if (!code.trim()) {
      setError("Open a file with code first, then run this AI tool.");
      return false;
    }
    return true;
  };

  const runTextTool = async (action) => {
    if (loading) return;
    if (!requireCode()) return;

    setLoading(true);
    setError("");
    setResult("");
    setLastAction(action);

    try {
      let response;
      if (action === "explain") {
        response = await explainCode(code, language);
      } else if (action === "review") {
        // Uses the existing authenticated Axios client and backend AI route.
        const httpResponse = await api.post("/ai/review", { code, language });
        response = httpResponse.data;
      } else if (action === "bugs") {
        response = await detectBugs(code, language);
      } else if (action === "tests") {
        const httpResponse = await api.post("/ai/test", { code, language });
        response = httpResponse.data;
      } else if (action === "planner") {
        if (!task.trim()) {
          setError("Describe the task you want the AI to plan.");
          return;
        }
        response = await createAgentPlan({
          task: task.trim(),
          code,
          language,
          projectContext: projectContext.trim(),
        });
      }

      const text = extractText(response);
      if (!text) {
        setError("The AI service returned an empty response. Please try again.");
        return;
      }
      setResult(text);
    } catch (requestError) {
      console.error(`SyncCode AI ${action} error:`, requestError);
      setError(getErrorMessage(requestError, `Unable to run ${selectedTool.label.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  };

  const createWorkflowPlan = async () => {
    if (loading) return;
    if (!task.trim()) {
      setError("Describe the workflow task first.");
      return;
    }
    setLoading(true);
    setError("");
    setWorkflow(null);
    setValidation("");
    setProposals(null);
    setLastAction("workflow-create");
    try {
      const response = await createAgentWorkflow({
        task: task.trim(),
        code,
        language,
        projectContext: projectContext.trim() || `Current file language: ${language}`,
      });
      const payload = extractPayload(response);
      const plan = payload?.plan || payload?.workflow?.plan || payload?.text;
      if (!plan) throw new Error("The AI service did not return a workflow plan.");
      setWorkflow({ ...payload, plan });
    } catch (requestError) {
      console.error("SyncCode AI workflow creation error:", requestError);
      setError(getErrorMessage(requestError, "Workflow creation failed."));
    } finally {
      setLoading(false);
    }
  };

  const validateWorkflow = async () => {
    if (loading || !workflow?.plan) return;
    setLoading(true);
    setError("");
    setValidation("");
    setLastAction("workflow-validate");
    try {
      const response = await validateAgentWorkflow({
        task: task.trim(),
        plan: workflow.plan,
        language,
      });
      const text = extractText(response);
      if (!text) throw new Error("The validation response was empty.");
      setValidation(text);
    } catch (requestError) {
      console.error("SyncCode AI workflow validation error:", requestError);
      setError(getErrorMessage(requestError, "Workflow validation failed."));
    } finally {
      setLoading(false);
    }
  };

  const generateWorkflowProposals = async () => {
    if (loading || !workflow?.plan) return;
    const steps = workflow.plan
      .split("\n")
      .filter((line) => /^\s*\d+[.)]\s+/.test(line))
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);

    if (!steps.length) {
      setError("No numbered workflow steps were found. Generate the workflow again with numbered steps.");
      return;
    }

    setLoading(true);
    setError("");
    setProposals(null);
    setLastAction("workflow-proposals");
    try {
      const response = await runAgentWorkflow({ task: task.trim(), steps, code, language });
      setProposals(extractPayload(response));
    } catch (requestError) {
      console.error("SyncCode AI workflow proposal error:", requestError);
      setError(getErrorMessage(requestError, "Proposal generation failed."));
    } finally {
      setLoading(false);
    }
  };

  const generateDiff = async () => {
    if (loading) return;
    if (!requireCode()) return;
    if (!instruction.trim()) {
      setError("Describe the change you want the AI to propose.");
      return;
    }
    setLoading(true);
    setError("");
    setDiff(null);
    setLastAction("diff");
    try {
      const response = await generateCodeDiff({
        originalCode: code,
        instruction: instruction.trim(),
        language,
      });
      const payload = extractPayload(response);
      const proposedCode = payload?.proposedCode || payload?.diff?.proposedCode;
      if (typeof proposedCode !== "string") {
        throw new Error("The AI service did not return proposed code.");
      }
      setDiff({
        originalCode: payload?.originalCode ?? code,
        proposedCode,
        summary: payload?.summary || payload?.text || "Review the proposed changes before applying.",
      });
    } catch (requestError) {
      console.error("SyncCode AI diff generation error:", requestError);
      setError(getErrorMessage(requestError, "Diff generation failed."));
    } finally {
      setLoading(false);
    }
  };

  const applyDiff = () => {
    if (typeof diff?.proposedCode !== "string") return;
    if (typeof onApply !== "function") {
      setError("The editor has not provided an apply handler.");
      return;
    }
    onApply(diff.proposedCode);
    setDiff(null);
    setInstruction("");
    setError("");
  };

  const renderResult = () => {
    if (tool === "workflow") {
      return (
        <div className="synccode-ai-result-stack">
          {workflow && (
            <section className="synccode-ai-result-card">
              <div className="synccode-ai-result-heading">
                <span>Workflow plan</span>
                <span className="synccode-ai-status-pill">{workflow.status || "PROPOSED"}</span>
              </div>
              <pre>{workflow.plan}</pre>
            </section>
          )}
          {validation && (
            <section className="synccode-ai-result-card">
              <div className="synccode-ai-result-heading">Validation</div>
              <pre>{validation}</pre>
            </section>
          )}
          {proposals && (
            <section className="synccode-ai-result-card">
              <div className="synccode-ai-result-heading">Step proposals</div>
              {Array.isArray(proposals.results) && proposals.results.length > 0 ? (
                proposals.results.map((item, index) => (
                  <div className="synccode-ai-step" key={item.stepNumber ?? index}>
                    <div><strong>Step {item.stepNumber ?? index + 1}</strong><span>{item.status || "PROPOSED"}</span></div>
                    <pre>{item.proposal || item.error || "No proposal text returned."}</pre>
                  </div>
                ))
              ) : (
                <pre>{extractText(proposals) || JSON.stringify(proposals, null, 2)}</pre>
              )}
            </section>
          )}
        </div>
      );
    }

    if (tool === "diff" && diff) {
      return (
        <section className="synccode-ai-result-card synccode-ai-diff-card">
          <div className="synccode-ai-result-heading">
            <span>Proposed code change</span>
            <span className="synccode-ai-status-pill warning">Review required</span>
          </div>
          <p className="synccode-ai-diff-summary">{diff.summary}</p>
          <div className="synccode-ai-diff-columns">
            <div><label>Current code</label><pre>{diff.originalCode}</pre></div>
            <div><label>Proposed code</label><pre>{diff.proposedCode}</pre></div>
          </div>
          <div className="synccode-ai-diff-actions">
            <button type="button" className="synccode-ai-secondary" onClick={() => setDiff(null)}>Reject</button>
            <button type="button" className="synccode-ai-primary" onClick={applyDiff}>Approve &amp; Apply</button>
          </div>
        </section>
      );
    }

    if (!result) return null;
    return (
      <section className="synccode-ai-result-card">
        <div className="synccode-ai-result-heading">
          <span>{selectedTool.label} result</span>
          <button type="button" onClick={() => setResult("")}>Clear</button>
        </div>
        <pre>{result}</pre>
      </section>
    );
  };

  const needsTask = tool === "planner" || tool === "workflow";
  const isTextTool = ["explain", "review", "bugs", "tests", "planner"].includes(tool);
  const hasResult = Boolean(result || workflow || validation || proposals || diff);

  return (
    <section className="synccode-ai-studio">
      <header className="synccode-ai-studio-header">
        <div className="synccode-ai-studio-brand">
          <div className="synccode-ai-studio-mark">✦</div>
          <div className="synccode-ai-studio-title">
            <h2>AI Studio</h2>
            <p>Code intelligence for your workspace</p>
          </div>
        </div>
        <span className="synccode-ai-provider"><span /> Gemini</span>
      </header>

      <div className="synccode-ai-studio-body">
        <label className="synccode-ai-field-label" htmlFor="synccode-ai-tool-select">Choose an AI tool</label>
        <div className="synccode-ai-tool-select-wrap">
          <span className="synccode-ai-tool-glyph">{selectedTool.icon}</span>
          <select id="synccode-ai-tool-select" value={tool} onChange={changeTool} disabled={loading}>
            {AI_TOOLS.map((item) => (
              <option value={item.value} key={item.value}>{item.label}</option>
            ))}
          </select>
          <span className="synccode-ai-select-caret">⌄</span>
        </div>
        <p className="synccode-ai-tool-description">{selectedTool.description}</p>

        <div className="synccode-ai-context-row">
          <span><i /> {language || "plaintext"}</span>
          <span>{code.length.toLocaleString()} characters</span>
        </div>

        {needsTask && (
          <div className="synccode-ai-field">
            <label className="synccode-ai-field-label" htmlFor="synccode-ai-task">Task / Goal</label>
            <textarea
              id="synccode-ai-task"
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder={tool === "workflow" ? "Example: Propose a safe authentication validation workflow…" : "Describe what you want to build or improve…"}
              disabled={loading}
              rows={3}
            />
          </div>
        )}

        {(tool === "planner" || tool === "workflow") && (
          <div className="synccode-ai-field">
            <label className="synccode-ai-field-label" htmlFor="synccode-ai-context">Project context <span>Optional</span></label>
            <textarea
              id="synccode-ai-context"
              value={projectContext}
              onChange={(event) => setProjectContext(event.target.value)}
              placeholder="Constraints, expected behavior, files or dependencies…"
              disabled={loading}
              rows={2}
            />
          </div>
        )}

        {tool === "diff" && (
          <div className="synccode-ai-field">
            <label className="synccode-ai-field-label" htmlFor="synccode-ai-diff-instruction">Requested change</label>
            <textarea
              id="synccode-ai-diff-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Example: Add input validation and return readable errors…"
              disabled={loading}
              rows={3}
            />
          </div>
        )}

        {isTextTool && (
          <button
            type="button"
            className="synccode-ai-primary synccode-ai-run-action"
            onClick={() => runTextTool(tool)}
            disabled={loading}
          >
            {loading ? <><span className="synccode-ai-spinner" /> Working…</> : <><span>✦</span> {tool === "explain" ? "Explain current code" : tool === "review" ? "Review current code" : tool === "bugs" ? "Scan for bugs" : tool === "tests" ? "Generate test cases" : "Create implementation plan"}</>}
          </button>
        )}

        {tool === "workflow" && (
          <div className="synccode-ai-action-grid">
            <button type="button" className="synccode-ai-primary" onClick={createWorkflowPlan} disabled={loading}>{loading && lastAction === "workflow-create" ? "Creating…" : "Create workflow"}</button>
            <button type="button" className="synccode-ai-secondary" onClick={validateWorkflow} disabled={loading || !workflow}>{loading && lastAction === "workflow-validate" ? "Checking…" : "Validate"}</button>
            <button type="button" className="synccode-ai-secondary full" onClick={generateWorkflowProposals} disabled={loading || !workflow}>{loading && lastAction === "workflow-proposals" ? "Generating…" : "Generate step proposals"}</button>
          </div>
        )}

        {tool === "diff" && (
          <button type="button" className="synccode-ai-primary synccode-ai-run-action" onClick={generateDiff} disabled={loading}>
            {loading ? <><span className="synccode-ai-spinner" /> Generating proposal…</> : <><span>±</span> Generate code diff</>}
          </button>
        )}

        {error && (
          <div className="synccode-ai-error" role="alert">
            <strong>Something went wrong</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {hasResult && renderResult()}

        {!hasResult && !error && (
          <div className="synccode-ai-empty-state">
            <div className="synccode-ai-empty-orbit"><span>✦</span></div>
            <strong>Ready to assist</strong>
            <p>Select a tool above to explain, review, test or improve the current file.</p>
          </div>
        )}
      </div>

      <footer className="synccode-ai-studio-footer">
        <span><i /> Context attached</span>
        <button type="button" onClick={resetOutput} disabled={loading}>Reset output</button>
      </footer>
    </section>
  );
}
