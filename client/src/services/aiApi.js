import api from "./api";

/* ================================
   GENERIC AI
================================ */

export async function generateAI(data) {
  const response = await api.post("/api/ai/generate", data);
  return response.data;
}

/* ================================
   AI EXPLAIN
================================ */

export async function explainCode(data) {
  const response = await api.post("/api/ai/explain", data);
  return response.data;
}

/* ================================
   AI CODE REVIEW
================================ */

export async function reviewCode(data) {
  const response = await api.post("/api/ai/review", data);
  return response.data;
}

/* ================================
   AI BUG DETECTOR
================================ */

export async function detectBugs(data) {
  const response = await api.post("/api/ai/bugs", data);
  return response.data;
}

/* ================================
   AI TEST GENERATOR
================================ */

export async function generateTests(data) {
  const response = await api.post("/api/ai/tests", data);
  return response.data;
}

/* ================================
   AI AGENT PLANNER
================================ */

export async function createAgentPlan(data) {
  const response = await api.post("/api/ai/plan", data);
  return response.data;
}

/* ================================
   AI AGENT WORKFLOW
================================ */

export async function createAgentWorkflow(data) {
  const response = await api.post("/api/ai/workflow", data);
  return response.data;
}

/* Alias */
export async function createWorkflow(data) {
  return createAgentWorkflow(data);
}

/* ================================
   VALIDATE AGENT WORKFLOW
================================ */

export async function validateAgentWorkflow(data) {
  const response = await api.post(
    "/api/ai/workflow/validate",
    data
  );

  return response.data;
}

/* Alias */
export async function validateWorkflow(data) {
  return validateAgentWorkflow(data);
}

/* ================================
   RUN AGENT WORKFLOW
================================ */

export async function runAgentWorkflow(data) {
  const response = await api.post(
    "/api/ai/workflow/run",
    data
  );

  return response.data;
}

/* Alias */
export async function runWorkflow(data) {
  return runAgentWorkflow(data);
}

/* ================================
   AI CODE DIFF
================================ */

export async function generateCodeDiff(data) {
  const response = await api.post(
    "/api/ai/diff",
    data
  );

  return response.data;
}