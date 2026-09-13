import api from "./api";

export async function runCode({
  language = "javascript",
  code = "",
  input = "",
}) {
  const normalizedLanguage =
    String(language)
      .trim()
      .toLowerCase();

  const finalLanguage =
    normalizedLanguage === "js" ||
    normalizedLanguage === "jsx" ||
    normalizedLanguage === "node" ||
    normalizedLanguage === "nodejs"
      ? "javascript"
      : normalizedLanguage;

  console.log(
    "Execution language:",
    finalLanguage
  );

  const response =
    await api.post(
      "/execute",
      {
        language: finalLanguage,

        code: String(code || ""),

        input: String(input || ""),
      }
    );

  return response.data;
}