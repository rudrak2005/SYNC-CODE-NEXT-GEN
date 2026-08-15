export function createCursorData({
  userId,
  userName,
  fileName,
  lineNumber,
  column
}) {
  return {
    userId,
    userName,
    fileName,
    lineNumber,
    column
  };
}