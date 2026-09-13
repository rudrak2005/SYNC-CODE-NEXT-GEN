const allowedTools = {
  inspect_code: {
    name: "inspect_code",

    description:
      "Inspect the current source code and understand its structure.",
  },

  analyze_requirements: {
    name: "analyze_requirements",

    description:
      "Analyze the developer task and identify requirements.",
  },

  propose_file_change: {
    name: "propose_file_change",

    description:
      "Propose a file modification without applying it.",
  },

  generate_tests: {
    name: "generate_tests",

    description:
      "Generate tests for a proposed implementation.",
  },

  validate_plan: {
    name: "validate_plan",

    description:
      "Validate whether workflow steps are ordered and consistent.",
  },
};

function getAvailableTools() {
  return Object.values(
    allowedTools
  );
}

function isAllowedTool(toolName) {
  return Boolean(
    allowedTools[toolName]
  );
}

function validateToolCall(toolName) {
  if (!isAllowedTool(toolName)) {
    throw new Error(
      `Tool "${toolName}" is not allowed.`
    );
  }

  return true;
}

module.exports = {
  getAvailableTools,
  isAllowedTool,
  validateToolCall,
};