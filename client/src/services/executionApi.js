import api from "./api";

export const runCode = async (
  language,
  code,
  input = ""
) => {
  const response = await api.post("/execute", {
    language,
    code,
    input
  });

  return response.data.output;
};