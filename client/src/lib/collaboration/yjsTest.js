import * as Y from "yjs";

export function runYjsTest() {
  const doc = new Y.Doc();

  const text = doc.getText("code");

  text.observe((event) => {
    console.log(
      "Yjs change detected:",
      text.toString()
    );
  });

  text.insert(
    0,
    'console.log("Hello Yjs");'
  );

  text.insert(
    text.length,
    '\nconsole.log("Second change");'
  );

  return {
    doc,
    text
  };
}

export function runMultipleYjsTest() {
  const doc1 = new Y.Doc();
  const doc2 = new Y.Doc();

  const text1 = doc1.getText("code");
  const text2 = doc2.getText("code");

  text1.insert(
    0,
    "User A"
  );

  text2.insert(
    0,
    "User B"
  );

  console.log(
    "Document 1:",
    text1.toString()
  );

  console.log(
    "Document 2:",
    text2.toString()
  );
}