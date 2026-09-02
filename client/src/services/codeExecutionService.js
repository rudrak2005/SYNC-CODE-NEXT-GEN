const axios = require("axios");

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62
};

const executeCode = async (
  language,
  sourceCode,
  stdin = ""
) => {

  const languageId = LANGUAGE_MAP[language];

  if (!languageId) {
    throw new Error("Unsupported language");
  }

  const response = await axios.post(
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
    {
      language_id: languageId,
      source_code: sourceCode,
      stdin
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
      }
    }
  );

  return response.data;
};

module.exports = { executeCode };