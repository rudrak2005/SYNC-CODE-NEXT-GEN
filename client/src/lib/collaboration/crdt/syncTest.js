import * as Y from "yjs";


export function runSyncTest() {

  const docA = new Y.Doc();
  const docB = new Y.Doc();


  const textA =
    docA.getText("code");

  const textB =
    docB.getText("code");


  const updateFromA =
    Y.encodeStateAsUpdate(docA);


  Y.applyUpdate(
    docB,
    updateFromA
  );


  textA.insert(
    0,
    "Hello from A"
  );


  const update =
    Y.encodeStateAsUpdate(docA);


  Y.applyUpdate(
    docB,
    update
  );


  console.log(
    "Document A:",
    textA.toString()
  );


  console.log(
    "Document B:",
    textB.toString()
  );


  return {
    docA,
    docB
  };
}