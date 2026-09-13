import {
  EXECUTION_STATUS,
  SUPPORTED_LANGUAGES,
} from "./executionTypes";

const DEFAULT_TIMEOUT = 3000;

function createExecutionId() {
  return `exec_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createWorkerExecution(
  worker,
  code,
  language,
  timeout
) {
  return new Promise((resolve) => {
    const id = createExecutionId();

    let finished = false;

    const cleanup = () => {
      try {
        worker.terminate();
      } catch {
        // Ignore worker termination errors.
      }

      clearTimeout(timer);
    };

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        status: EXECUTION_STATUS.TIMEOUT,
        language,
        error: {
          name: "TimeoutError",
          message:
            `Execution exceeded ${timeout} ms`,
        },
        output: [],
      });
    }, timeout);

    worker.onmessage = (event) => {
      const data = event.data || {};

      if (data.id !== id) {
        return;
      }

      if (data.type === "success") {
        finish({
          status: EXECUTION_STATUS.SUCCESS,
          language,
          result: data.result,
          output: data.output || [],
          duration: data.duration || 0,
        });

        return;
      }

      if (data.type === "error") {
        finish({
          status: EXECUTION_STATUS.ERROR,
          language,
          error: data.error,
          output: data.output || [],
          duration: data.duration || 0,
        });
      }
    };

    worker.onerror = (error) => {
      finish({
        status: EXECUTION_STATUS.ERROR,
        language,
        error: {
          name: "WorkerError",
          message:
            error?.message ||
            "Unknown worker error",
        },
        output: [],
      });
    };

    worker.postMessage({
      id,
      code,
    });
  });
}

export function executeJavaScriptInWorker(
  code,
  options = {}
) {
  const {
    timeout = DEFAULT_TIMEOUT,
  } = options;

  if (typeof code !== "string") {
    return Promise.resolve({
      status: EXECUTION_STATUS.ERROR,
      language:
        SUPPORTED_LANGUAGES.JAVASCRIPT,
      error: {
        name: "ValidationError",
        message: "Code must be a string",
      },
      output: [],
    });
  }

  let worker;

  try {
    worker = new Worker(
      new URL(
        "./worker/javascriptWorker.js",
        import.meta.url
      ),
      {
        type: "module",
      }
    );
  } catch (error) {
    return Promise.resolve({
      status: EXECUTION_STATUS.ERROR,
      language:
        SUPPORTED_LANGUAGES.JAVASCRIPT,
      error: {
        name: "WorkerCreationError",
        message:
          error?.message ||
          "Unable to create JavaScript worker",
      },
      output: [],
    });
  }

  return createWorkerExecution(
    worker,
    code,
    SUPPORTED_LANGUAGES.JAVASCRIPT,
    timeout
  );
}

export function executePythonInWorker(
  code,
  options = {}
) {
  const {
    timeout = 10000,
  } = options;

  if (typeof code !== "string") {
    return Promise.resolve({
      status: EXECUTION_STATUS.ERROR,
      language:
        SUPPORTED_LANGUAGES.PYTHON,
      error: {
        name: "ValidationError",
        message: "Code must be a string",
      },
      output: [],
    });
  }

  let worker;

  try {
    worker = new Worker(
      new URL(
        "./worker/pythonWorker.js",
        import.meta.url
      ),
      {
        type: "module",
      }
    );
  } catch (error) {
    return Promise.resolve({
      status: EXECUTION_STATUS.ERROR,
      language:
        SUPPORTED_LANGUAGES.PYTHON,
      error: {
        name: "WorkerCreationError",
        message:
          error?.message ||
          "Unable to create Python worker",
      },
      output: [],
    });
  }

  return createWorkerExecution(
    worker,
    code,
    SUPPORTED_LANGUAGES.PYTHON,
    timeout
  );
}