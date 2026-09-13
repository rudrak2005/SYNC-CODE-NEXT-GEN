const {
  GoogleGenAI,
} = require("@google/genai");

const apiKey =
  process.env.GEMINI_API_KEY;

const primaryModel =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

const fallbackModel =
  process.env.GEMINI_FALLBACK_MODEL ||
  "gemini-2.5-flash-lite";

const ai =
  new GoogleGenAI({
    apiKey,
  });

function sleep(ms) {
  return new Promise(
    (resolve) => setTimeout(resolve, ms)
  );
}

async function generateWithModel(
  model,
  {
    prompt,
    systemPrompt = "",
    temperature = 0.2,
  }
) {
  const response =
    await ai.models.generateContent({
      model,

      contents: prompt,

      config: {
        systemInstruction:
          systemPrompt,

        temperature,

        maxOutputTokens: 2000,
      },
    });

  return {
    text: response.text || "",
    model,
    provider: "gemini",
  };
}

class GeminiProvider {
  async generate(options) {
    const delays = [
      1000,
      2000,
      4000,
    ];

    let lastError = null;

    for (
      let attempt = 0;
      attempt <= delays.length;
      attempt++
    ) {
      try {
        return await generateWithModel(
          primaryModel,
          options
        );
      } catch (error) {
        lastError = error;

        const status =
          error?.status ||
          error?.code ||
          error?.error?.code;

        const isRetryable =
          status === 503 ||
          status === "503" ||
          error?.message?.includes(
            "UNAVAILABLE"
          );

        if (!isRetryable) {
          throw error;
        }

        if (
          attempt < delays.length
        ) {
          await sleep(
            delays[attempt]
          );
        }
      }
    }

    console.warn(
      "Primary Gemini model unavailable. Trying fallback model."
    );

    try {
      return await generateWithModel(
        fallbackModel,
        options
      );
    } catch (fallbackError) {
      console.error(
        "Fallback Gemini model failed:",
        fallbackError
      );

      throw lastError ||
        fallbackError;
    }
  }
}

module.exports =
  GeminiProvider;