import * as Y from "yjs";


export function runConflictTest() {

  const docA = new Y.Doc();
  const docB = new Y.Doc();


  const textA =
    docA.getText("code");

  const textB =
    docB.getText("code");


  textA.insert(
    0,
    "Hello A"
  );


  textB.insert(
    0,
    "Hello B"
  );


  const updateA =
    Y.encodeStateAsUpdate(docA);

  const updateB =
    Y.encodeStateAsUpdate(docB);


  Y.applyUpdate(
    docA,
    updateB
  );

  Y.applyUpdate(
    docB,
    updateA
  );


  console.log(
    "A:",
    textA.toString()
  );

  console.log(
    "B:",
    textB.toString()
  );


  console.log(
    "Same state:",
    textA.toString() ===
    textB.toString()
  );
}