const {
  generateAIResponse,
  explainCode,
  reviewCode,
  detectBugs,
  generateTests,
  createAgentPlan,
} = require("../services/ai/aiService");

const {
  generateCodeDiff,
} = require("../services/ai/aiDiffService");
const {
  createWorkflow,
  validateWorkflow,
  runWorkflow,
} = require("../services/ai/agentWorkflowService");
/* ========================================
   GENERIC AI
======================================== */
async function generateCodeDiffController(
  req,
  res
) {
  try {
    const {
      originalCode,
      instruction,
      language,
    } = req.body;

    if (
      !originalCode ||
      !instruction
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Original code and instruction are required.",
      });
    }

    const result =
      await generateCodeDiff({
        originalCode,

        instruction,

        language:
          language ||
          "javascript",
      });

    return res.status(200).json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error(
      "AI Diff Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "AI diff generation failed.",
    });
  }
}
async function generateAI(req, res) {
  try {
    const {
      prompt,
      temperature,
    } = req.body;

    if (
      !prompt ||
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prompt is required.",
      });
    }

    const result =
      await generateAIResponse({
        prompt: prompt.trim(),

        temperature:
          typeof temperature ===
          "number"
            ? temperature
            : 0.2,
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Generate Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "AI request failed.",
    });
  }
}

async function createWorkflowController(
  req,
  res
) {
  try {
    const {
      task,
      code,
      language,
      projectContext,
    } = req.body;

    if (
      !task ||
      typeof task !== "string" ||
      !task.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task is required.",
      });
    }

    const workflow =
      await createWorkflow({
        task: task.trim(),

        code:
          typeof code ===
          "string"
            ? code
            : "",

        language:
          typeof language ===
          "string"
            ? language
            : "javascript",

        projectContext:
          typeof projectContext ===
          "string"
            ? projectContext
            : "",
      });

    return res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error(
      "Agent workflow creation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Workflow creation failed.",
    });
  }
}

async function validateWorkflowController(
  req,
  res
) {
  try {
    const {
      task,
      plan,
      language,
    } = req.body;

    if (!task || !plan) {
      return res.status(400).json({
        success: false,
        message:
          "Task and plan are required.",
      });
    }

    const result =
      await validateWorkflow({
        task,

        plan,

        language:
          language ||
          "javascript",
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Workflow validation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Workflow validation failed.",
    });
  }
}

async function runWorkflowController(
  req,
  res
) {
  try {
    const {
      task,
      steps,
      code,
      language,
    } = req.body;

    if (
      !task ||
      !Array.isArray(steps)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task and steps are required.",
      });
    }

    const result =
      await runWorkflow({
        task,

        steps,

        code:
          typeof code ===
          "string"
            ? code
            : "",

        language:
          language ||
          "javascript",
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Workflow execution error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Workflow failed.",
    });
  }
}

/* ========================================
   EXPLAIN
======================================== */

async function explainCodeController(
  req,
  res
) {
  try {
    const {
      code,
      language,
    } = req.body;

    if (
      !code ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code is required.",
      });
    }

    const result =
      await explainCode(
        code.trim(),
        language ||
          "javascript"
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Explain Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Code explanation failed.",
    });
  }
}

/* ========================================
   REVIEW
======================================== */

async function reviewCodeController(
  req,
  res
) {
  try {
    const {
      code,
      language,
    } = req.body;

    if (
      !code ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code is required.",
      });
    }

    const result =
      await reviewCode(
        code.trim(),
        language ||
          "javascript"
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Code review failed.",
    });
  }
}

/* ========================================
   BUG DETECTION
======================================== */

async function detectBugsController(
  req,
  res
) {
  try {
    const {
      code,
      language,
    } = req.body;

    if (
      !code ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code is required.",
      });
    }

    const result =
      await detectBugs(
        code.trim(),
        language ||
          "javascript"
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Bug Detection Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Bug detection failed.",
    });
  }
}

/* ========================================
   TEST GENERATION
======================================== */

async function generateTestsController(
  req,
  res
) {
  try {
    const {
      code,
      language,
    } = req.body;

    if (
      !code ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code is required.",
      });
    }

    const result =
      await generateTests(
        code.trim(),
        language ||
          "javascript"
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Test Generation Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Test generation failed.",
    });
  }
}

/* ========================================
   DAY 36 — AGENT PLANNER
======================================== */

async function createAgentPlanController(
  req,
  res
) {
  try {
    const {
      task,
      code,
      language,
      projectContext,
    } = req.body;

    console.log(
      "POST /api/ai/plan received"
    );

    if (
      !task ||
      typeof task !== "string" ||
      !task.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task is required.",
      });
    }

    const result =
      await createAgentPlan({
        task: task.trim(),

        code:
          typeof code === "string"
            ? code
            : "",

        language:
          typeof language === "string"
            ? language
            : "javascript",

        projectContext:
          typeof projectContext ===
          "string"
            ? projectContext
            : "",
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI Agent Planner Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Agent planning failed.",
    });
  }
}

module.exports = {
  generateAI,
  explainCodeController,
  reviewCodeController,
  detectBugsController,
  generateTestsController,
  createAgentPlanController,
  createWorkflowController,
validateWorkflowController,
runWorkflowController,
generateCodeDiffController,
};