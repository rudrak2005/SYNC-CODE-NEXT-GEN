import * as Y from "yjs";

export function createFile(files, fileName, content = "") {
  const file = new Y.Map();

  file.set("name", fileName);
  file.set("content", content);

  files.set(fileName, file);

  return file;
}