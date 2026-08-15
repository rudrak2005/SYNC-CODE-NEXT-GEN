import * as Y from "yjs";

export function createYjsDocument() {
  const doc = new Y.Doc();

  const code = doc.getText("code");

  return {
    doc,
    code
  };
}