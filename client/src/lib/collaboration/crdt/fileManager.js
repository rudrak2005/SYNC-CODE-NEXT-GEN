import * as Y from "yjs";
import { createFile } from "./fileModel";

export function addFile(files, fileName, content = "") {
  if (files.has(fileName)) {
    return files.get(fileName);
  }

  return createFile(
    files,
    fileName,
    content
  );
}


export function getFile(files, fileName) {
  return files.get(fileName);
}


export function updateFileContent(
  files,
  fileName,
  content
) {
  const file = files.get(fileName);

  if (!file) {
    return false;
  }

  file.set("content", content);

  return true;
}


export function getAllFiles(files) {
  const result = {};

  files.forEach((file, name) => {

    result[name] = {
      name: file.get("name"),
      content: file.get("content")
    };

  });

  return result;
}