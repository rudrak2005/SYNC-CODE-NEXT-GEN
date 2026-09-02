const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const executeCode = async (
  language,
  sourceCode,
  stdin = ""
) => {
  return new Promise((resolve, reject) => {
    // Day 23: JavaScript only
    if (language !== "javascript") {
      reject(new Error("Only JavaScript is supported in Day 23."));
      return;
    }

    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFile = path.join(tempDir, "temp.js");

    fs.writeFileSync(tempFile, sourceCode);

    const process = exec(
      `node "${tempFile}"`,
      { timeout: 5000 },
      (error, stdout, stderr) => {
        fs.unlinkSync(tempFile);

        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve({
          stdout,
          stderr
        });
      }
    );

    if (stdin) {
      process.stdin.write(stdin);
      process.stdin.end();
    }
  });
};

module.exports = {
  executeCode
};