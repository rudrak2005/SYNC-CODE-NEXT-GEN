import * as Y from "yjs";

export function createCollaborationDocument() {
  const doc = new Y.Doc();

  const files = doc.getMap("files");

  return {
    doc,
    files
  };
}