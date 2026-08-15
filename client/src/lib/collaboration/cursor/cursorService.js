import {
  createCursorData
} from "./cursorTypes";


export function sendCursorPosition({
  socket,
  user,
  fileName,
  lineNumber,
  column
}) {
  if (
    !socket ||
    !socket.connected ||
    !user ||
    !fileName
  ) {
    return;
  }


  const cursor =
    createCursorData({
      userId:
        user.id || user._id,

      userName:
        user.name || "Anonymous",

      fileName,

      lineNumber,

      column
    });


  socket.emit(
    "cursor:move",
    cursor
  );
}