const crypto = require("crypto");

const generateRoomId = () => {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `SC-${randomPart}`;
};

module.exports = {
  generateRoomId
};