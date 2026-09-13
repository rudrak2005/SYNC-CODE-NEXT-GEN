const {
  generateAIResponse,
} = require("./aiService");

async function generateCodeDiff({
  originalCode,
  instruction,
  language = "javascript",
}) {
  if (
    !originalCode ||
    typeof originalCode !==
      "string"
  ) {
    throw new Error(
      "Original code is required."
    );
  }

  if (
    !instruction ||
    typeof instruction !==
      "string"
  ) {
    throw new Error(
      "Instruction is required."
    );
  }

  const prompt = `
You are a controlled code transformation assistant.

Language:
${language}

Original code:
${originalCode}

Requested change:
${instruction}

Create a proposed updated version of the code.

IMPORTANT:

1. Do not execute the code.
2. Do not claim the code was tested.
3. Preserve existing behaviour unless the request requires a change.
4. Make the smallest reasonable modification.
5. Return ONLY the complete proposed source code.
6. Do not add markdown code fences.
7. Do not explain the result.
`;

  const result =
    await generateAIResponse({
      prompt,

      temperature: 0.05,
    });

  let proposedCode =
    result.text || "";

  proposedCode =
    proposedCode
      .replace(
        /^```[a-zA-Z0-9_-]*\s*/,
        ""
      )
      .replace(
        /\s*```$/,
        ""
      )
      .trim();

  return {
    originalCode,

    proposedCode,

    language,

    instruction,

    provider:
      result.provider,

    model:
      result.model,

    requiresApproval:
      true,
  };
}

module.exports = {
  generateCodeDiff,
};