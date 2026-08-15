export function registerCursorListener(
  socket,
  onCursorUpdate
) {
  if (!socket) {
    return () => {};
  }

  const handleCursorUpdate = (cursor) => {
    onCursorUpdate(cursor);
  };

  socket.on(
    "cursor:update",
    handleCursorUpdate
  );

  return () => {
    socket.off(
      "cursor:update",
      handleCursorUpdate
    );
  };
}