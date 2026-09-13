export const EXECUTION_MODES = {
  SERVER: "server",
  BROWSER: "browser",
  WORKER: "worker",
};

export const SUPPORTED_LANGUAGES = {
  JAVASCRIPT: "javascript",
  PYTHON: "python",
  CPP: "cpp",
};

export const EXECUTION_STATUS = {
  IDLE: "idle",
  STARTING: "starting",
  RUNNING: "running",
  SUCCESS: "success",
  ERROR: "error",
  TIMEOUT: "timeout",
};

export const RUNTIME_TYPES = {
  NODE: "node",
  WEB_WORKER: "web-worker",
  PYODIDE: "pyodide",
  WASM: "wasm",
  WEBCONTAINER: "webcontainer",
};