export function getLanguageFromFileName(fileName) {
  const extension = fileName
    .split(".")
    .pop()
    .toLowerCase();

  const languages = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    md: "markdown"
  };

  return languages[extension] || "plaintext";
}