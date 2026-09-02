const {
  executeCode
} = require("../services/codeExecutionService");

const runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    const result = await executeCode(
      language,
      code,
      input
    );

    return res.status(200).json({
      success: true,
      output:
        result.stdout ||
        result.stderr ||
        "Program finished."
    });

  } catch (error) {
    console.error("Execution Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { runCode };