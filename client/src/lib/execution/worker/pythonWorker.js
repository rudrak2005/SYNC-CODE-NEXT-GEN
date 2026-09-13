const PYODIDE_VERSION = "0.314.0";

const PYODIDE_INDEX_URL =
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

async function loadPythonRuntime() {
  if (!pyodidePromise) {
    pyodidePromise = import(
      `${PYODIDE_INDEX_URL}pyodide.mjs`
    ).then(({ loadPyodide }) =>
      loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
      })
    );
  }

  return pyodidePromise;
}

function serialize(value) {
  try {
    if (value === undefined) {
      return "undefined";
    }

    if (value === null) {
      return "null";
    }

    if (typeof value === "string") {
      return value;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

self.onmessage = async (event) => {
  const {
    id,
    code,
  } = event.data || {};

  if (!id) {
    return;
  }

  const startedAt = performance.now();
  const output = [];

  try {
    if (typeof code !== "string") {
      throw new Error("Python code must be a string");
    }

    const pyodide = await loadPythonRuntime();

    pyodide.setStdout({
      batched: (text) => {
        output.push({
          type: "stdout",
          text: String(text),
          timestamp: Date.now(),
        });
      },
    });

    pyodide.setStderr({
      batched: (text) => {
        output.push({
          type: "stderr",
          text: String(text),
          timestamp: Date.now(),
        });
      },
    });

    /*
     * Run the user's Python code.
     *
     * runPythonAsync allows asynchronous execution
     * inside the Pyodide runtime.
     */
    const result = await pyodide.runPythonAsync(code);

    self.postMessage({
      id,
      type: "success",
      language: "python",
      result: serialize(result),
      output,
      duration: Math.round(
        performance.now() - startedAt
      ),
    });
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      language: "python",
      error: {
        name: error?.name || "PythonError",
        message:
          error?.message ||
          String(error),
        stack: error?.stack || "",
      },
      output,
      duration: Math.round(
        performance.now() - startedAt
      ),
    });
  }
};