import * as Y from "yjs";

import {
  createCollaborationDocument
} from "./createDocument";

import {
  addFile,
  getAllFiles,
  updateFileContent
} from "./fileManager";


export function runCRDTTest() {

  const {
    doc,
    files
  } = createCollaborationDocument();


  addFile(
    files,
    "main.js",
    'console.log("Hello SyncCode");'
  );


  addFile(
    files,
    "index.html",
    "<h1>SyncCode</h1>"
  );


  addFile(
    files,
    "style.css",
    "body { margin: 0; }"
  );


  console.log(
    "Initial files:",
    getAllFiles(files)
  );


  updateFileContent(
    files,
    "main.js",
    'console.log("Updated by CRDT");'
  );


  console.log(
    "Updated files:",
    getAllFiles(files)
  );


  return {
    doc,
    files
  };
}