const { generateAIResponse } = require("./aiService");

/**
 * Create a safe AI coding workflow
 */
async function createWorkflow({ task, code, language }) {
  if (!task || !task.trim()) {
    throw new Error("Task is required");
  }

  const prompt = `
You are an AI coding workflow planner for SyncCode NextGen.

User Task:
${task}

Programming Language:
${language || "javascript"}

Current Code:
${code || "(empty)"}

Create a safe step-by-step coding workflow.

Rules:
- Break the task into small and clear steps.
- Do not execute shell commands.
- Do not modify files automatically.
- Do not delete files automatically.
- Every code change must require user approval.
- Keep the workflow practical.
- Return ONLY numbered steps.

Example:
1. Analyze the existing code
2. Add input validation
3. Update the required function
4. Test the updated logic
`;

  const result = await generateAIResponse(prompt);

  const steps = parseSteps(result);

  return {
    task,
    language: language || "javascript",
    steps,
    status: "planned",
    requiresApproval: true,
  };
}

/**
 * Parse numbered AI steps
 */
function parseSteps(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Validate workflow
 */
async function validateWorkflow(workflow) {
  const errors = [];

  if (!workflow) {
    errors.push("Workflow is required");
  }

  if (workflow && (!workflow.task || !workflow.task.trim())) {
    errors.push("Workflow task is required");
  }

  if (
    workflow &&
    (!Array.isArray(workflow.steps) || workflow.steps.length === 0)
  ) {
    errors.push("Workflow must contain at least one step");
  }

  if (
    workflow &&
    Array.isArray(workflow.steps) &&
    workflow.steps.length > 10
  ) {
    errors.push("Workflow cannot contain more than 10 steps");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate proposal for a single workflow step
 */
async function generateStepProposal({
  task,
  step,
  code,
  language,
}) {
  if (!task || !step) {
    throw new Error("Task and step are required");
  }

  const prompt = `
You are the coding assistant of SyncCode NextGen.

Original Task:
${task}

Current Workflow Step:
${step}

Programming Language:
${language || "javascript"}

Current Code:
${code || "(empty)"}

Create a safe implementation proposal for this step.

Requirements:
- Explain what should change.
- Provide proposed code only when required.
- Do not execute anything.
- Do not assume user approval.
- Never run shell commands.
- Never expose secrets.
- Keep the change limited to this step.

Return:

EXPLANATION:
<short explanation>

PROPOSED_CODE:
<code or NO_CODE_CHANGE>

NOTES:
<important notes>
`;

  const result = await generateAIResponse(prompt);

  return {
    step,
    proposal: result,
    status: "awaiting_approval",
    requiresApproval: true,
  };
}

/**
 * Run complete workflow in proposal mode
 *
 * IMPORTANT:
 * This function does not automatically modify files.
 */
async function runWorkflow({
  workflow,
  code,
  language,
}) {
  const validation = await validateWorkflow(workflow);

  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const proposals = [];

  for (const step of workflow.steps) {
    const proposal = await generateStepProposal({
      task: workflow.task,
      step,
      code,
      language,
    });

    proposals.push(proposal);
  }

  return {
    task: workflow.task,
    language: language || "javascript",
    status: "awaiting_approval",
    proposals,
    requiresApproval: true,
    autoApplied: false,
  };
}

module.exports = {
  createWorkflow,
  validateWorkflow,
  generateStepProposal,
  runWorkflow,
};