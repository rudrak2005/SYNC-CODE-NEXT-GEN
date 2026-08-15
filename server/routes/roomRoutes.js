const express = require("express");

const {
  createRoom,
  joinRoom
} = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  createRoom
);

router.post(
  "/:roomId/join",
  protect,
  joinRoom
);

module.exports = router;