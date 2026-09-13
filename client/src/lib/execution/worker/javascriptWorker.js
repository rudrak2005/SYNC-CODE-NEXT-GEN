self.onmessage = async (event) => {
  const { code } = event.data || {};

  try {
    if (typeof code !== "string") {
      throw new Error("JavaScript code is required.");
    }

    let output = "";

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const capture = (...args) => {
      output += `${args
        .map((value) => {
          if (typeof value === "string") {
            return value;
          }

          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        })
        .join(" ")}\n`;
    };

    console.log = capture;
    console.info = capture;
    console.warn = capture;
    console.error = capture;

    try {
      const result = await (async () => {
        return eval(code);
      })();

      if (result !== undefined) {
        output += `${String(result)}\n`;
      }
    } finally {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }

    self.postMessage({
      success: true,
      output: output.trim(),
    });
  } catch (error) {
    self.postMessage({
      success: false,
      output:
        error?.stack ||
        error?.message ||
        String(error),
    });
  }
};
