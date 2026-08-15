const remoteCursors = new Map();


export function renderRemoteCursor(
  editor,
  cursor
) {
  if (!editor || !cursor) {
    return;
  }

  const {
    userId,
    userName,
    lineNumber,
    column
  } = cursor;


  if (
    !lineNumber ||
    !column
  ) {
    return;
  }


  const oldDecorations =
    remoteCursors.get(userId) || [];


  const decoration = {
    range: {
      startLineNumber: lineNumber,
      startColumn: column,
      endLineNumber: lineNumber,
      endColumn: column
    },

    options: {
      beforeContentClassName:
        "sync-code-remote-cursor",

      hoverMessage: {
        value: `**${userName || "User"}**`
      }
    }
  };


  const newDecorations =
    editor.deltaDecorations(
      oldDecorations,
      [decoration]
    );


  remoteCursors.set(
    userId,
    newDecorations
  );
}


export function removeRemoteCursor(
  editor,
  userId
) {
  if (!editor || !userId) {
    return;
  }

  const decorations =
    remoteCursors.get(userId);

  if (!decorations) {
    return;
  }


  editor.deltaDecorations(
    decorations,
    []
  );


  remoteCursors.delete(
    userId
  );
}


export function clearRemoteCursors(
  editor
) {
  if (!editor) {
    return;
  }


  remoteCursors.forEach(
    (decorations) => {
      editor.deltaDecorations(
        decorations,
        []
      );
    }
  );


  remoteCursors.clear();
}