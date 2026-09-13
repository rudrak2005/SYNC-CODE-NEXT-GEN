import {
  EXECUTION_MODES,
  SUPPORTED_LANGUAGES,
  RUNTIME_TYPES,
} from "./executionTypes";

import {
  executeJavaScriptInWorker,
  executePythonInWorker,
} from "./workerExecutionService";

export function normalizeLanguage(language) {
  const value = String(language || "")
    .toLowerCase()
    .trim();

  if (
    value === "js" ||
    value === "jsx" ||
    value === "node" ||
    value === "nodejs"
  ) {
    return SUPPORTED_LANGUAGES.JAVASCRIPT;
  }

  if (
    value === "py" ||
    value === "python3"
  ) {
    return SUPPORTED_LANGUAGES.PYTHON;
  }

  if (
    value === "c++" ||
    value === "cplusplus"
  ) {
    return SUPPORTED_LANGUAGES.CPP;
  }

  return value;
}

export function getExecutionMode(language) {
  const normalized = normalizeLanguage(language);

  switch (normalized) {
    case SUPPORTED_LANGUAGES.JAVASCRIPT:
    case SUPPORTED_LANGUAGES.PYTHON:
      return EXECUTION_MODES.WORKER;

    case SUPPORTED_LANGUAGES.CPP:
      return EXECUTION_MODES.SERVER;

    default:
      return EXECUTION_MODES.SERVER;
  }
}

export function isBrowserExecutionSupported(language) {
  const normalized = normalizeLanguage(language);

  return (
    normalized ===
      SUPPORTED_LANGUAGES.JAVASCRIPT ||
    normalized ===
      SUPPORTED_LANGUAGES.PYTHON
  );
}

export function getRuntime(language) {
  const normalized = normalizeLanguage(language);

  if (
    normalized ===
    SUPPORTED_LANGUAGES.JAVASCRIPT
  ) {
    return {
      type: RUNTIME_TYPES.WEB_WORKER,
      ready: true,
      language: "javascript",
      plannedFor: "Day 40",
    };
  }

  if (
    normalized ===
    SUPPORTED_LANGUAGES.PYTHON
  ) {
    return {
      type: RUNTIME_TYPES.PYODIDE,
      ready: true,
      language: "python",
      plannedFor: "Day 41",
    };
  }

  if (
    normalized ===
    SUPPORTED_LANGUAGES.CPP
  ) {
    return {
      type: RUNTIME_TYPES.WASM,
      ready: false,
      language: "cpp",
      plannedFor: "Future",
    };
  }

  return {
    type: null,
    ready: false,
    language: normalized,
    plannedFor: "Future",
  };
}

export function getExecutionPlan(language) {
  const normalized = normalizeLanguage(language);

  return {
    language: normalized,
    currentMode:
      getExecutionMode(normalized),
    browserSupported:
      isBrowserExecutionSupported(normalized),
    runtime: getRuntime(normalized),
    fallback: EXECUTION_MODES.SERVER,
  };
}

export function canExecute(language) {
  const normalized = normalizeLanguage(language);

  return (
    normalized ===
      SUPPORTED_LANGUAGES.JAVASCRIPT ||
    normalized ===
      SUPPORTED_LANGUAGES.PYTHON ||
    normalized ===
      SUPPORTED_LANGUAGES.CPP
  );
}

export async function executeBrowserCode(
  language,
  code,
  options = {}
) {
  const normalized = normalizeLanguage(language);

  if (
    normalized ===
    SUPPORTED_LANGUAGES.JAVASCRIPT
  ) {
    return executeJavaScriptInWorker(
      code,
      options
    );
  }

  if (
    normalized ===
    SUPPORTED_LANGUAGES.PYTHON
  ) {
    return executePythonInWorker(
      code,
      options
    );
  }

  return {
    status: "unsupported",
    language: normalized,
    error: {
      name: "UnsupportedLanguage",
      message:
        "Browser execution currently supports JavaScript and Python.",
    },
    output: [],
  };
}