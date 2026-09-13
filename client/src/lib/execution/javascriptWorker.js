self.onmessage = async (event) => {
  const { id, code } = event.data || {};

  if (!id) {
    return;
  }

  const startedAt = performance.now();

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  const output = [];
  const errors = [];

  const serialize = (value) => {
    try {
      if (typeof value === "string") {
        return value;
      }

      if (value === undefined) {
        return "undefined";
      }

      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const pushOutput = (type, args) => {
    output.push({
      type,
      text: args.map(serialize).join(" "),
      timestamp: Date.now(),
    });
  };

  try {
    console.log = (...args) => {
      pushOutput("log", args);
    };

    console.info = (...args) => {
      pushOutput("info", args);
    };

    console.warn = (...args) => {
      pushOutput("warn", args);
    };

    console.error = (...args) => {
      pushOutput("error", args);
    };

    if (typeof code !== "string") {
      throw new Error("Code must be a string");
    }

    const execute = new Function(`
      "use strict";

      ${code}
    `);

    let result = execute();

    if (result instanceof Promise) {
      result = await result;
    }

    self.postMessage({
      id,
      type: "success",
      result: serialize(result),
      output,
      duration: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    errors.push({
      name: error?.name || "Error",
      message: error?.message || String(error),
    });

    self.postMessage({
      id,
      type: "error",
      error: {
        name: error?.name || "Error",
        message: error?.message || String(error),
        stack: error?.stack || "",
      },
      output,
      errors,
      duration: Math.round(performance.now() - startedAt),
    });
  } finally {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
};