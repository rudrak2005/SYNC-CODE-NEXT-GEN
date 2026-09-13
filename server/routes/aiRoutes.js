const express = require("express");

const {
  generateAI,
  explainCodeController,
  reviewCodeController,
  detectBugsController,
  generateTestsController,
  createAgentPlanController,
  createWorkflowController,
  validateWorkflowController,
  runWorkflowController,
} = require("../controllers/aiController");

const router =
  express.Router();

router.post(
  "/generate",
  generateAI
);

router.post(
  "/explain",
  explainCodeController
);

router.post(
  "/review",
  reviewCodeController
);

router.post(
  "/bugs",
  detectBugsController
);

router.post(
  "/tests",
  generateTestsController
);

router.post(
  "/plan",
  createAgentPlanController
);

router.post(
  "/workflow",
  createWorkflowController
);

router.post(
  "/workflow/validate",
  validateWorkflowController
);

router.post(
  "/workflow/run",
  runWorkflowController
);

module.exports = router;